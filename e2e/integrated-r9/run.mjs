import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createServer } from 'node:net';
if (!process.argv[2]) throw new Error('Pass the backend checkout path');
const backend = resolve(process.argv[2]);
const frontend = process.cwd();
await mkdir(join(frontend, 'test-results'), { recursive: true });
const evidence = await mkdtemp(join(frontend, 'test-results/r9-services-'));
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
  !key.startsWith('SPRING_') && !['JAVA_TOOL_OPTIONS', '_JAVA_OPTIONS', 'JDK_JAVA_OPTIONS', 'GRADLE_OPTS', 'JAVA_OPTS'].includes(key)));
Object.assign(env, { JDK_JAVA_OPTIONS: '-Djava.net.preferIPv4Stack=true',
  VITE_AUTH_API_BASE_URL: 'http://127.0.0.1:15179', VITE_ADAPTIVE_API_BASE_URL: 'http://127.0.0.1:15179',
  VITE_TENANT_ID: '11111111-1111-4111-8111-111111111111' });
console.log(`INTEGRATION_EVIDENCE_ROOT=${evidence}`);
const owned = [];
const delay = ms => new Promise(done => setTimeout(done, ms));
async function free(port) {
  const server = createServer();
  await new Promise((done, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', done); });
  await new Promise(done => server.close(done));
}
function start(command, args, cwd, name) {
  const child = spawn(command, args, { cwd, env, stdio: name ? ['ignore', 'pipe', 'pipe'] : 'inherit' });
  if (name) {
    child.stdout.pipe(createWriteStream(join(evidence, `${name}.stdout.log`)));
    child.stderr.pipe(createWriteStream(join(evidence, `${name}.stderr.log`)));
  }
  const completed = new Promise((done, reject) => { child.once('error', reject); child.once('exit', code => done(code ?? 1)); });
  completed.catch(() => {});
  owned.push({ child, completed });
  return child;
}
async function run(command, args, cwd) {
  start(command, args, cwd);
  if (await owned.at(-1).completed !== 0) throw new Error(`Command failed: ${command}`);
}
async function ready(child, port, marker) {
  for (let attempt = 0; attempt < 120; attempt++) {
    if (child.exitCode !== null || child.signalCode !== null) throw new Error(`Service exited on ${port}`);
    try {
      if (marker && (await readFile(marker, 'utf8')).trim() !== 'READY') throw new Error('Fixture pending');
      const response = await fetch(`http://127.0.0.1:${port}${marker ? '/actuator/health' : '/r9.html'}`, { signal: AbortSignal.timeout(2000) });
      if (response.ok && (!marker || (await response.json()).status === 'UP')) return;
    } catch { /* Await only the child launched by this runner. */ }
    await delay(1000);
  }
  throw new Error(`Readiness timeout on ${port}`);
}
try {
  for (const port of [18083, 18084, 15179]) await free(port);
  await run('./gradlew', ['--no-daemon', '--no-configuration-cache', '--init-script',
    join(frontend, 'e2e/integrated-r9/runtime-classpath.gradle'), `-Pr9Output=${evidence}`,
    ':auth-service:r9RuntimeClasspath', ':adaptive-education-service:r9RuntimeClasspath'], backend);
  for (const [module, port, profile, main] of [
    ['auth-service', 18083, 'r9-isolated', 'ilp.r9.R9AuthRuntime'],
    ['adaptive-education-service', 18084, 'scientific-production', 'ilp.r9.R9AdaptiveRuntime']]) {
    const config = join(evidence, `${module}.properties`);
    await writeFile(config, `server.address=127.0.0.1\nserver.port=${port}\nspring.profiles.active=${profile}\nspring.datasource.url=jdbc:h2:mem:r9_${port};MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1\nspring.datasource.driver-class-name=org.h2.Driver\nspring.datasource.username=sa\nspring.datasource.password=\nspring.jpa.hibernate.ddl-auto=create-drop\nspring.jpa.open-in-view=false\nspring.flyway.enabled=false\nspring.liquibase.enabled=false\nspring.sql.init.mode=never\nspring.kafka.listener.auto-startup=false\nspring.kafka.bootstrap-servers=127.0.0.1:19092\nevents.outbox.publisher-delay-ms=3600000\nsecurity.jwt.issuer=urn:ilp:r9:isolated\nsecurity.jwt.audience=ilp-scientific-api\nsecurity.jwt.access-token-minutes=30\nsecurity.jwt.refresh-token-days=1\nmanagement.endpoints.web.exposure.include=health\nlogging.level.org.springframework.security=WARN\n`);
    const marker = join(evidence, `${module}.ready`);
    const classpath = (await readFile(join(evidence, `${module}.classpath.txt`), 'utf8')).trim();
    const args = ['-cp', classpath, main, `--spring.config.location=file:${config}`, `--r9.ready=${marker}`];
    if (port === 18084) args.push('--r9.auth-base=http://127.0.0.1:18083', `--r9.fixture=${join(frontend, 'public/r9-fixture.json')}`);
    const child = start('java', args, backend, module);
    await ready(child, port, marker);
  }
  await run(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.integrated-r9.json', '--noEmit'], frontend);
  await run(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--config', 'vite.r9.config.ts'], frontend);
  const preview = start(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--config', 'vite.r9.config.ts'], frontend, 'frontend');
  await ready(preview, 15179);
  await run(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', '--config', 'playwright.integrated-r9.config.ts'], frontend);
  const xml = await readFile(join(frontend, 'test-results/integrated-r9-results.xml'), 'utf8');
  if ((xml.match(/<testcase\b/g) ?? []).length !== 6 || /<(failure|error|skipped)\b/.test(xml)) throw new Error('Expected six passing browser cases');
  console.log('REAL_LOCAL_AUTHORIZATION_AND_UI_HISTORY_VERIFIED=True\nORIGINAL_INSTRUMENT_VALIDATED=False');
} finally {
  for (const { child, completed } of owned.reverse()) {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
      await Promise.race([completed, delay(5000)]);
      if (child.exitCode === null && child.signalCode === null) { child.kill('SIGKILL'); await completed; }
    }
  }
}
