const CDP_HOST = process.env.CDP_HOST || 'http://127.0.0.1:9222';
const READDY_ORIGIN = 'https://readdy.ai';
const SENSITIVE_KEY_RE = /authorization|cookie|token|secret|password|api[-_]?key|access/i;
const SAFE_OUTPUT_KEYS = new Set(['tokenPresent']);

function usage() {
  console.error('Usage: node cdp.mjs <list|inspect|eval|reload|forceReload|screenshot|clickText|clickAt|fill|typeAt|replaceAt|key|readdyStatus|readdyVersionCards|readdyLatestVersion|readdyDownloadVersion|readdyPublishSelected|readdyCaptureApi|readdyEdit|readdyCodeEdit|readdyDeployFunction|readdySetSecretsFromEnv> [args...]');
  process.exit(2);
}

function redactString(value) {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[redacted-jwt]')
    .replace(/((?:authorization|cookie|token|secret|password|api[-_]?key|access)["']?\s*[:=]\s*["']?)[^"'\s,;&}]+/gi, '$1[redacted]');
}

function redactForOutput(value, seen = new WeakSet()) {
  if (typeof value === 'string') return redactString(value);
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return '[circular]';
  seen.add(value);
  if (Array.isArray(value)) return value.map(item => redactForOutput(item, seen));
  return Object.fromEntries(Object.entries(value).map(([key, item]) => (
    SENSITIVE_KEY_RE.test(key) && !SAFE_OUTPUT_KEYS.has(key)
      ? [key, '[redacted]']
      : [key, redactForOutput(item, seen)]
  )));
}

function printJson(value) {
  console.log(JSON.stringify(redactForOutput(value), null, 2));
}

function sanitizeCapturedUrl(value) {
  try {
    const url = new URL(value);
    for (const key of [...url.searchParams.keys()]) {
      if (SENSITIVE_KEY_RE.test(key)) url.searchParams.set(key, '[redacted]');
    }
    return redactString(url.toString());
  } catch {
    return redactString(String(value || ''));
  }
}

function parseCapturedBody(value, maxChars = Number(process.env.READDY_CAPTURE_MAX_BODY_CHARS || 50000)) {
  if (value === undefined || value === null || value === '') return null;
  const raw = String(value);
  const clipRedactedValue = parsed => {
    const redacted = redactForOutput(parsed);
    const serialized = JSON.stringify(redacted);
    if (serialized.length <= maxChars) return redacted;
    return {
      truncated: true,
      originalChars: raw.length,
      redactedPreview: serialized.slice(0, maxChars),
    };
  };
  try {
    return clipRedactedValue(JSON.parse(raw));
  } catch {}
  if (/^[^=&\s]+=[\s\S]*$/.test(raw)) {
    try {
      const params = new URLSearchParams(raw);
      return clipRedactedValue(Object.fromEntries(params.entries()));
    } catch {}
  }
  const clipped = raw.length > maxChars ? `${raw.slice(0, maxChars)}\n[truncated ${raw.length - maxChars} chars]` : raw;
  return redactString(clipped);
}

function safeCapturedHeaders(headers = {}) {
  const allowed = new Set(['accept', 'content-type', 'x-project-id', 'x-requested-with']);
  return Object.fromEntries(Object.entries(headers)
    .filter(([key]) => allowed.has(key.toLowerCase()))
    .map(([key, value]) => [key.toLowerCase(), redactString(String(value))]));
}

async function targets() {
  const res = await fetch(`${CDP_HOST}/json/list`);
  if (!res.ok) throw new Error(`Target list failed: ${res.status}`);
  return res.json();
}

function pickTarget(all, needle) {
  const pageTargets = all.filter(t => t.type === 'page');
  return pageTargets.find(t => (t.url || '').includes(needle) || (t.title || '').includes(needle));
}

class CDP {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
  }

  async open() {
    this.ws = new WebSocket(this.wsUrl);
    this.ws.addEventListener('message', event => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(`${msg.error.code}: ${msg.error.message}`));
        else resolve(msg.result);
      } else if (msg.method) {
        this.events.push(msg);
      }
    });
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('CDP websocket open timeout')), 10000);
      this.ws.addEventListener('open', () => {
        clearTimeout(timer);
        resolve();
      });
      this.ws.addEventListener('error', event => {
        clearTimeout(timer);
        reject(new Error(`CDP websocket error: ${event.message || 'unknown'}`));
      });
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    const payload = JSON.stringify({ id, method, params });
    this.ws.send(payload);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${method} timeout`));
      }, Number(process.env.CDP_TIMEOUT_MS || 30000));
      this.pending.set(id, {
        resolve: value => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: error => {
          clearTimeout(timer);
          reject(error);
        },
      });
    });
  }

  close() {
    this.ws?.close();
  }
}

async function withPage(needle, fn) {
  const all = await targets();
  const target = pickTarget(all, needle);
  if (!target) {
    throw new Error(`No page target matching "${needle}"`);
  }
  const cdp = new CDP(target.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');
  await cdp.send('DOM.enable');
  await cdp.send('Log.enable').catch(() => {});
  await cdp.send('Network.enable').catch(() => {});
  try {
    return await fn(cdp, target);
  } finally {
    cdp.close();
  }
}

async function evalExpr(cdp, expression, opts = {}) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
    ...opts,
  });
  if (result.exceptionDetails) {
    const text = result.exceptionDetails.text || 'Runtime exception';
    const desc = result.exceptionDetails.exception?.description || '';
    throw new Error(`${text}\n${desc}`);
  }
  return result.result?.value;
}

function jsString(value) {
  return JSON.stringify(value);
}

function projectIdFromReaddyUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.origin !== READDY_ORIGIN) return '';
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts[0] === 'project') return parts[1] || '';
    if (parts[0] === 'management' && parts[1] === 'form') return parts[2] || '';
    return '';
  } catch {
    return '';
  }
}

function assertReaddyProjectTarget(target, projectId) {
  const targetProjectId = projectIdFromReaddyUrl(target.url || '');
  if (!targetProjectId) {
    throw new Error(`Selected target is not a ${READDY_ORIGIN} project page: ${target.url || '(unknown url)'}`);
  }
  if (String(projectId || '').trim() && targetProjectId !== String(projectId).trim()) {
    throw new Error(`Selected Readdy project ${targetProjectId} does not match requested projectId ${projectId}`);
  }
  return targetProjectId;
}

async function withReaddyProjectPage(needle, projectId, fn) {
  return withPage(needle, async (cdp, target) => {
    const targetProjectId = assertReaddyProjectTarget(target, projectId);
    return fn(cdp, target, targetProjectId);
  });
}

function readdyVersionCardsExpression(projectId, maxPages) {
  return `(async () => {
    const projectId = ${jsString(projectId)};
    const maxPages = Math.max(1, Math.min(50, Number(${jsString(maxPages)}) || 12));
    const access = localStorage.getItem('readdy_access_token') || '';
    if (!access) throw new Error('Missing Readdy login token in selected project tab');
    const makeHeaders = () => ({
      'content-type': 'application/json',
      authorization: 'Bearer ' + access,
      'X-Project-Id': projectId,
    });
    const parseContent = content => {
      if (!content) return null;
      if (typeof content === 'object') return content;
      try { return JSON.parse(content); } catch { return null; }
    };
    const cards = [];
    const seen = new Set();
    let pagesScanned = 0;
    for (let pageNum = 1; pageNum <= maxPages; pageNum += 1) {
      const res = await fetch('/api/project/msg_list', {
        method: 'POST',
        headers: makeHeaders(),
        body: JSON.stringify({ projectId, page: { pageNum, pageSize: 100 } }),
      });
      const json = await res.json().catch(() => null);
      const rows = json?.data?.projectMsgs || [];
      pagesScanned = pageNum;
      for (const row of rows) {
        const content = parseContent(row.content);
        const entries = Array.isArray(content?.content) ? content.content : [];
        for (const entry of entries) {
          const data = entry?.data || {};
          const versionID = data.projectVersionId;
          const showID = data.showId;
          if (!versionID || !showID) continue;
          const key = String(versionID) + ':' + String(showID);
          if (seen.has(key)) continue;
          seen.add(key);
          cards.push({
            msgId: row.id || null,
            createdAt: row.createdAt || row.createAt || '',
            projectVersionId: Number(versionID),
            showId: Number(showID),
            recordReference: Number(content?.recordReference || 0),
            text: data.eventData?.[0]?.data?.text || '',
          });
        }
      }
      if (rows.length < 100) break;
    }
    cards.sort((a, b) => {
      const showDelta = Number(a.showId || 0) - Number(b.showId || 0);
      if (showDelta) return showDelta;
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    });
    const latest = cards[cards.length - 1] || null;
    return { projectId, pagesScanned, count: cards.length, latest, cards };
  })()`;
}

async function fetchReaddyVersionCards(cdp, projectId, maxPages = 12) {
  return evalExpr(cdp, readdyVersionCardsExpression(projectId, maxPages));
}

async function cmdList() {
  const all = await targets();
  printJson(all.filter(t => t.type === 'page').map(t => ({
    id: t.id,
    title: t.title,
    url: t.url,
  })));
}

async function cmdInspect(needle) {
  await withPage(needle, async (cdp, target) => {
    const data = await evalExpr(cdp, `(() => {
      const pick = (el, index) => {
        const r = el.getBoundingClientRect();
        return {
          index,
          tag: el.tagName.toLowerCase(),
          type: el.getAttribute('type') || '',
          role: el.getAttribute('role') || '',
          aria: el.getAttribute('aria-label') || '',
          placeholder: el.getAttribute('placeholder') || '',
          text: (el.innerText || el.textContent || el.value || '').trim().replace(/\\s+/g, ' ').slice(0, 160),
          value: el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' ? (el.value || '').slice(0, 160) : '',
          disabled: !!el.disabled || el.getAttribute('aria-disabled') === 'true',
          visible: !!(r.width && r.height),
          x: Math.round(r.x + r.width / 2),
          y: Math.round(r.y + r.height / 2),
          w: Math.round(r.width),
          h: Math.round(r.height),
        };
      };
      const selector = 'button,a,input,textarea,select,[role="button"],[contenteditable="true"]';
      const controls = [...document.querySelectorAll(selector)]
        .filter(el => {
          const style = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return style.visibility !== 'hidden' && style.display !== 'none' && r.width > 0 && r.height > 0;
        })
        .slice(0, 160)
        .map(pick);
      const scripts = [...document.scripts].map(s => s.src).filter(Boolean).slice(0, 60);
      return {
        title: document.title,
        href: location.href,
        readyState: document.readyState,
        text: document.body?.innerText?.replace(/\\s+/g, ' ').slice(0, 6000) || '',
        controls,
        scripts,
      };
    })()`);
    printJson({ target, data });
  });
}

async function cmdEval(needle, expression) {
  await withPage(needle, async cdp => {
    const value = await evalExpr(cdp, expression);
    printJson(value);
  });
}

async function cmdReload(needle) {
  await withPage(needle, async cdp => {
    await cdp.send('Page.reload', { ignoreCache: true });
    await new Promise(resolve => setTimeout(resolve, 5000));
    const data = await evalExpr(cdp, `({ title: document.title, href: location.href, readyState: document.readyState, text: document.body?.innerText?.replace(/\\s+/g, ' ').slice(0, 2000) || '' })`);
    const interestingEvents = cdp.events
      .filter(e => ['Network.loadingFailed', 'Network.responseReceived', 'Log.entryAdded', 'Runtime.consoleAPICalled'].includes(e.method))
      .map(e => e.params)
      .slice(-100);
    printJson({ data, events: interestingEvents });
  });
}

async function cmdForceReload(needle) {
  const all = await targets();
  const target = pickTarget(all, needle);
  if (!target) {
    throw new Error(`No page target matching "${needle}"`);
  }
  const cdp = new CDP(target.webSocketDebuggerUrl);
  await cdp.open();
  try {
    await cdp.send('Page.enable').catch(() => {});
    cdp.ws.addEventListener('message', event => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Page.javascriptDialogOpening') {
        cdp.send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
      }
    });
    await cdp.send('Page.reload', { ignoreCache: true });
    printJson({ ok: true, target: target.url });
  } finally {
    cdp.close();
  }
}

async function cmdScreenshot(needle, file) {
  await withPage(needle, async cdp => {
    const result = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    const fs = await import('node:fs/promises');
    await fs.writeFile(file, Buffer.from(result.data, 'base64'));
    printJson({ file });
  });
}

async function cmdClickText(needle, text) {
  await withPage(needle, async cdp => {
    const value = await evalExpr(cdp, `(() => {
      const wanted = ${jsString(text)};
      const candidates = [...document.querySelectorAll('button,a,[role="button"],[data-testid],div,span')]
        .filter(el => {
          const label = (el.innerText || el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\\s+/g, ' ');
          const r = el.getBoundingClientRect();
          return label.includes(wanted) && r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
        })
        .map(el => {
          const r = el.getBoundingClientRect();
          return { el, label: (el.innerText || el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\\s+/g, ' '), area: r.width * r.height };
        })
        .sort((a, b) => a.area - b.area);
      if (!candidates[0]) return { ok: false, reason: 'not-found' };
      candidates[0].el.click();
      return { ok: true, clicked: candidates[0].label };
    })()`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    printJson(value);
  });
}

async function cmdClickAt(needle, x, y) {
  await withPage(needle, async cdp => {
    const point = { x: Number(x), y: Number(y) };
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point, button: 'none' });
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', buttons: 1, clickCount: 1 });
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', buttons: 0, clickCount: 1 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    const data = await evalExpr(cdp, `({ title: document.title, href: location.href, text: document.body?.innerText?.replace(/\\s+/g, ' ').slice(0, 2000) || '' })`);
    printJson(data);
  });
}

async function cmdFill(needle, selectorOrPlaceholder, value) {
  await withPage(needle, async cdp => {
    const result = await evalExpr(cdp, `(() => {
      const key = ${jsString(selectorOrPlaceholder)};
      const value = ${jsString(value)};
      let el = null;
      try { el = document.querySelector(key); } catch {}
      if (!el) {
        el = [...document.querySelectorAll('input,textarea,[contenteditable="true"]')].find(node => {
          const hay = [
            node.getAttribute('placeholder'),
            node.getAttribute('aria-label'),
            node.innerText,
            node.value,
          ].filter(Boolean).join(' ');
          return hay.includes(key);
        });
      }
      if (!el) return { ok: false, reason: 'not-found' };
      el.focus();
      if (el.isContentEditable) {
        el.textContent = value;
      } else {
        const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value')?.set;
        setter ? setter.call(el, value) : (el.value = value);
      }
      for (const type of ['input', 'change']) {
        el.dispatchEvent(new Event(type, { bubbles: true }));
      }
      return { ok: true, tag: el.tagName, placeholder: el.getAttribute('placeholder') || '', value: el.value || el.innerText || '' };
    })()`);
    printJson(result);
  });
}

async function cmdTypeAt(needle, x, y, value) {
  await withPage(needle, async cdp => {
    const point = { x: Number(x), y: Number(y) };
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point, button: 'none' });
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', buttons: 1, clickCount: 1 });
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', buttons: 0, clickCount: 1 });
    await cdp.send('Input.insertText', { text: value });
    await new Promise(resolve => setTimeout(resolve, 1000));
    const data = await evalExpr(cdp, `({ active: document.activeElement?.tagName, text: document.body?.innerText?.replace(/\\s+/g, ' ').slice(-2000) || '' })`);
    printJson(data);
  });
}

async function clickPoint(cdp, x, y) {
  const point = { x: Number(x), y: Number(y) };
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point, button: 'none' });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', buttons: 1, clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', buttons: 0, clickCount: 1 });
}

async function pressKey(cdp, key, code, windowsVirtualKeyCode, modifiers = 0, commands = []) {
  await cdp.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key,
    code,
    windowsVirtualKeyCode,
    nativeVirtualKeyCode: windowsVirtualKeyCode,
    modifiers,
    commands,
  });
  await cdp.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key,
    code,
    windowsVirtualKeyCode,
    nativeVirtualKeyCode: windowsVirtualKeyCode,
    modifiers,
  });
}

async function cmdKey(needle, keyName) {
  await withPage(needle, async cdp => {
    if (keyName === 'ctrl+s') {
      await pressKey(cdp, 's', 'KeyS', 83, 2, ['save']);
    } else if (keyName === 'ctrl+a') {
      await pressKey(cdp, 'a', 'KeyA', 65, 2, ['selectAll']);
    } else {
      throw new Error(`Unknown key shortcut: ${keyName}`);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    printJson({ ok: true, key: keyName });
  });
}

async function cmdReplaceAt(needle, x, y, file) {
  const fs = await import('node:fs/promises');
  const text = await fs.readFile(file, 'utf8');
  await withPage(needle, async cdp => {
    await clickPoint(cdp, x, y);
    await new Promise(resolve => setTimeout(resolve, 250));
    await pressKey(cdp, 'a', 'KeyA', 65, 2, ['selectAll']);
    await new Promise(resolve => setTimeout(resolve, 250));
    await cdp.send('Input.insertText', { text });
    await new Promise(resolve => setTimeout(resolve, 1000));
    const active = await evalExpr(cdp, `(() => {
      const el = document.activeElement;
      return {
        activeTag: el?.tagName || '',
        activeClass: el?.className || '',
        lines: ${JSON.stringify(text)}.split(/\\r?\\n/).length,
        chars: ${text.length},
      };
    })()`);
    printJson({ ok: true, file, ...active });
  });
}

async function cmdReaddyStatus(needle, projectId = '') {
  await withPage(needle, async (cdp, target) => {
    const data = await evalExpr(cdp, `(() => {
      const parts = location.pathname.split('/').filter(Boolean);
      const projectIdFromUrl = parts[0] === 'project'
        ? parts[1] || ''
        : (parts[0] === 'management' && parts[1] === 'form' ? parts[2] || '' : '');
      const isReaddyProject = location.origin === ${jsString(READDY_ORIGIN)} && Boolean(projectIdFromUrl);
      return {
        href: location.href,
        title: document.title,
        readyState: document.readyState,
        projectIdFromUrl,
        isReaddyProject,
        tokenPresent: Boolean(localStorage.getItem('readdy_access_token')),
      };
    })()`);
    if (projectId) assertReaddyProjectTarget(target, projectId);
    printJson({ target: { title: target.title, url: target.url }, data });
  });
}

async function cmdReaddyVersionCards(needle, projectId, maxPages = 12) {
  await withReaddyProjectPage(needle, projectId, async cdp => {
    printJson(await fetchReaddyVersionCards(cdp, projectId, maxPages));
  });
}

async function cmdReaddyLatestVersion(needle, projectId, maxPages = 12) {
  await withReaddyProjectPage(needle, projectId, async cdp => {
    const data = await fetchReaddyVersionCards(cdp, projectId, maxPages);
    printJson({
      projectId: data.projectId,
      pagesScanned: data.pagesScanned,
      count: data.count,
      latest: data.latest,
    });
  });
}

async function cmdReaddyDownloadVersion(needle, projectId, versionID, outFile, flag = '') {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const crypto = await import('node:crypto');
  const force = flag === '--force';

  await withReaddyProjectPage(needle, projectId, async cdp => {
    const access = await evalExpr(cdp, `localStorage.getItem('readdy_access_token') || ''`);
    if (!access) throw new Error('Missing Readdy login token in selected project tab');
    if (!/^\d+$/.test(String(versionID || ''))) throw new Error('versionID must be numeric');

    try {
      await fs.access(outFile);
      if (!force) throw new Error(`Refusing to overwrite existing file: ${outFile}. Pass --force to replace it.`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    const url = new URL('/api/project/download', READDY_ORIGIN);
    url.searchParams.set('projectVersionID', String(versionID));
    url.searchParams.set('projectId', projectId);
    const res = await fetch(url, {
      headers: {
        authorization: 'Bearer ' + access,
        'X-Project-Id': projectId,
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Readdy download failed ${res.status}: ${redactString(text).slice(0, 300)}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    await fs.mkdir(path.dirname(outFile), { recursive: true });
    await fs.writeFile(outFile, buffer);
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    printJson({
      ok: true,
      projectId,
      versionID: Number(versionID),
      outFile: path.resolve(outFile),
      bytes: buffer.length,
      sha256,
      contentType: res.headers.get('content-type') || '',
      disposition: res.headers.get('content-disposition') || '',
      overwritten: force,
    });
  });
}

async function clickTextOnPage(cdp, text) {
  const result = await evalExpr(cdp, `(() => {
    const wanted = ${jsString(text)};
    const candidates = [...document.querySelectorAll('button,a,[role="button"],[data-testid],div,span')]
      .filter(el => {
        const label = (el.innerText || el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\\s+/g, ' ');
        const r = el.getBoundingClientRect();
        return label.includes(wanted) && r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
      })
      .map(el => {
        const r = el.getBoundingClientRect();
        return { el, label: (el.innerText || el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\\s+/g, ' '), area: r.width * r.height };
      })
      .sort((a, b) => a.area - b.area);
    if (!candidates[0]) return { ok: false, reason: 'not-found', text: wanted };
    candidates[0].el.click();
    return { ok: true, clicked: candidates[0].label };
  })()`);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return result;
}

async function clickAnyTextOnPage(cdp, labels) {
  const attempts = [];
  for (const label of labels) {
    const result = await clickTextOnPage(cdp, label);
    attempts.push({ label, result });
    if (result?.ok) return { ok: true, matched: label, clicked: result.clicked, attempts };
  }
  return { ok: false, reason: 'not-found', labels, attempts };
}

async function cmdReaddyPublishSelected(needle, projectId, expectedShowID, expectedVersionID, flag = '--dry-run') {
  const confirmed = flag === '--confirm';
  await withReaddyProjectPage(needle, projectId, async cdp => {
    const before = await evalExpr(cdp, `(() => {
      const text = document.body?.innerText?.replace(/\\s+/g, ' ') || '';
      const buttons = [...document.querySelectorAll('button,a,[role="button"]')]
        .map((el, index) => ({ index, text: (el.innerText || el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\\s+/g, ' ') }))
        .filter(item => /select|edit|publish|update|version|选择|编辑|发布|更新|版本/i.test(item.text))
        .slice(-50);
      return {
        hasExpectedShowID: text.includes('Version ${String(expectedShowID)}') || text.includes('版本 ${String(expectedShowID)}'),
        expectedShowID: ${jsString(expectedShowID)},
        expectedVersionID: ${jsString(expectedVersionID)},
        buttons,
      };
    })()`);
    if (!before.hasExpectedShowID) {
      throw new Error(`Could not find Version ${expectedShowID} in the current Readdy page text`);
    }
    if (!confirmed) {
      printJson({
        dryRun: true,
        message: 'No publish action was performed. Re-run with --confirm to click Select to Edit/选择以编辑, Publish/发布, and Update/更新.',
        before,
      });
      return;
    }

    const steps = [];
    steps.push(await clickAnyTextOnPage(cdp, ['Select to Edit', '选择以编辑']));
    await new Promise(resolve => setTimeout(resolve, 8000));
    steps.push(await clickAnyTextOnPage(cdp, ['Publish', '发布']));
    await new Promise(resolve => setTimeout(resolve, 2000));
    steps.push(await clickAnyTextOnPage(cdp, ['Update', '更新']));
    await new Promise(resolve => setTimeout(resolve, 15000));
    const after = await evalExpr(cdp, `(() => ({
      text: document.body?.innerText?.replace(/\\s+/g, ' ').slice(0, 6000) || ''
    }))()`);
    printJson({ ok: true, expectedShowID, expectedVersionID, steps, after });
  });
}

async function cmdReaddyEdit(needle, projectId, parentVersionID, pairs, endpoint = '/gapi/project/spec_code_edit') {
  if (pairs.length === 0 || pairs.length % 2 !== 0) {
    throw new Error('readdyEdit expects remote/local file pairs');
  }
  const fs = await import('node:fs/promises');
  const edits = [];
  for (let i = 0; i < pairs.length; i += 2) {
    const remoteFile = pairs[i];
    const localFile = pairs[i + 1];
    const content = await fs.readFile(localFile, 'utf8');
    edits.push({ action: 'edit', file: remoteFile, content });
  }

  await withReaddyProjectPage(needle, projectId, async cdp => {
    const payload = { projectId, parentVersionID: Number(parentVersionID), edits };
    const skipMessageSync = /^(1|true|yes)$/i.test(String(process.env.READDY_SKIP_MESSAGE_SYNC || ''));
    const value = await evalExpr(cdp, `(async () => {
      const access = localStorage.getItem('readdy_access_token') || '';
      const payload = ${JSON.stringify(payload)};
      const skipMessageSync = ${JSON.stringify(skipMessageSync)};
      const makeHeaders = () => ({
        'content-type': 'application/json',
        authorization: 'Bearer ' + access,
        'X-Project-Id': payload.projectId,
      });
      const versionExistsInMessages = async (versionID, showID) => {
        const versionText = String(versionID || '');
        const showText = String(showID || '');
        for (let pageNum = 1; pageNum <= 12; pageNum += 1) {
          const res = await fetch('/api/project/msg_list', {
            method: 'POST',
            headers: makeHeaders(),
            body: JSON.stringify({ projectId: payload.projectId, page: { pageNum, pageSize: 100 } }),
          });
          const json = await res.json().catch(() => null);
          const rows = json?.data?.projectMsgs || [];
          for (const row of rows) {
            try {
              const content = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
              const data = content?.content?.[0]?.data || {};
              if (versionText && String(data.projectVersionId || '') === versionText) return true;
              if (showText && String(data.showId || '') === showText) return true;
            } catch {}
          }
          if (rows.length < 100) break;
        }
        return false;
      };
      const saveVersionRecord = async (versionID, showID) => {
        if (!versionID || !showID) return { skipped: true, reason: 'missing versionID/showID' };
        if (await versionExistsInMessages(versionID, showID)) return { skipped: true, reason: 'already exists' };
        const requestId = 'codex-' + Math.floor(Date.now() / 1000);
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
              sessionId: requestId + '-session',
              eventData: [{
                event: 'data',
                data: {
                  text: 'Codex uploaded version ' + showID + '.',
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
          recordReference: Number(payload.parentVersionID) || 0,
          revertShowId: 0,
          fromMsgId: 0,
          tag: 0,
          author: null,
        };
        const res = await fetch('/api/project/msg?projectId=' + encodeURIComponent(payload.projectId), {
          method: 'POST',
          headers: makeHeaders(),
          body: JSON.stringify({
            projectId: payload.projectId,
            projectID: payload.projectId,
            msgId: -Date.now(),
            role: 0,
            content: JSON.stringify(content),
            createdAt: Date.now(),
          }),
        });
        const text = await res.text();
        let json = null;
        try { json = JSON.parse(text); } catch {}
        return {
          status: res.status,
          code: json?.code || null,
          data: json?.data || null,
          message: json?.meta?.message || null,
          rawStart: json ? '' : text.slice(0, 300),
        };
      };
      const res = await fetch(${JSON.stringify(endpoint)}, {
        method: 'POST',
        headers: makeHeaders(),
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch {}
      let messageSync = null;
      if (json?.code === 'OK' && json?.data?.versionID) {
        if (skipMessageSync) {
          messageSync = { skipped: true, reason: 'READDY_SKIP_MESSAGE_SYNC' };
        } else {
          try {
            messageSync = await saveVersionRecord(json.data.versionID, json.data.showID);
          } catch (error) {
            messageSync = { ok: false, error: String(error?.message || error) };
          }
        }
      }
      return {
        status: res.status,
        code: json?.code || null,
        data: json?.data || null,
        message: json?.meta?.message || null,
        messageSync,
        files: payload.edits.map(edit => ({ file: edit.file, chars: edit.content.length, lines: edit.content.split(/\\r?\\n/).length })),
        rawStart: json ? '' : text.slice(0, 500),
      };
    })()`);
    printJson(value);
  });
}

async function cmdReaddyCaptureApi(needle, projectId, seconds = 60, filter = '', outputFile = '') {
  const durationSeconds = Math.max(1, Math.min(600, Number(seconds) || 60));
  const requestedFilter = String(filter || '').trim().toLowerCase();
  const normalizedFilter = requestedFilter === '*' || requestedFilter === 'all' ? '' : requestedFilter;

  await withReaddyProjectPage(needle, projectId, async (cdp, target, targetProjectId) => {
    const startedAt = new Date();
    console.error(
      `Capturing Readdy API traffic for ${durationSeconds}s. ` +
      'Use the Readdy tab now; this command does not click or submit anything by itself.',
    );
    await new Promise(resolve => setTimeout(resolve, durationSeconds * 1000));

    const records = new Map();
    const failures = new Map();
    for (const event of cdp.events) {
      if (event.method === 'Network.requestWillBeSent') {
        const request = event.params?.request || {};
        let parsedUrl;
        try { parsedUrl = new URL(request.url || ''); } catch { continue; }
        const isReaddyHost = parsedUrl.hostname === 'readdy.ai' || parsedUrl.hostname.endsWith('.readdy.ai');
        const isApiPath = /^\/(?:gapi|api)\//.test(parsedUrl.pathname);
        if (!isReaddyHost || !isApiPath) continue;
        const haystack = `${request.method || ''} ${parsedUrl.pathname}${parsedUrl.search} ${request.postData || ''}`.toLowerCase();
        if (normalizedFilter && !haystack.includes(normalizedFilter)) continue;
        records.set(event.params.requestId, {
          requestId: event.params.requestId,
          resourceType: event.params.type || null,
          method: request.method || null,
          url: sanitizeCapturedUrl(request.url),
          requestHeaders: safeCapturedHeaders(request.headers),
          requestBody: parseCapturedBody(request.postData),
          hasPostData: Boolean(request.hasPostData),
          wallTime: event.params.wallTime ? new Date(event.params.wallTime * 1000).toISOString() : null,
        });
      } else if (event.method === 'Network.responseReceived') {
        const record = records.get(event.params?.requestId);
        if (!record) continue;
        const response = event.params.response || {};
        record.response = {
          status: response.status,
          statusText: response.statusText || '',
          mimeType: response.mimeType || '',
          url: sanitizeCapturedUrl(response.url || record.url),
          headers: safeCapturedHeaders(response.headers),
        };
      } else if (event.method === 'Network.loadingFailed') {
        if (records.has(event.params?.requestId)) {
          failures.set(event.params.requestId, {
            errorText: event.params.errorText || '',
            canceled: Boolean(event.params.canceled),
            blockedReason: event.params.blockedReason || null,
          });
        }
      }
    }

    for (const record of records.values()) {
      if (record.hasPostData && record.requestBody === null) {
        try {
          const requestData = await cdp.send('Network.getRequestPostData', { requestId: record.requestId });
          record.requestBody = parseCapturedBody(requestData.postData);
        } catch (error) {
          record.requestBodyError = String(error?.message || error);
        }
      }
      if (record.response && !failures.has(record.requestId)) {
        try {
          const responseData = await cdp.send('Network.getResponseBody', { requestId: record.requestId });
          const rawBody = responseData.base64Encoded
            ? Buffer.from(responseData.body || '', 'base64').toString('utf8')
            : responseData.body;
          record.response.body = parseCapturedBody(rawBody);
        } catch (error) {
          record.response.bodyError = String(error?.message || error);
        }
      }
      if (failures.has(record.requestId)) record.failure = failures.get(record.requestId);
      delete record.hasPostData;
    }

    const report = redactForOutput({
      capture: {
        target: sanitizeCapturedUrl(target.url),
        projectId: targetProjectId,
        startedAt: startedAt.toISOString(),
        finishedAt: new Date().toISOString(),
        durationSeconds,
        filter: normalizedFilter || null,
        matchedRequests: records.size,
        passive: true,
      },
      requests: [...records.values()],
    });

    if (outputFile) {
      const fs = await import('node:fs/promises');
      await fs.writeFile(outputFile, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
      report.capture.outputFile = outputFile;
    }
    printJson(report);
  });
}

async function cmdReaddyDeployFunction(needle, projectId, slug, name, file, verifyJwt = true) {
  const fs = await import('node:fs/promises');
  const code = await fs.readFile(file, 'utf8');
  await withReaddyProjectPage(needle, projectId, async cdp => {
    const payload = {
      projectID: projectId,
      projectId,
      slug,
      name,
      code,
      verify_jwt: Boolean(verifyJwt),
      verifyJWT: Boolean(verifyJwt),
    };
    const value = await evalExpr(cdp, `(async () => {
      const access = localStorage.getItem('readdy_access_token') || '';
      const payload = ${JSON.stringify(payload)};
      const res = await fetch('/api/project/selfhost_db/function_deploy?projectId=' + encodeURIComponent(payload.projectId), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer ' + access,
        },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch {}
      return {
        status: res.status,
        code: json?.code || null,
        data: json?.data || null,
        message: json?.meta?.message || null,
        detail: json?.meta?.detail || null,
        slug: payload.slug,
        chars: payload.code.length,
        lines: payload.code.split(/\\r?\\n/).length,
        rawStart: json ? '' : text.slice(0, 500),
      };
    })()`);
    printJson(value);
  });
}

function parseDotEnv(text) {
  const values = new Map();
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values.set(match[1], value);
  }
  return values;
}

async function cmdReaddySetSecretsFromEnv(needle, projectId, envFile, names) {
  const fs = await import('node:fs/promises');
  const envMap = parseDotEnv(await fs.readFile(envFile, 'utf8'));
  const secrets = names.map(name => {
    const value = envMap.get(name);
    if (!value) throw new Error(`Missing ${name} in ${envFile}`);
    return { name, value };
  });
  await withReaddyProjectPage(needle, projectId, async cdp => {
    const payload = { projectID: projectId, projectId, secrets };
    const value = await evalExpr(cdp, `(async () => {
      const access = localStorage.getItem('readdy_access_token') || '';
      const payload = ${JSON.stringify(payload)};
      const results = [];
      for (const secret of payload.secrets) {
        const res = await fetch('/api/project/selfhost_db/secret?projectId=' + encodeURIComponent(payload.projectId), {
          method: 'PUT',
          headers: {
            'content-type': 'application/json',
            authorization: 'Bearer ' + access,
          },
          body: JSON.stringify({
            projectID: payload.projectID,
            name: secret.name,
            value: secret.value,
          }),
        });
        const text = await res.text();
        let json = null;
        try { json = JSON.parse(text); } catch {}
        results.push({
          name: secret.name,
          status: res.status,
          code: json?.code || null,
          message: json?.meta?.message || null,
          rawStart: json ? '' : text.slice(0, 300),
        });
      }
      return results;
    })()`);
    printJson(value);
  });
}

const [cmd, ...args] = process.argv.slice(2);
if (!cmd) usage();

try {
  if (cmd === 'list') await cmdList();
  else if (cmd === 'inspect') await cmdInspect(args[0] || usage());
  else if (cmd === 'eval') await cmdEval(args[0] || usage(), args.slice(1).join(' ') || usage());
  else if (cmd === 'reload') await cmdReload(args[0] || usage());
  else if (cmd === 'forceReload') await cmdForceReload(args[0] || usage());
  else if (cmd === 'screenshot') await cmdScreenshot(args[0] || usage(), args[1] || usage());
  else if (cmd === 'clickText') await cmdClickText(args[0] || usage(), args.slice(1).join(' ') || usage());
  else if (cmd === 'clickAt') await cmdClickAt(args[0] || usage(), args[1] || usage(), args[2] || usage());
  else if (cmd === 'fill') await cmdFill(args[0] || usage(), args[1] || usage(), args.slice(2).join(' '));
  else if (cmd === 'typeAt') await cmdTypeAt(args[0] || usage(), args[1] || usage(), args[2] || usage(), args.slice(3).join(' '));
  else if (cmd === 'key') await cmdKey(args[0] || usage(), args[1] || usage());
  else if (cmd === 'replaceAt') await cmdReplaceAt(args[0] || usage(), args[1] || usage(), args[2] || usage(), args[3] || usage());
  else if (cmd === 'readdyStatus') await cmdReaddyStatus(args[0] || usage(), args[1] || '');
  else if (cmd === 'readdyVersionCards') await cmdReaddyVersionCards(args[0] || usage(), args[1] || usage(), args[2] || 12);
  else if (cmd === 'readdyLatestVersion') await cmdReaddyLatestVersion(args[0] || usage(), args[1] || usage(), args[2] || 12);
  else if (cmd === 'readdyDownloadVersion') await cmdReaddyDownloadVersion(args[0] || usage(), args[1] || usage(), args[2] || usage(), args[3] || usage(), args[4] || '');
  else if (cmd === 'readdyPublishSelected') await cmdReaddyPublishSelected(args[0] || usage(), args[1] || usage(), args[2] || usage(), args[3] || usage(), args[4] || '--dry-run');
  else if (cmd === 'readdyCaptureApi') await cmdReaddyCaptureApi(args[0] || usage(), args[1] || usage(), args[2] || 60, args[3] || '', args[4] || '');
  else if (cmd === 'readdyEdit') await cmdReaddyEdit(args[0] || usage(), args[1] || usage(), args[2] || usage(), args.slice(3));
  else if (cmd === 'readdyCodeEdit') await cmdReaddyEdit(args[0] || usage(), args[1] || usage(), args[2] || usage(), args.slice(3), '/gapi/project/code_edit');
  else if (cmd === 'readdyDeployFunction') await cmdReaddyDeployFunction(args[0] || usage(), args[1] || usage(), args[2] || usage(), args[3] || usage(), args[4] || usage(), args[5] === 'false' ? false : true);
  else if (cmd === 'readdySetSecretsFromEnv') await cmdReaddySetSecretsFromEnv(args[0] || usage(), args[1] || usage(), args[2] || usage(), args.slice(3));
  else usage();
} catch (error) {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
}
