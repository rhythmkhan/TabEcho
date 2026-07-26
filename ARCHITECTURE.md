# TabEcho Architecture

## System Overview

TabEcho uses Manifest V3 service workers and content script event injection to mirror interactions live without intermediate recording.

```text
Source Tab DOM Event
  → Content Script EventCapture (Intercepts & Normalizes)
  → chrome.runtime.sendMessage (LiveSyncEvent)
  → Background Service Worker (Validates Generation & Session)
  → Promise.allSettled Broadcast
  → Target Content Script EventApplier
  → ElementResolver (Multi-Candidate & MutationObserver Retry)
  → Synthetic Event Dispatch & State Application
  → ReplayAck
```

## Security & Isolation

- **Generation Counter**: Every pause/resume increments `generation`. Outdated events are immediately dropped.
- **Shadow DOM Overlays**: Status badges and virtual cursors are isolated inside Shadow DOM elements to avoid host page CSS pollution.
- **Sensitive Detector**: Automatically redacts values for password fields, credit card autocomplete, tokens, and `data-tabecho-ignore` elements.
