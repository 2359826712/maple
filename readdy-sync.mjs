/**
 * Readdy 代码同步脚本（直接 Readdy API 通道）
 *
 * 目标：将本地目录（默认当前目录）中的代码文件上传到 Readdy 项目，生成一个新版本（不自动 Publish）。
 *
 * 安全约束（来自 playbook）：
 * - token 只在内存中使用，不打印、不落盘、不写日志文件。
 * - 只接受明确来自 `readdy_access_token` 键附近的值（Edge Local Storage leveldb 扫描）。
 *
 * 用法示例：
 *   node readdy-sync.mjs --project <PROJECT_ID>
 *   node readdy-sync.mjs --project <PROJECT_ID> --root "D:\\Desktop\\maple"
 *   node readdy-sync.mjs --project <PROJECT_ID> --remote-prefix frontend
 *   node readdy-sync.mjs --project <PROJECT_ID> --dry-run
 *
 * 可选环境变量：
 *   READDY_ACCESS_TOKEN    直接提供 token（不推荐落到 .env；如果用请只在当前 shell 中临时 export/set）
 *   READDY_EDGE_PROFILE    Edge profile 路径（例如 ...\\Microsoft\\Edge\\User Data\\Default）
 */
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const READDY_ORIGIN = 'https://readdy.ai';
const DEFAULT_MAX_MSG_PAGES = 12;

function usage() {
  console.error(`
readdy-sync.mjs

必填：
  --project <PROJECT_ID>           Readdy projectId（uuid）

可选：
  --root <DIR>                    本地项目根目录（默认当前目录）
  --remote-prefix <PATH>          远端路径前缀（例如 frontend）；用于覆盖已有子目录中的同路径文件
  --include <PATTERN>             上传包含规则（可多次填写）。默认：src/** + public/** + SEO 构建脚本 + 常见配置文件
  --exclude <PATTERN>             排除规则（可多次填写）。默认：node_modules/** out/** dist/** .env* **/*.log maple.zip
  --delete-git-removed            同步当前 Git 工作区中已删除的文件（用于目录迁移）
  --delete <REMOTE_FILE>          删除远端遗留文件（可多次填写）
  --delete-list <FILE>            从文本文件读取远端删除路径（每行一个，可多次填写）
  --edge-profile <DIR>            Edge profile 路径（默认：LOCALAPPDATA\\Microsoft\\Edge\\User Data\\Default）
  --max-pages <N>                 msg_list 最多扫描页数（默认：12）
  --parent-version <ID>           手动指定 parentVersionID（跳过 msg_list 自动取最新版本）
  --dry-run                        只输出将上传的文件清单与父版本信息，不执行上传
  --yes                            直接执行（跳过确认提示）
  --verbose                        输出更多信息（不会输出 token）

环境变量（可替代部分参数）：
  READDY_ACCESS_TOKEN
  READDY_EDGE_PROFILE
`.trim());
  process.exit(2);
}

function parseArgs(argv) {
  const out = {
    projectId: '',
    root: process.cwd(),
    remotePrefix: '',
    include: [],
    exclude: [],
    edgeProfile: '',
    maxPages: DEFAULT_MAX_MSG_PAGES,
    parentVersionID: '',
    dryRun: false,
    yes: false,
    verbose: false,
    deleteGitRemoved: false,
    deleteFiles: [],
    deleteListFiles: [],
  };
  const args = [...argv];
  while (args.length) {
    const key = args.shift();
    if (!key) break;
    if (key === '--project') out.projectId = String(args.shift() || '');
    else if (key === '--root') out.root = String(args.shift() || '');
    else if (key === '--remote-prefix') out.remotePrefix = String(args.shift() || '');
    else if (key === '--include') out.include.push(String(args.shift() || ''));
    else if (key === '--exclude') out.exclude.push(String(args.shift() || ''));
    else if (key === '--edge-profile') out.edgeProfile = String(args.shift() || '');
    else if (key === '--max-pages') out.maxPages = Number(args.shift() || DEFAULT_MAX_MSG_PAGES);
    else if (key === '--parent-version') out.parentVersionID = String(args.shift() || '');
    else if (key === '--dry-run') out.dryRun = true;
    else if (key === '--yes') out.yes = true;
    else if (key === '--verbose') out.verbose = true;
    else if (key === '--delete-git-removed') out.deleteGitRemoved = true;
    else if (key === '--delete') out.deleteFiles.push(String(args.shift() || ''));
    else if (key === '--delete-list') out.deleteListFiles.push(String(args.shift() || ''));
    else if (key === '-h' || key === '--help') usage();
    else throw new Error(`未知参数: ${key}`);
  }
  return out;
}

function redactString(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[redacted-jwt]');
}

function assertProjectId(value) {
  const text = String(value || '').trim();
  if (!text) throw new Error('缺少 --project <PROJECT_ID>');
  // 允许 uuid 或其它（Readdy 目前常见是 uuid）
  if (text.length < 6) throw new Error('PROJECT_ID 看起来不正确（过短）');
  return text;
}

function defaultEdgeProfile() {
  const local = process.env.LOCALAPPDATA || '';
  if (!local) return '';
  return path.join(local, 'Microsoft', 'Edge', 'User Data', 'Default');
}

function globToRegExp(glob) {
  // 极简 glob：支持 **、*、?，路径分隔符统一为 /
  const g = String(glob || '').replace(/\\/g, '/');
  let re = '^';
  for (let i = 0; i < g.length; i += 1) {
    const ch = g[i];
    if (ch === '*') {
      const next = g[i + 1];
      if (next === '*') {
        i += 1;
        re += '.*';
      } else {
        re += '[^/]*';
      }
    } else if (ch === '?') {
      re += '[^/]';
    } else {
      re += ch.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
  }
  re += '$';
  return new RegExp(re);
}

function isProbablyTextFile(file) {
  const ext = path.extname(file).toLowerCase();
  // 按 Readdy code_edit 常见可编辑文本类型做白名单，避免把二进制塞进 content
  const textExts = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
    '.css', '.scss', '.sass', '.less',
    '.html', '.htm',
    '.json', '.jsonc',
    '.md', '.txt',
    '.yml', '.yaml',
    '.svg',
    '.d.ts',
    '.vue',
    '.env', '.env.local', '.env.development', '.env.production',
  ]);
  if (textExts.has(ext)) return true;
  // 无扩展名：按文本处理（例如 README）
  if (!ext) return true;
  return false;
}

async function walkFiles(rootDir) {
  const results = [];
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const ent of entries) {
      const abs = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        await walk(abs);
      } else if (ent.isFile()) {
        results.push(abs);
      }
    }
  }
  await walk(rootDir);
  return results;
}

function normalizeRelPath(rootDir, absFile) {
  const rel = path.relative(rootDir, absFile);
  return rel.split(path.sep).join('/');
}

function normalizeRemotePrefix(value) {
  const prefix = String(value || '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  if (!prefix) return '';
  const segments = prefix.split('/');
  if (segments.some(segment => !segment || segment === '.' || segment === '..')) {
    throw new Error(`远端路径前缀不安全: ${value}`);
  }
  return prefix;
}

function makeHeaders(token, projectId) {
  return {
    'content-type': 'application/json',
    authorization: `Bearer ${token}`,
    'X-Project-Id': projectId,
  };
}

async function readResponse(res) {
  const text = await res.text().catch(() => '');
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  return {
    ok: res.ok,
    status: res.status,
    code: json?.code ?? null,
    message: json?.meta?.message ?? json?.message ?? null,
    data: json?.data ?? null,
    rawStart: json ? '' : redactString(text.slice(0, 500)),
    json,
  };
}

async function readdyPost(token, projectId, urlPath, body) {
  const url = new URL(urlPath, READDY_ORIGIN).toString();
  const res = await fetch(url, {
    method: 'POST',
    headers: makeHeaders(token, projectId),
    body: JSON.stringify(body),
  });
  const out = await readResponse(res);
  if (!out.ok || (out.code && out.code !== 'OK')) {
    throw new Error(`${urlPath} 失败: ${out.status}/${out.code || 'NO_CODE'} ${out.message || out.rawStart || ''}`.trim());
  }
  return out;
}

function parseContent(content) {
  try {
    return typeof content === 'object' ? content : JSON.parse(content || 'null');
  } catch {
    return null;
  }
}

function normalizeNumeric(value) {
  const text = String(value ?? '').trim();
  return /^\d+$/.test(text) ? Number(text) : text;
}

function cardsFromMessages(rows) {
  const cards = [];
  for (const row of rows || []) {
    const parsed = parseContent(row?.content);
    const entries = Array.isArray(parsed?.content) ? parsed.content : [];
    for (const entry of entries) {
      const data = entry?.data || {};
      const versionID = normalizeNumeric(data.projectVersionId);
      const showID = normalizeNumeric(data.showId);
      if (!versionID || !showID) continue;
      cards.push({
        msgId: row?.id ?? null,
        createdAt: row?.createdAt ?? row?.createAt ?? '',
        projectVersionId: Number(versionID),
        showId: Number(showID),
        recordReference: Number(parsed?.recordReference || 0),
      });
    }
  }
  const seen = new Set();
  return cards.filter(card => {
    const key = `${card.projectVersionId}:${card.showId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function getVersionCards(token, projectId, maxPages) {
  const cards = [];
  for (let pageNum = 1; pageNum <= maxPages; pageNum += 1) {
    const out = await readdyPost(token, projectId, '/api/project/msg_list', {
      projectId,
      page: { pageNum, pageSize: 100 },
    });
    const rows = out.data?.projectMsgs || out.json?.data?.projectMsgs || [];
    cards.push(...cardsFromMessages(rows));
    if (rows.length < 100) break;
  }
  cards.sort((a, b) => {
    const showDelta = Number(a.showId || 0) - Number(b.showId || 0);
    if (showDelta) return showDelta;
    return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
  });
  return {
    count: cards.length,
    latest: cards[cards.length - 1] || null,
    cards,
  };
}

function findReaddyAccessTokenFromEdgeLeveldb(edgeProfileDir) {
  const profile = edgeProfileDir || '';
  const levelRoot = path.join(profile, 'Local Storage', 'leveldb');
  const jwtRe = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;
  if (!profile) throw new Error('Edge profile 路径为空，无法读取 token。');
  if (!fssync.existsSync(levelRoot)) {
    throw new Error(`未找到 Edge Local Storage leveldb: ${levelRoot}`);
  }
  const names = fssync.readdirSync(levelRoot);
  const candidates = [];
  for (const name of names) {
    if (!/\.(log|ldb)$/i.test(name)) continue;
    const filePath = path.join(levelRoot, name);
    let text = '';
    try {
      // leveldb 文件可能包含非 utf8 字节，按 latin1 保留原始字节映射
      text = fssync.readFileSync(filePath).toString('latin1');
    } catch {
      continue;
    }
    let idx = text.indexOf('readdy_access_token');
    while (idx >= 0) {
      const windowText = text.slice(Math.max(0, idx - 2000), idx + 8000);
      for (const match of windowText.matchAll(jwtRe)) {
        const token = match[0];
        let exp = 0;
        try {
          exp = Number(JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')).exp || 0);
        } catch {
          exp = 0;
        }
        candidates.push({ token, exp, length: token.length });
      }
      idx = text.indexOf('readdy_access_token', idx + 1);
    }
  }
  if (candidates.length) {
    const now = Math.floor(Date.now() / 1000);
    candidates.sort((a, b) => {
      const validDelta = Number(b.exp > now) - Number(a.exp > now);
      return validDelta || b.exp - a.exp || b.length - a.length;
    });
    return candidates[0].token;
  }
  throw new Error('未能确认找到 readdy_access_token。请确认 Edge 已登录 Readdy，且脚本读取的是同一个 profile。');
}

async function collectUploadEdits(rootDir, includePatterns, excludePatterns, remotePrefix, verbose, readContent = true) {
  const allFilesAbs = await walkFiles(rootDir);
  const includes = includePatterns.map(globToRegExp);
  const excludes = excludePatterns.map(globToRegExp);
  const picked = [];
  const skippedBinary = [];
  for (const abs of allFilesAbs) {
    const rel = normalizeRelPath(rootDir, abs);
    if (includes.length && !includes.some(re => re.test(rel))) continue;
    if (excludes.some(re => re.test(rel))) continue;
    if (!isProbablyTextFile(rel)) {
      skippedBinary.push(rel);
      continue;
    }
    picked.push({ abs, rel });
  }
  picked.sort((a, b) => a.rel.localeCompare(b.rel));

  const edits = [];
  let totalBytes = 0;
  for (const item of picked) {
    if (readContent) {
      const content = await fs.readFile(item.abs, 'utf8');
      totalBytes += Buffer.byteLength(content);
      edits.push({ action: 'edit', file: remotePrefix ? `${remotePrefix}/${item.rel}` : item.rel, content });
    } else {
      const stat = await fs.stat(item.abs);
      totalBytes += Number(stat.size || 0);
      edits.push({ action: 'edit', file: remotePrefix ? `${remotePrefix}/${item.rel}` : item.rel });
    }
  }

  if (verbose && skippedBinary.length) {
    console.error(`[info] 跳过疑似二进制文件 ${skippedBinary.length} 个（如需上传请改为文本或用其它方式管理资源）：`);
    for (const name of skippedBinary.slice(0, 50)) console.error(`  - ${name}`);
    if (skippedBinary.length > 50) console.error(`  ... +${skippedBinary.length - 50}`);
  }

  return { edits, totalBytes };
}

function collectGitRemovedEdits(rootDir, remotePrefix) {
  const output = execFileSync(
    'git',
    ['diff', '--name-only', '--diff-filter=D', '--relative', '--'],
    { cwd: rootDir, encoding: 'utf8', windowsHide: true },
  );
  return [...new Set(output.split(/\r?\n/).map((value) => value.trim()).filter(Boolean))]
    .filter((file) => !file.startsWith('../') && !path.isAbsolute(file))
    .map((file) => ({
      action: 'delete',
      file: remotePrefix ? `${remotePrefix}/${file.replace(/\\/g, '/')}` : file.replace(/\\/g, '/'),
    }));
}

async function confirmOrThrow(message) {
  // 非交互环境（或 piped）就直接失败，避免误上传
  if (!process.stdin.isTTY) throw new Error('当前环境不可交互，且未提供 --yes。为安全起见已停止。');
  process.stderr.write(`${message} 输入 yes 继续: `);
  const input = await new Promise(resolve => {
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', chunk => resolve(String(chunk || '').trim()));
  });
  if (input !== 'yes') throw new Error('用户取消。');
}

async function syncVersionMessage(token, projectId, maxPages, { parentVersionID, versionID, showID }) {
  const versions = await getVersionCards(token, projectId, maxPages);
  const versionText = String(versionID || '');
  const showText = String(showID || '');
  const exists = versions.cards.some(
    card => String(card.projectVersionId || '') === versionText || String(card.showId || '') === showText,
  );
  if (exists) return { skipped: true, reason: 'version card already exists' };

  const createdAt = Date.now();
  const requestId = `direct-upload-${Math.floor(createdAt / 1000)}`;
  const content = {
    content: [{
      type: 3,
      data: {
        text: '',
        image: '',
        projectVersionId: versionID,
        showId: showID,
        recordStatus: 0,
        requestId,
        requestIds: [requestId],
        sessionId: `${requestId}-session`,
        eventData: [{
          event: 'data',
          data: {
            text: `Direct API uploaded version ${showID}.`,
            name: '',
            files: null,
            action: '',
            status: '',
            data: '',
            duration: 0,
            isThinking: false,
            toolData: {
              status: '',
              versionId: 0,
              listId: '',
              todos: null,
              merge: false,
              questions: null,
              secrets: null,
            },
          },
        }],
        errorInfo: null,
      },
    }],
    status: 0,
    type: 1,
    recordReference: Number(parentVersionID) || 0,
    revertShowId: 0,
    fromMsgId: 0,
    tag: 0,
    author: null,
  };

  const out = await readdyPost(token, projectId, `/api/project/msg?projectId=${encodeURIComponent(projectId)}`, {
    projectId,
    projectID: projectId,
    msgId: -createdAt,
    role: 0,
    content: JSON.stringify(content),
    createdAt,
  });
  return { status: out.status, code: out.code, skipped: false };
}

async function main() {
  const cfg = parseArgs(process.argv.slice(2));
  const projectId = assertProjectId(cfg.projectId || process.env.READDY_PROJECT_ID);
  const rootDir = path.resolve(cfg.root);
  const remotePrefix = normalizeRemotePrefix(cfg.remotePrefix);
  const maxPages = Math.max(1, Math.min(50, Number(cfg.maxPages) || DEFAULT_MAX_MSG_PAGES));

  const defaultInclude = [
    'src/**',
    'public/**',
    'scripts/generate-localized-static-routes.mjs',
    'scripts/verify-seo-output.mjs',
    'index.html',
    'package.json',
    'package-lock.json',
    'vite.config.*',
    'next.config.*',
    'next-env.d.ts',
    'tsconfig*.json',
    'postcss.config.*',
    'tailwind.config.*',
    'eslint.config.*',
    'auto-imports.d.ts',
    'vite-env.d.ts',
    'README.md',
  ];
  const defaultExclude = [
    'node_modules/**',
    'out/**',
    'dist/**',
    '.next/**',
    '.ssg/**',
    '.env*',
    '**/*.log',
    'maple.zip',
    '.git/**',
  ];
  const include = (cfg.include.length ? cfg.include : defaultInclude).filter(Boolean);
  const exclude = (cfg.exclude.length ? cfg.exclude : defaultExclude).filter(Boolean);

  for (const deleteListFile of cfg.deleteListFiles) {
    const lines = fssync.readFileSync(path.resolve(deleteListFile), 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));
    cfg.deleteFiles.push(...lines);
  }

  const { edits, totalBytes } = await collectUploadEdits(rootDir, include, exclude, remotePrefix, cfg.verbose, !cfg.dryRun);
  if (cfg.deleteGitRemoved) {
    const removedEdits = collectGitRemovedEdits(rootDir, remotePrefix);
    const editedFiles = new Set(edits.map((edit) => edit.file));
    edits.push(...removedEdits.filter((edit) => !editedFiles.has(edit.file)));
  }
  for (const requestedFile of cfg.deleteFiles) {
    const normalizedFile = String(requestedFile || '').replace(/\\/g, '/').replace(/^\/+/, '');
    if (!normalizedFile || normalizedFile.split('/').some((segment) => !segment || segment === '.' || segment === '..')) {
      throw new Error(`远端删除路径不安全: ${requestedFile}`);
    }
    const remoteFile = remotePrefix ? `${remotePrefix}/${normalizedFile}` : normalizedFile;
    if (!edits.some((edit) => edit.file === remoteFile)) edits.push({ action: 'delete', file: remoteFile });
  }
  if (!edits.length) throw new Error('没有匹配到需要上传的文件（include/exclude 规则可能不正确）。');

  // dry-run：只输出本地上传清单，不触发 token 获取，也不会访问 Readdy API
  const summary = {
    ok: true,
    projectId,
    root: rootDir,
    remotePrefix,
    parentVersionID: cfg.parentVersionID ? Number(cfg.parentVersionID) : null,
    latestBefore: null,
    upload: {
      files: edits.length,
      bytes: totalBytes,
      mb: Math.round((totalBytes / (1024 * 1024)) * 100) / 100,
      sampleFiles: edits.slice(0, 30).map(e => e.file),
      sampleTruncated: edits.length > 30,
    },
    dryRun: cfg.dryRun,
    postUploadSteps: [
      'Readdy 的 SEO Configuration 按版本独立；新版本上传后需要重新 Generate，再发布域名。',
      'code_edit 只同步文本源码；新增或替换的 PNG/JPG 等二进制资源需要通过 Readdy Files 上传。',
    ],
    note: cfg.dryRun
      ? 'dry-run 不会访问 Readdy；真实上传时将通过 msg_list 自动获取最新 parentVersionID（除非你手动指定 --parent-version）。'
      : '本脚本不会自动 Publish/Update 生产环境。',
  };

  if (cfg.dryRun) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  // token 读取：优先 env；否则扫描 Edge leveldb
  const tokenFromEnv = process.env.READDY_ACCESS_TOKEN || '';
  const edgeProfile =
    cfg.edgeProfile ||
    process.env.READDY_EDGE_PROFILE ||
    defaultEdgeProfile();
  const token = tokenFromEnv || findReaddyAccessTokenFromEdgeLeveldb(edgeProfile);
  if (!token) throw new Error('无法获取 Readdy token。');

  if (cfg.verbose) {
    console.error(`[info] root: ${rootDir}`);
    console.error(`[info] include: ${include.join(', ')}`);
    console.error(`[info] exclude: ${exclude.join(', ')}`);
    console.error(`[info] tokenPresent: ${Boolean(tokenFromEnv || token)}`);
    console.error(`[info] edgeProfile: ${edgeProfile || '(empty)'}`);
  }

  let parentVersionID = cfg.parentVersionID ? Number(cfg.parentVersionID) : 0;
  let latestBefore = null;
  if (!parentVersionID) {
    const versionsBefore = await getVersionCards(token, projectId, maxPages);
    latestBefore = versionsBefore.latest;
    if (!latestBefore?.projectVersionId) {
      throw new Error('未能从 msg_list 获取 parentVersionID。可尝试 --parent-version 手动指定。');
    }
    parentVersionID = Number(latestBefore.projectVersionId);
  }

  if (!cfg.yes) {
    await confirmOrThrow(
      `即将上传到 Readdy 项目 ${projectId}，基于 parentVersionID=${parentVersionID}，文件数=${edits.length}，总大小≈${summary.upload.mb}MB。`,
    );
  }

  // code_edit 上传
  const uploadOut = await readdyPost(token, projectId, '/gapi/project/code_edit', {
    projectId,
    parentVersionID,
    edits,
  });
  const versionID = uploadOut.data?.versionID ?? null;
  const showID = uploadOut.data?.showID ?? null;

  // 同步版本卡片（可选）
  let messageSync = null;
  if (versionID && showID) {
    try {
      messageSync = await syncVersionMessage(token, projectId, maxPages, {
        parentVersionID,
        versionID,
        showID,
      });
    } catch (e) {
      messageSync = { ok: false, error: String(e?.message || e) };
    }
  }

  const versionsAfter = await getVersionCards(token, projectId, maxPages).catch(() => null);
  const latestAfter = versionsAfter?.latest ?? null;

  console.log(JSON.stringify({
    ok: true,
    projectId,
    parentVersionID,
    uploadedFiles: edits.length,
    uploadedBytes: totalBytes,
    codeEdit: {
      status: uploadOut.status,
      code: uploadOut.code,
      versionID,
      showID,
    },
    messageSync,
    latestAfter,
    postUploadSteps: summary.postUploadSteps,
  }, null, 2));
}

main().catch(error => {
  const msg = redactString(error?.stack || error?.message || String(error));
  console.error(`SYNC_FAILED: ${msg}`);
  process.exit(1);
});
