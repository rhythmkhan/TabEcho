import path from 'node:path';
import { crx } from '@crxjs/vite-plugin';
import { defineConfig } from 'vite';
import zip from 'vite-plugin-zip-pack';
import manifest from './manifest.config.js';
import { version } from './package.json';

export default defineConfig({
  resolve: {
    alias: {
      '@': `${path.resolve(__dirname, 'src')}`,
    },
  },
  plugins: [
    crx({ manifest }),
    zip({ outDir: 'releases', outFileName: `tabecho-v${version}.zip` }),
  ],
  build: {
    rollupOptions: {
      input: {
        manager: 'src/manager/index.html',
      },
    },
  },
  server: {
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
});
