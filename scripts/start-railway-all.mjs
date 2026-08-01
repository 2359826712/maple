import { spawn } from 'node:child_process';

const children = new Set();
let shuttingDown = false;

const start = (command, args, env = process.env) => {
  const child = spawn(command, args, { env, stdio: 'inherit' });
  children.add(child);
  child.once('exit', () => children.delete(child));
  return child;
};

const stopChildren = (signal = 'SIGTERM') => {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill(signal);
  }
};

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stopChildren(signal);
    setTimeout(() => process.exit(0), 5_000).unref();
  });
}

const apiEnv = {
  ...process.env,
  APP_ADDR: process.env.APP_ADDR || '127.0.0.1:8081',
  APP_BASE_URL: process.env.APP_BASE_URL || 'https://mpstorys.com',
};
const api = start('./maplehub-api', [], apiEnv);

const waitForApi = async () => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (api.exitCode !== null || api.signalCode !== null) {
      throw new Error(`maplehub-api exited before becoming ready (${api.exitCode ?? api.signalCode})`);
    }
    try {
      const response = await fetch('http://127.0.0.1:8081/healthz', {
        signal: AbortSignal.timeout(1_000),
      });
      if (response.ok) return;
    } catch {
      // The API is still connecting to the database.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('maplehub-api did not become ready within 30 seconds');
};

try {
  await waitForApi();
} catch (error) {
  console.error(error);
  stopChildren();
  process.exit(1);
}

console.log('maplehub-api ready on 127.0.0.1:8081; starting Next.js');
const web = start(process.execPath, ['server.js']);

const firstExit = await Promise.race([
  new Promise((resolve) => api.once('exit', (code, signal) => resolve({ name: 'maplehub-api', code, signal }))),
  new Promise((resolve) => web.once('exit', (code, signal) => resolve({ name: 'next', code, signal }))),
]);

if (!shuttingDown) {
  console.error(`${firstExit.name} exited (${firstExit.code ?? firstExit.signal}); stopping the container`);
  stopChildren();
}
process.exit(typeof firstExit.code === 'number' ? firstExit.code : 1);
