import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

export default defineManifest({
  manifest_version: 3,
  name: 'TabEcho',
  version: pkg.version,
  description:
    'Synchronize clicks, inputs, scrolling, and other supported interactions from one browser tab to multiple selected tabs across Chrome windows.',
  icons: {
    16: 'public/icon16.png',
    32: 'public/icon32.png',
    48: 'public/icon48.png',
    128: 'public/icon128.png',
  },
  action: {
    default_icon: {
      16: 'public/icon16.png',
      32: 'public/icon32.png',
      48: 'public/icon48.png',
      128: 'public/icon128.png',
    },
    default_popup: 'src/popup/index.html',
    default_title: 'TabEcho Control Center',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      js: ['src/content/main.ts'],
      matches: ['https://*/*', 'http://*/*'],
      run_at: 'document_idle',
      all_frames: true,
    },
  ],
  permissions: ['storage', 'tabs', 'scripting'],
  host_permissions: ['http://*/*', 'https://*/*'],
  commands: {
    'tabecho-toggle-pause': {
      suggested_key: {
        default: 'Ctrl+Shift+P',
        mac: 'Command+Shift+P',
      },
      description: 'Pause or resume TabEcho live synchronization',
    },
    'tabecho-resume': {
      suggested_key: {
        default: 'Ctrl+Shift+R',
        mac: 'Command+Shift+R',
      },
      description: 'Resume TabEcho live synchronization',
    },
    'tabecho-stop': {
      suggested_key: {
        default: 'Ctrl+Shift+S',
        mac: 'Command+Shift+S',
      },
      description: 'Stop active TabEcho session',
    },
    'tabecho-emergency-stop': {
      suggested_key: {
        default: 'Ctrl+Shift+X',
        mac: 'Command+Shift+X',
      },
      description: 'Emergency stop TabEcho synchronization',
    },
    'tabecho-open-control-center': {
      description: 'Open TabEcho Control Center',
    },
  },
});
