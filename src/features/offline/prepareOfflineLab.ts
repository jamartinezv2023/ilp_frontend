export type OfflinePreparation = 'ready' | 'unavailable';
export async function prepareOfflineLab(): Promise<OfflinePreparation> {
  if (!globalThis.navigator?.serviceWorker) return 'unavailable';
  let channel: MessageChannel | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      (async () => {
        await navigator.serviceWorker.register('/p02-worker.js', { scope: '/p02.html' });
        const registration = await navigator.serviceWorker.ready;
        if (!registration.active) throw new Error('OFFLINE_WORKER_INACTIVE');
        const activeWorker = registration.active;
        channel = new MessageChannel();
        const current = channel;
        await new Promise<void>((resolve, reject) => {
          current.port1.onmessage = event => {
            if (event.data === true) resolve();
            else reject(new Error('OFFLINE_CACHE_INCOMPLETE'));
          };
          activeWorker.postMessage({ type: 'P02_VERIFY_CACHE' }, [current.port2]);
        });
      })(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('OFFLINE_PREPARATION_TIMEOUT')), 10000);
      }),
    ]);
    return 'ready';
  } catch { return 'unavailable'; }
  finally { clearTimeout(timer); channel?.port1.close(); channel?.port2.close(); }
}
