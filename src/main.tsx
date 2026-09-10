import './utils/leafletPatch';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker with automatic updates for offline PWA capabilities
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] New version available; refreshing cache.');
  },
  onOfflineReady() {
    console.log('[PWA] Arogyavahini is ready for offline and home screen use.');
  },
  onRegisterError(error) {
    console.warn('[PWA] Service worker registration notice:', error);
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
