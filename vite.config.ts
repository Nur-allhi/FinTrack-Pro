import {execSync} from 'child_process';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {VitePWA} from 'vite-plugin-pwa';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import pkg from './package.json';

function getBuildId(): string {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA
    || process.env.SOURCE_VERSION
    || execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  return sha.slice(0, 7);
}

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const APP_URL = env.APP_URL || process.env.APP_URL;
  const buildId = getBuildId();

  const getVersion = () => {
    return `${pkg.version} -- g: ${buildId}`;
  };

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'inject-version',
        transformIndexHtml() {
          return [
            { tag: 'meta', attrs: { name: 'app-version', content: getVersion() }, injectTo: 'head-prepend' }
          ];
        },
      },
      VitePWA({
      srcDir: '.',
      filename: 'sw.ts',
      strategies: 'injectManifest',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'FinTrack Pro',
        short_name: 'FinTrack',
        description: 'Smart financial management for family accounts, members, and investments.',
        theme_color: '#ffffff',
        background_color: '#0a0b0d',
        display: 'fullscreen',
        display_override: ['fullscreen', 'window-controls-overlay', 'standalone'],
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        lang: 'en',
        categories: ['finance', 'productivity', 'business'],
        icons: [
          { src: 'icons/icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    })],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-charts': ['recharts'],
            'vendor-pdf': ['jspdf'],
            'vendor-motion': ['motion'],
            'vendor-xlsx': ['xlsx'],
            'vendor-html2canvas': ['html2canvas'],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'process.env.APP_URL': JSON.stringify(APP_URL),
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true' ? {
        clientPort: 443,
      } : false,
    },
  };
});