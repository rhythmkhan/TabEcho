# TabEcho Testing Guide

## Automated Unit Tests

Run the Jest test suite:

```bash
pnpm test
```

Run tests with coverage reporting:

```bash
pnpm test:coverage
```

## Manual Verification Matrix

Open `src/test-fixtures/test-page.html` in multiple tabs and verify:
1. Standard click, double-click, and link activation.
2. Text input, textarea, password field masking (`[REDACTED_SENSITIVE_DATA]`).
3. Checkbox toggle, radio button group selection, single-select dropdown.
4. Contenteditable live text sync.
5. Nested container scrolling.
6. Pressing `Escape` on Source tab → `TABECHO PAUSED` overlay appears, zero events sent.
7. Pressing `F8` on Source tab → Resumes sync, paused interactions are NOT replayed.
8. Triggering Emergency Stop → All sessions stop immediately.
