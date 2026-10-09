import { afterEach, expect, it, vi } from 'vitest';
import { prepareOfflineLab, prepareR9Shell } from '../../src/features/offline/prepareOfflineLab';
afterEach(() => vi.useRealTimers());
function worker(reply: boolean, active = true) {
  const channel = { port1: { onmessage: null as null | ((event: { data: boolean }) => void), close: vi.fn() }, port2: { close: vi.fn() } };
  vi.stubGlobal('MessageChannel', class { port1 = channel.port1; port2 = channel.port2; });
  const postMessage = vi.fn(() => queueMicrotask(() => channel.port1.onmessage?.({ data: reply })));
  const register = vi.fn().mockResolvedValue({});
  vi.stubGlobal('navigator', { serviceWorker: { register, ready: Promise.resolve({ active: active ? { postMessage } : null }) } });
  return { channel, register };
}
it('confirms a verified cache and registers only the laboratory scope', async () => {
  const { channel, register } = worker(true);
  expect(await prepareOfflineLab()).toBe('ready');
  expect(register).toHaveBeenCalledWith('/p02-worker.js', { scope: '/p02.html' });
  expect(channel.port1.close).toHaveBeenCalled();
  expect(channel.port2.close).toHaveBeenCalled();
});
it('does not claim readiness when the cache is incomplete', async () => {
  worker(false);
  expect(await prepareOfflineLab()).toBe('unavailable');
});
it('reports unsupported browsers', async () => {
  vi.stubGlobal('navigator', {});
  expect(await prepareOfflineLab()).toBe('unavailable');
});
it('reports an inactive registration', async () => {
  worker(true, false);
  expect(await prepareOfflineLab()).toBe('unavailable');
});
it('reports rejected registration', async () => {
  worker(true);
  vi.mocked(navigator.serviceWorker.register).mockRejectedValue(new Error('blocked'));
  expect(await prepareOfflineLab()).toBe('unavailable');
});
it('times out pending activation without confirming readiness', async () => {
  vi.useFakeTimers();
  worker(true);
  Object.defineProperty(navigator.serviceWorker, 'ready', { value: new Promise(() => {}) });
  const result = prepareOfflineLab();
  await vi.advanceTimersByTimeAsync(10000);
  expect(await result).toBe('unavailable');
});

it('prepares the locked R9 shell under its own scope and protocol', async () => {
  const { register } = worker(true);
  expect(await prepareR9Shell()).toBe('ready');
  expect(register).toHaveBeenCalledWith('/r9-worker.js', { scope: '/r9.html' });

});
