import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, it, vi } from 'vitest';
const source = readFileSync('e2e/p02/worker.template.js', 'utf8');
function runtime(complete = true) {
  const handlers = new Map<string, (event: unknown) => void>();
  const responses = new Map(['/r9.html', '/assets/app.js'].map(path => [path, { ok: true, path }]));
  const cache = { addAll: vi.fn().mockImplementation(async () => { if (!complete) throw new Error('offline'); }),
    match: vi.fn(async (path: string) => responses.get(path)) };
  const caches = { open: vi.fn().mockResolvedValue(cache), delete: vi.fn().mockResolvedValue(true),
    keys: vi.fn().mockResolvedValue(['ilp-r9-shell-old', 'ilp-r9-shell-test', 'ilp-p02-lab-other', 'unrelated']) };
  const fetch = vi.fn();
  runInNewContext(source, { __CACHE_NAME__: 'ilp-r9-shell-test', __CACHE_PREFIX__: 'ilp-r9-shell-', __VERIFY_MESSAGE__: 'R9_VERIFY_CACHE', __FILES__: ['/r9.html', '/assets/app.js'],
    URL, Request: class extends Request {
      constructor(input: string, init?: RequestInit) { super(new URL(input, 'https://lab.invalid'), init); }
    }, Promise, fetch, caches,
    self: { location: { origin: 'https://lab.invalid' }, clients: { claim: vi.fn() },
      addEventListener: (name: string, handler: (event: unknown) => void) => handlers.set(name, handler) } });
  return { handlers, cache, caches, fetch };
}
it('serves the public shell for a fixture query without requesting private fixture data', async () => {
  const { handlers, fetch } = runtime();
  const respondWith = vi.fn();
  handlers.get('fetch')!({ request: new Request('https://lab.invalid/r9.html?fixture=private'), respondWith });
  expect(await respondWith.mock.calls[0][0]).toEqual({ ok: true, path: '/r9.html' });
  expect(fetch).not.toHaveBeenCalled();
});
it.each([
  ['https://lab.invalid/auth/session-identity', 'GET', {}],
  ['https://lab.invalid/api/v1/history', 'GET', {}],
  ['https://lab.invalid/r9-fixture.json', 'GET', {}],
  ['https://lab.invalid/r9.html', 'POST', {}],
  ['https://other.invalid/r9.html', 'GET', {}],
  ['https://lab.invalid/r9.html', 'GET', { Authorization: 'Bearer synthetic-test' }],
  ['https://lab.invalid/assets/app.js', 'GET', { 'X-Tenant-Id': 'synthetic-test' }],
])('does not intercept nonpublic or credentialed request %s %s %j', (url, method, headers) => {
  const { handlers, caches } = runtime();
  const respondWith = vi.fn();
  handlers.get('fetch')!({ request: new Request(url, { method, headers }), respondWith });
  expect(respondWith).not.toHaveBeenCalled();
  expect(caches.open).not.toHaveBeenCalled();
});
it('removes an incomplete installation and reports installation failure', async () => {
  const { handlers, caches } = runtime(false);
  const waitUntil = vi.fn();
  handlers.get('install')!({ waitUntil });
  await expect(waitUntil.mock.calls[0][0]).rejects.toThrow('offline');
  expect(caches.delete).toHaveBeenCalledExactlyOnceWith('ilp-r9-shell-test');
});
it('cleans its old cache without deleting another laboratory cache', async () => {
  const { handlers, caches } = runtime();
  const waitUntil = vi.fn();
  handlers.get('activate')!({ waitUntil });
  await waitUntil.mock.calls[0][0];
  expect(caches.delete).toHaveBeenCalledExactlyOnceWith('ilp-r9-shell-old');
});
