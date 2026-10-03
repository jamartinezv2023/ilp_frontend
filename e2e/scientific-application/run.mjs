import { spawn } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const backend = resolve(process.argv[2] ?? '');
if (!process.argv[2]) throw new Error('Pass the backend repository path');
const evidence = await mkdtemp(join(tmpdir(), 'ilp-scientific-application-'));
const ready = join(evidence, 'ready.txt');
console.log(`EVIDENCE_ROOT=${evidence}`);
const win = process.platform === 'win32';
const args = [':adaptive-education-service:test', '--tests', '*ScientificApplicationBrowserBridgeTest', '--rerun-tasks', '--no-daemon', '--console=plain'];
const gradle = spawn(win ? 'cmd.exe' : './gradlew', win ? ['/d', '/s', '/c', `gradlew.bat ${args.join(' ')}`] : args, { cwd: backend, env: { ...process.env, ILP_SCIENTIFIC_READY: ready }, stdio: 'inherit' });
let ended = false;
const completion = new Promise(done => { gradle.on('error', error => { console.error(error); ended = true; done(1); }); gradle.on('exit', code => { ended = true; done(code ?? 1); }); });
let url;
let browserCode = 1;
try {
  const deadline = Date.now() + 300000;
  while (Date.now() < deadline) {
    try { url = (await readFile(ready, 'utf8')).trim(); break; } catch { /* Waiting for the synthetic fixture. */ }
    if (ended) throw new Error('Gradle exited before readiness');
    await new Promise(done => setTimeout(done, 250));
  }
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(url ?? '')) throw new Error('H2 backend not ready');
  const child = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', '--config', 'e2e/scientific-application/playwright.config.mjs'], { env: { ...process.env, ILP_SCIENTIFIC_H2_URL: url }, stdio: 'inherit' });
  browserCode = await new Promise(done => { child.on('error', () => done(1)); child.on('exit', code => done(code ?? 1)); });
} catch (error) { console.error(error); }
finally { if (url) await fetch(`${url}/release`).catch(() => {}); else if (!ended) gradle.kill(); }
const gradleCode = await completion;
console.log(`KOLB_BROWSER_EXIT_CODE=${browserCode}\nGRADLE_EXIT_CODE=${gradleCode}`);
process.exitCode = browserCode === 0 && gradleCode === 0 ? 0 : 1;
