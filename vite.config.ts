import {execSync} from 'child_process';
import fs from 'fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {VitePWA} from 'vite-plugin-pwa';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import pkg from './package.json';

const BUILD_NUMBER_FILE = '.build-number';

function getAndIncrementBuildNumber(): number {
  let buildNumber = 1;
  try {
    buildNumber = parseInt(fs.readFileSync(BUILD_NUMBER_FILE, 'utf-8').trim(), 10) + 1;
  } catch { /* file doesn't exist yet, start at 1 */ }
  fs.writeFileSync(BUILD_NUMBER_FILE, String(buildNumber));
  return buildNumber;
}

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const APP_URL = env.APP_URL || process.env.APP_URL;
  const buildNumber = getAndIncrementBuildNumber();

  const getVersion = () => {
    return `${pkg.version}+${buildNumber}`;
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
        theme_color: '#0a0b0d',
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