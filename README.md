# TabEcho

> **One Action. Every Tab.**

TabEcho is a Chrome extension designed for real-time interaction synchronization. It allows a user to select one existing browser tab as the **Source** and multiple tabs (**Targets**) across any number of Chrome windows within the same browser profile. Actions performed in the Source tab are captured live and synchronized instantly to all selected Target tabs.

![TabEcho Control Center](public/icon128.png)

## Key Features

- **Multi-Window & Multi-Target Sync**: Synchronize actions from 1 Source tab to up to 32 Target tabs across multiple Chrome windows.
- **Pure Real-Time Synchronization**: Instant propagation of clicks, double-clicks, typing, checkboxes, radio buttons, select dropdowns, contenteditable text, scrolling, and mouse movements.
- **Escape-to-Pause**: Press `Escape` on the Source webpage to immediately pause synchronization with visual status overlays (`TABECHO PAUSED`).
- **Dual Shortcut System**: Supports both page-level hotkeys (`Esc`, `F8`, `F9`, `F10`, `Ctrl+Shift+F12`) and browser-level Chrome Extension Commands.
- **Generation-Based Session Guard**: Ensures actions taken while paused are never replayed upon resuming.
- **100% Local & Privacy-Conscious**: Zero telemetry, no cloud backend, no account required. Sensitive fields (passwords, payment cards, file inputs) are automatically masked and never transmitted.

## Quick Installation (Load Unpacked)

1. Clone or download the repository.
2. Build the project:
   ```bash
   pnpm install
   pnpm build
   ```
3. Open Chrome and navigate to `chrome://extensions`.
4. Enable **Developer mode** in the top-right corner.
5. Click **Load unpacked** and select the `dist/` folder.

## How to Use

1. Click the **TabEcho icon** in the Chrome toolbar or open the **Control Center** (`src/manager/index.html`).
2. Select **1 Source tab** using the radio button.
3. Select **1 or more Target tabs** using the checkboxes (across any open Chrome window).
4. Click **⚡ Start Live Sync**.
5. Perform actions on your Source tab—watch all Target tabs replicate your actions in real time!
6. Press **Escape** or **F8** to Pause or Resume at any time.

## Documentation Links

- [Installation Guide](INSTALLATION.md)
- [Usage & Shortcuts](USAGE.md)
- [Architecture Overview](ARCHITECTURE.md)
- [Privacy Policy](PRIVACY_POLICY.md)
- [Security Policy](SECURITY.md)
- [Attribution Notice](ATTRIBUTION.md)
- [Browser Limitations](LIMITATIONS.md)
- [Testing Guide](TESTING.md)

## License

TabEcho is licensed under the [MIT License](LICENSE).  
Based on MirrorTab by Konstantine Datunishvili (see [ATTRIBUTION.md](ATTRIBUTION.md)).
