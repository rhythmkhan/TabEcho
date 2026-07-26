# TabEcho Privacy Policy

**Last Updated: July 2026**

TabEcho is designed with strict local privacy principles.

## Summary

- **No Remote Servers**: TabEcho operates 100% locally within your Chrome browser profile.
- **No Data Collection**: We do not collect, store, or transmit your browsing history, keystrokes, personal information, or interaction data.
- **No Telemetry / Analytics**: There are no third-party analytics, crash reporting, or tracking scripts.
- **No Recording**: TabEcho is a live-only synchronization tool. No interaction logs are saved or exported to disk or memory.

## Permissions Table

| Permission | Purpose | Data Accessed | Stored? |
|------------|---------|---------------|---------|
| `storage` | Persist live session options and settings | Active session tab IDs | Local Chrome profile only |
| `tabs` | Tab Picker display (window grouping, tab names, favicons) | Tab titles, URLs, favicons | No (memory only during picker) |
| `scripting` | Dynamic content script injection into selected tabs | Selected tab DOM | No |
