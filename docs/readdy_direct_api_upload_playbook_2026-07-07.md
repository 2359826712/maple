# Readdy 项目代码上传通用手册

日期：2026-07-07

本文把 CFB27 Version 215 成功上传使用的方案整理成跨项目通用流程。其它 Readdy 项目可以按本文替换项目变量后直接使用。

## 1. 适用范围

适用于：

- 项目托管在 Readdy。
- 本地有项目源码。
- 浏览器里已经登录 Readdy。
- 需要把本地代码文件上传为 Readdy 新版本。
- 只创建 Readdy 新版本或预览版本，不自动发布线上。

不适用于：

- 未登录 Readdy 的环境。
- 需要绕过 Readdy 权限或认证的场景。
- 需要直接点击 Publish / Update 发布生产环境的场景。
- token、cookie、浏览器 profile 不可信的机器。

## 2. 三条上传通道

### 2.1 直接 Readdy API 通道

这是 CFB27 Version 215 成功使用的通道。

链路：

```text
当前浏览器 Readdy 登录态
  -> 本地 Node 脚本只在内存中读取 readdy_access_token
  -> POST /api/project/msg_list 读取最新版本卡片
  -> POST /gapi/project/code_edit 上传文件
  -> POST /api/project/msg 同步右侧历史版本卡片
```

优点：

- 不依赖 `127.0.0.1:9222`。
- 不依赖 `cdp.mjs`。
- 可以一次上传多文件。
- 适合 CDP 外部端口失效时继续工作。

限制：

- 必须能从当前浏览器登录态安全读取明确的 `readdy_access_token`。
- 不得把来源不明的 JWT 当作 Readdy token 使用。
- 不得输出、记录、提交 token。

### 2.2 Readdy API Helper 插件通道

链路：

```text
Edge/Chrome 中加载 Readdy API Helper
  -> 插件弹窗选择 Readdy 项目页
  -> 检测登录态
  -> 读取版本卡片
  -> 填入最新 parentVersionID
  -> 选择文件并调用 code_edit
```

优点：

- 插件内置 `chrome.debugger`，不需要 `--remote-debugging-port=9222`。
- 不需要本地脚本读取 token。
- 适合手动或半自动上传。

限制：

- 当前插件没有给本地 Node 脚本暴露 bridge。
- `cdp.mjs` 不能直接调用插件内部的 `chrome.debugger`。
- 必须在浏览器扩展弹窗中操作。

### 2.3 外部 CDP / cdp.mjs 通道

链路：

```text
Edge 使用 --remote-debugging-port=9222 启动
  -> node cdp.mjs 连接 http://127.0.0.1:9222
  -> 在 Readdy 项目页上下文中执行 code_edit
```

优点：

- 可以全自动执行。
- 可以沿用已有 `cdp.mjs readdyCodeEdit`。

限制：

- 必须真的监听 `127.0.0.1:9222`。
- Edge 新版本或默认 profile 可能不允许该方式稳定生效。
- 这条通道和插件 `chrome.debugger` 是两套不同机制。

## 3. 关键概念

### 3.1 `showID` 和 `versionID`

Readdy UI 显示的 Version 号通常是 `showID`。

上传接口需要的父版本是 `versionID`，也就是历史卡片里的真实 `projectVersionId`。

不要把 `showID` 当作 `parentVersionID`。

示例：

```text
Version 215 / versionID 11751125
```

含义：

- `215` 是 UI 版本号，也叫 `showID`。
- `11751125` 是真实版本 ID，也叫 `versionID` 或 `projectVersionId`。

下一次上传时应该使用 `11751125` 作为 `parentVersionID`。

### 3.2 `X-Project-Id` 必须存在

直接调用 Readdy API 时，`/gapi/project/code_edit` 需要同时提供：

- body 里的 `projectId`
- header 里的 `X-Project-Id`

缺少 `X-Project-Id` 时，可能返回：

```text
400: projectId is required
```

### 3.3 上传后必须同步历史卡片

`code_edit` 成功后会生成新版本，但 Readdy 右侧历史版本卡片可能不会自动出现。

需要再调用：

```text
POST /api/project/msg?projectId=<projectId>
```

同步一条版本卡片记录。

## 4. 项目变量清单

每个项目先填写这些变量。

```text
PROJECT_NAME=<项目名称>
PROJECT_ROOT=<本地项目绝对路径>
PROJECT_ID=<Readdy projectId>
PROJECT_NEEDLE=<项目短 ID 或 URL 匹配片段>
READDY_PROJECT_URL=https://readdy.ai/project/<PROJECT_ID>
UPLOAD_ROOT=<通常等于 PROJECT_ROOT>
UPLOAD_INCLUDE=<要上传的路径规则，例如 src/** public/** package.json>
UPLOAD_EXCLUDE=<排除规则，例如 .env node_modules reports dist out logs>
```

CFB27 示例：

```text
PROJECT_NAME=cfb27
PROJECT_ROOT=C:\Code\ABD\Code\cfb27
PROJECT_ID=8d51068f-ed0c-4609-9eb1-3cae9b3c77f9
PROJECT_NEEDLE=8d51068f
READDY_PROJECT_URL=https://readdy.ai/project/8d51068f-ed0c-4609-9eb1-3cae9b3c77f9
UPLOAD_INCLUDE=src/** public/**
UPLOAD_EXCLUDE=.env node_modules reports out
```

## 5. 上传前检查

在项目根目录执行：

```powershell
git status --short --branch
git rev-parse --short HEAD
```

根据项目实际情况执行构建或测试：

```powershell
npm run build
npm run type-check
```

检查上传清单：

```powershell
$files = git show --name-only --pretty=format: HEAD | Where-Object {
  $_ -and ($_ -match '^(src/|public/)' )
}
$total = 0
foreach ($f in $files) { $total += (Get-Item -LiteralPath $f).Length }
[pscustomobject]@{
  Count = $files.Count
  TotalBytes = $total
  TotalMB = [Math]::Round($total / 1MB, 2)
} | Format-List
```

要求：

- 工作树状态已确认。
- 构建或测试通过。
- 上传清单不包含敏感文件。
- 上传清单不包含 `node_modules`、构建缓存、日志、浏览器 profile。
- 上传前明确知道要基于哪个 Readdy `versionID`。

## 6. 直接 Readdy API 上传流程

### 6.1 安全规则

必须遵守：

- token 只在内存中使用。
- 不在终端打印 token。
- 不把 token 写进文档、日志、报告、commit message。
- 只接受明确来自 `readdy_access_token` 键的值。
- 如果只能扫描到一堆 JWT，但无法确认哪个是 Readdy token，立即停止。
- 不要修改真实运行配置来脱敏。

### 6.2 读取最新版本卡片

接口：

```text
POST https://readdy.ai/api/project/msg_list
```

header：

```text
content-type: application/json
authorization: Bearer <readdy_access_token>
X-Project-Id: <PROJECT_ID>
```

body：

```json
{
  "projectId": "<PROJECT_ID>",
  "page": {
    "pageNum": 1,
    "pageSize": 100
  }
}
```

从返回的 `projectMsgs[].content` 中解析版本卡片，找到最新：

```json
{
  "projectVersionId": 11751125,
  "showId": 215
}
```

这里的 `projectVersionId` 才是下一次上传要用的 `parentVersionID`。

### 6.3 上传文件

接口：

```text
POST https://readdy.ai/gapi/project/code_edit
```

header：

```text
content-type: application/json
authorization: Bearer <readdy_access_token>
X-Project-Id: <PROJECT_ID>
```

body：

```json
{
  "projectId": "<PROJECT_ID>",
  "parentVersionID": 11751125,
  "edits": [
    {
      "action": "edit",
      "file": "src/pages/home/page.tsx",
      "content": "<完整文件内容>"
    }
  ]
}
```

成功返回应包含：

```json
{
  "code": "OK",
  "data": {
    "versionID": 11760000,
    "showID": 216
  }
}
```

记录：

```text
parentVersionID=<上传前最新 versionID>
newShowID=<返回 showID>
newVersionID=<返回 versionID>
uploadedFiles=<文件数>
uploadedBytes=<字节数>
```

### 6.4 同步 Readdy 右侧历史版本卡片

接口：

```text
POST https://readdy.ai/api/project/msg?projectId=<PROJECT_ID>
```

header 同上。

body 结构要包含：

- `projectId`
- `projectID`
- `msgId`
- `role`
- `content`
- `createdAt`

`content` 内部关键字段：

```json
{
  "content": [
    {
      "type": 3,
      "data": {
        "projectVersionId": 11760000,
        "showId": 216,
        "recordStatus": 0,
        "eventData": [
          {
            "event": "data",
            "data": {
              "text": "Codex uploaded version 216."
            }
          }
        ]
      }
    }
  ],
  "status": 0,
  "type": 1,
  "recordReference": 11751125
}
```

同步前建议先用 `msg_list` 查重：

- 如果已有相同 `projectVersionId`，不要重复写历史卡片。
- 如果已有相同 `showId`，不要重复写历史卡片。

## 7. 可复用 Node 脚本模板

下面模板是最小可用结构。使用前必须替换 `CONFIG`。

注意：

- 模板不会打印 token。
- 模板只允许从明确 `readdy_access_token` 附近提取 JWT。
- 如果 token 不可确认，会直接失败。
- 默认只上传当前 `HEAD` 变更中符合 include 的文件。

```js
// readdy-direct-upload.mjs
import fs from "node:fs";
import path from "node:path";
import cp from "node:child_process";

const CONFIG = {
  projectRoot: "C:/path/to/project",
  projectId: "<REPLACE_WITH_READDY_PROJECT_ID>",
  edgeProfile: path.join(process.env.LOCALAPPDATA, "Microsoft", "Edge", "User Data", "Default"),
  includePattern: /^(src|public)\//,
  excludePattern: /(^|\/)(node_modules|\.env|reports|out|dist|logs)(\/|$)/,
  maxMsgPages: 12,
};

function findReaddyAccessToken() {
  const levelRoot = path.join(CONFIG.edgeProfile, "Local Storage", "leveldb");
  const jwtRe = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;
  if (!fs.existsSync(levelRoot)) throw new Error("Edge Local Storage leveldb not found.");

  for (const fileName of fs.readdirSync(levelRoot)) {
    if (!/\.(log|ldb)$/.test(fileName)) continue;
    const filePath = path.join(levelRoot, fileName);
    const text = fs.readFileSync(filePath).toString("latin1");
    const keyIndex = text.indexOf("readdy_access_token");
    if (keyIndex < 0) continue;

    const windowText = text.slice(Math.max(0, keyIndex - 2000), keyIndex + 8000);
    const matches = [...windowText.matchAll(jwtRe)].map((match) => match[0]);
    if (matches.length) return matches.sort((a, b) => b.length - a.length)[0];
  }

  throw new Error("No confirmed readdy_access_token found. Do not use arbitrary JWT values.");
}

function makeHeaders(token) {
  return {
    "content-type": "application/json",
    authorization: `Bearer ${token}`,
    "X-Project-Id": CONFIG.projectId,
  };
}

async function readResponse(res) {
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return {
    ok: res.ok,
    status: res.status,
    code: json?.code || null,
    message: json?.meta?.message || json?.message || null,
    data: json?.data || null,
    json,
    rawStart: json ? "" : text.slice(0, 500),
  };
}

async function readdyPost(token, url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: makeHeaders(token),
    body: JSON.stringify(body),
  });
  const out = await readResponse(res);
  if (!out.ok || (out.code && out.code !== "OK")) {
    throw new Error(`${url} failed ${out.status}/${out.code || "NO_CODE"}: ${out.message || out.rawStart}`);
  }
  return out;
}

function normalizeVersionId(value) {
  const text = String(value || "").trim();
  return /^\d+$/.test(text) ? Number(text) : text;
}

function parseContent(content) {
  try {
    return typeof content === "object" ? content : JSON.parse(content || "null");
  } catch {
    return null;
  }
}

function cardsFromMessages(rows, pageNum) {
  const cards = [];
  for (const msg of rows || []) {
    const parsed = parseContent(msg.content);
    const entries = Array.isArray(parsed?.content) ? parsed.content : [];
    for (const entry of entries) {
      const data = entry?.data || {};
      const projectVersionId = normalizeVersionId(data.projectVersionId);
      const showId = normalizeVersionId(data.showId);
      if (!projectVersionId || !showId) continue;
      cards.push({
        pageNum,
        msgId: msg.id || null,
        createdAt: msg.createdAt || msg.createAt || "",
        projectVersionId,
        showId,
      });
    }
  }
  return cards;
}

async function getVersionCards(token) {
  let cards = [];
  for (let pageNum = 1; pageNum <= CONFIG.maxMsgPages; pageNum += 1) {
    const out = await readdyPost(token, "https://readdy.ai/api/project/msg_list", {
      projectId: CONFIG.projectId,
      page: { pageNum, pageSize: 100 },
    });
    const rows = out.data?.projectMsgs || out.json?.data?.projectMsgs || [];
    cards.push(...cardsFromMessages(rows, pageNum));
    if (rows.length < 100) break;
  }

  const seen = new Set();
  cards = cards.filter((card) => {
    const key = `${card.projectVersionId}:${card.showId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

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

function getUploadFiles() {
  const output = cp.execSync("git show --name-only --pretty=format: HEAD", {
    cwd: CONFIG.projectRoot,
    encoding: "utf8",
  });
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((file) => CONFIG.includePattern.test(file))
    .filter((file) => !CONFIG.excludePattern.test(file))
    .filter((file) => fs.existsSync(path.join(CONFIG.projectRoot, file)));
}

async function syncVersionMessage(token, { parentVersionID, versionID, showID }) {
  const versions = await getVersionCards(token);
  const versionText = String(versionID || "");
  const showText = String(showID || "");
  const exists = versions.cards.some(
    (card) => String(card.projectVersionId || "") === versionText || String(card.showId || "") === showText
  );
  if (exists) return { skipped: true, reason: "version card already exists" };

  const createdAt = Date.now();
  const requestId = `direct-upload-${Math.floor(createdAt / 1000)}`;
  const content = {
    content: [
      {
        type: 3,
        data: {
          text: "",
          image: "",
          projectVersionId: versionID,
          showId: showID,
          recordStatus: 0,
          requestId,
          requestIds: [requestId],
          sessionId: `${requestId}-session`,
          eventData: [
            {
              event: "data",
              data: {
                text: `Direct API uploaded version ${showID}.`,
                name: "",
                files: null,
                action: "",
                status: "",
                data: "",
                duration: 0,
                isThinking: false,
                toolData: {
                  status: "",
                  versionId: 0,
                  listId: "",
                  todos: null,
                  merge: false,
                  questions: null,
                  secrets: null,
                },
              },
            },
          ],
          errorInfo: null,
        },
      },
    ],
    status: 0,
    type: 1,
    recordReference: Number(parentVersionID) || 0,
    revertShowId: 0,
    fromMsgId: 0,
    tag: 0,
    author: null,
  };

  return readdyPost(token, `https://readdy.ai/api/project/msg?projectId=${encodeURIComponent(CONFIG.projectId)}`, {
    projectId: CONFIG.projectId,
    projectID: CONFIG.projectId,
    msgId: -createdAt,
    role: 0,
    content: JSON.stringify(content),
    createdAt,
  });
}

async function main() {
  const token = findReaddyAccessToken();
  const versionsBefore = await getVersionCards(token);
  if (!versionsBefore.latest?.projectVersionId) {
    throw new Error("No Readdy parent version found.");
  }

  const parentVersionID = versionsBefore.latest.projectVersionId;
  const files = getUploadFiles();
  if (!files.length) throw new Error("No upload files matched.");

  const edits = files.map((file) => ({
    action: "edit",
    file,
    content: fs.readFileSync(path.join(CONFIG.projectRoot, file), "utf8"),
  }));

  const uploadedBytes = edits.reduce((sum, edit) => sum + Buffer.byteLength(edit.content), 0);

  const upload = await readdyPost(token, "https://readdy.ai/gapi/project/code_edit", {
    projectId: CONFIG.projectId,
    parentVersionID,
    edits,
  });

  const versionID = upload.data?.versionID;
  const showID = upload.data?.showID;
  let messageSync = null;
  if (versionID && showID) {
    messageSync = await syncVersionMessage(token, { parentVersionID, versionID, showID });
  }

  const versionsAfter = await getVersionCards(token);

  console.log(
    JSON.stringify(
      {
        ok: true,
        parentVersionID,
        uploadedFiles: edits.length,
        uploadedBytes,
        codeEdit: {
          status: upload.status,
          code: upload.code,
          versionID,
          showID,
        },
        messageSync: messageSync
          ? {
              status: messageSync.status || null,
              code: messageSync.code || null,
              skipped: Boolean(messageSync.skipped),
              reason: messageSync.reason || null,
            }
          : null,
        latestAfter: versionsAfter.latest,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(`UPLOAD_FAILED: ${error.message}`);
  process.exit(1);
});
```

运行：

```powershell
node .\readdy-direct-upload.mjs
```

## 8. 插件 CDP 和 `cdp.mjs` 的关系

Readdy API Helper 插件可以直接控制 CDP，但它使用的是：

```text
chrome.debugger
```

`cdp.mjs` 使用的是：

```text
http://127.0.0.1:9222/json/...
```

这两者不是同一条通道。

结论：

- 插件 CDP 可用，不代表 `cdp.mjs` 可用。
- `127.0.0.1:9222` 可用，不代表插件已加载。
- 现有 `cdp.mjs` 不能直接调用插件内部的 `chrome.debugger`。

如果要让 `cdp.mjs` 使用插件 CDP，需要新增 bridge：

```text
cdp.mjs
  -> 本地 localhost relay 或命令队列
  -> 插件 background/service worker 轮询或接收命令
  -> chrome.debugger.sendCommand
  -> 插件返回执行结果
```

没有这个 bridge 前，不要把插件 CDP 和 `cdp.mjs` 外部 CDP 混为一谈。

### 8.1 捕获尚未记录的 Readdy API（包括 SEO）

仓库中的 `scripts/cdp.mjs` 提供被动监听命令：

```powershell
node scripts/cdp.mjs readdyCaptureApi readdy.ai <PROJECT_ID> 60 all readdy-api-capture.json
```

参数顺序：

```text
readdyCaptureApi <页面匹配文本> <projectId> [监听秒数] [过滤文本] [输出文件]
```

- 监听时间默认 60 秒，范围为 1–600 秒。
- 过滤文本会同时匹配请求方法、URL、查询参数和已有的请求体。
- 使用 `all`、`*` 或空值可捕获全部 Readdy `/api/` 与 `/gapi/` 请求；发现未知接口时推荐先用 `all`。
- 输出文件可省略；省略时只向标准输出打印 JSON。
- 响应体默认最多保留 50,000 个字符，可通过 `READDY_CAPTURE_MAX_BODY_CHARS` 调整。

该命令只启用 CDP Network 监听，不会主动点击、填写、提交或发布。运行命令后，在倒计时内操作目标 Readdy 标签页即可。它只接受 `readdy.ai` 的项目页面，并校验 URL 中的项目 ID 与命令参数一致。

SEO 接口发现流程：

```text
1. 在启用了 9222 调试端口的 Chrome 中登录并打开目标 Readdy 项目。
2. 运行 readdyCaptureApi，过滤参数先使用 all。
3. 在监听期间打开 SEO Configuration，并切换几个页面。
4. 等待命令结束，检查 requests[].url、method、requestBody 和 response.body。
5. 先识别读取 SEO 配置的 GET/POST 请求，不要点击 Generate。
6. 如需捕获最终保存接口，重新监听后再点击一次 Generate。
```

注意：点击 **Generate** 可能消耗 Readdy credits，也会改变项目状态。被动监听本身不消耗 credits，但在未确认前不要为了捕获请求而点击 Generate。

安全措施：

- 不输出 `Authorization`、Cookie 等敏感请求头。
- 对 Token、JWT、密码、Secret、API Key 等字段自动脱敏。
- URL 中的敏感查询参数会替换为 `[redacted]`。
- 捕获报告可能仍包含项目内容，不要提交到 Git；仓库已忽略 `readdy-api-capture*.json`。

## 9. 上传后核验

最低核验：

```text
1. code_edit 返回 status 200 / code OK
2. 返回新 showID / versionID
3. msg 同步返回 200 / OK，或查重确认已存在
4. 再读 msg_list，最新卡片是新 showID / versionID
5. 线上 Publish / Update 未执行，除非用户明确要求
```

页面核验：

```text
1. 打开 Readdy 新版本预览。
2. 检查首页。
3. 检查关键路由。
4. 检查图片资源。
5. 检查控制台错误。
```

强核验：

在认证状态可用时下载版本包：

```text
GET https://readdy.ai/api/project/download?projectVersionID=<versionID>&projectId=<PROJECT_ID>
```

header：

```text
authorization: Bearer <readdy_access_token>
X-Project-Id: <PROJECT_ID>
```

匿名下载返回 `401` 是正常的。

## 10. 禁止事项

禁止：

- 把 `showID` 当成 `parentVersionID`。
- 输出 token、cookie、authorization header。
- 发送无法确认来源的 JWT。
- 上传 `.env`、密钥、cookie、浏览器 profile、数据库 dump。
- 上传 `node_modules`、构建缓存、临时日志、历史归档。
- 在没有用户明确同意时点击 `Publish` / `Update`。
- 在没有 bridge 的情况下声称 `cdp.mjs` 可以调用插件 CDP。

## 11. 故障处理

### `CDP_NOT_AVAILABLE`

含义：

```text
127.0.0.1:9222 没有监听。
```

处理：

- 如果要用 `cdp.mjs`，重新启动带 `--remote-debugging-port=9222` 的浏览器。
- 如果只需要上传，可改走直接 Readdy API 或插件弹窗。

### `projectId is required`

常见原因：

```text
缺少 X-Project-Id header。
```

处理：

- body 加 `projectId`。
- header 加 `X-Project-Id`。

### 找不到 `readdy_access_token`

处理：

- 确认当前浏览器已登录 Readdy。
- 确认脚本读取的是当前浏览器 profile。
- 仍找不到时，不要扫描任意 JWT 硬发。
- 改用插件弹窗方式。

### 上传后右侧没有新版本卡片

处理：

- 调用 `msg_list` 查是否已有相同 `versionID`。
- 如果没有，调用 `POST /api/project/msg?projectId=<PROJECT_ID>` 同步历史卡片。
- 如果已有，不要重复写。

## 12. CFB27 Version 215 成功样例

本次成功链路：

```text
Edge 登录态 token
  -> Node 直接 Readdy API
  -> msg_list 读取 parentVersionID
  -> code_edit 上传 149 个文件
  -> msg 同步右侧历史版本卡片
```

记录：

```text
Local commit: 59b0b6f
Parent showID: 214
Parent versionID: 11750505
New showID: 215
New versionID: 11751125
Uploaded files: 149
Uploaded bytes: 2379823
code_edit status: 200
code_edit code: OK
messageSync status: 200
messageSync code: OK
Published production: no
```

这个样例证明：即使 `127.0.0.1:9222` 不可用，只要当前浏览器登录态可安全读取，直接 Readdy API 上传仍然可以完成。

## 13. 推荐决策树

```text
需要上传 Readdy 代码？
  |
  |-- cdp.mjs 能读取最新版本？
  |     |-- 是：用 cdp.mjs readdyCodeEdit
  |     |-- 否：
  |
  |-- 当前浏览器已登录 Readdy，且能安全读取 readdy_access_token？
  |     |-- 是：用直接 Readdy API
  |     |-- 否：
  |
  |-- Readdy API Helper 插件已加载？
        |-- 是：用插件弹窗上传
        |-- 否：先加载插件，或重新建立可用 CDP
```

默认建议：

- 自动化优先：`cdp.mjs` 或直接 Readdy API。
- 安全手动优先：Readdy API Helper 插件。
- 不要把生产发布纳入上传脚本，发布应单独确认。
