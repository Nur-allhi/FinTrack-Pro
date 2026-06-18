import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ToastProvider} from './components/Toast.tsx';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      const isUpdate = !!navigator.serviceWorker.controller;

      if (reg.active && !isUpdate) {
        reg.active.postMessage({ type: 'SKIP_WAITING' });
      }

      const onWorkerStateChange = (worker: ServiceWorker | null, willReplace: boolean) => {
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && willReplace) {
            worker.postMessage({ type: 'SKIP_WAITING' });
          }
          if (worker.state === 'activated' && willReplace) {
            window.location.reload();
          }
        });
      };

      if (reg.installing) {
        onWorkerStateChange(reg.installing, isUpdate);
      }

      reg.addEventListener('updatefound', () => {
        onWorkerStateChange(reg.installing, !!navigator.serviceWorker.controller);
      });

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SYNC_OFFLINE_QUEUE') {
          window.dispatchEvent(new CustomEvent('sw-sync-offline'));
        }
        if (event.data?.type === 'MUTATION_QUEUE') {
          // Trigger sync engine to flush pending records
          import('./services/syncEngine').then(m => m.flushPending()).catch(() => {});
        }
      });

      try {
        const readyReg = await navigator.serviceWorker.ready;
        if ('sync' in readyReg) {
          (readyReg as any).sync.register('sync-offline-queue').catch(() => {});
        }
      } catch {}
    } catch {}
  });
}

window.addEventListener('sw-sync-offline', () => {
  import('./services/syncEngine').then(m => m.flushPending()).catch(() => {});
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
);