# TabEcho Installation Guide

## Prerequisites

- Node.js v18 or higher
- `pnpm` package manager (`npm install -g pnpm`)
- Google Chrome browser (v110+)

## Building from Source

```bash
git clone https://github.com/user/TabEcho.git
cd TabEcho
pnpm install
pnpm build
```

The compiled Chrome Extension will be generated in the `dist/` directory, and a packaged release ZIP in `releases/tabecho-v0.1.0.zip`.

## Loading Unpacked Extension in Chrome

1. Open Google Chrome.
2. Navigate to `chrome://extensions/`.
3. Toggle the **Developer mode** switch in the top-right corner to **ON**.
4. Click the **Load unpacked** button.
5. In the file dialog, select the `dist/` folder inside the `TabEcho` project root.
6. The TabEcho extension icon will appear in your Chrome toolbar.

## Service Worker Diagnostics

To inspect the background service worker:
1. Go to `chrome://extensions/`.
2. Find the **TabEcho** card.
3. Click **service worker** under "Inspect views".
