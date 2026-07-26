import { BrowserTabSummary } from '@/shared/types';

export function isTabSupported(tab: chrome.tabs.Tab): { supported: boolean; reason?: string } {
  if (tab.id === undefined || tab.id < 0) {
    return { supported: false, reason: 'Invalid tab ID' };
  }

  const url = tab.url || tab.pendingUrl || '';
  if (!url) {
    return { supported: false, reason: 'Tab URL not accessible' };
  }

  const unsupportedPrefixes = [
    'chrome://',
    'chrome-extension://',
    'edge://',
    'about:',
    'view-source:',
    'devtools://',
  ];

  for (const prefix of unsupportedPrefixes) {
    if (url.startsWith(prefix)) {
      return { supported: false, reason: `Internal browser page (${prefix})` };
    }
  }

  if (url.includes('chromewebstore.google.com') || url.includes('chrome.google.com/webstore')) {
    return { supported: false, reason: 'Chrome Web Store (Extension injection restricted)' };
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return { supported: false, reason: 'Only http:// and https:// URLs supported' };
  }

  return { supported: true };
}

export async function queryEligibleTabs(): Promise<BrowserTabSummary[]> {
  const tabs = await chrome.tabs.query({});
  return tabs.map((t) => {
    const { supported, reason } = isTabSupported(t);
    return {
      id: t.id ?? -1,
      windowId: t.windowId,
      index: t.index,
      active: t.active,
      pinned: t.pinned,
      title: t.title || 'Untitled Tab',
      url: t.url || t.pendingUrl || '',
      favIconUrl: t.favIconUrl,
      supported,
      unsupportedReason: reason,
    };
  });
}
