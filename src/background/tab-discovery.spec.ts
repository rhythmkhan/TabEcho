import { isTabSupported } from './tab-discovery';

describe('tab-discovery', () => {
  it('supports http and https URLs', () => {
    expect(isTabSupported({ id: 1, url: 'https://example.com' } as chrome.tabs.Tab).supported).toBe(true);
    expect(isTabSupported({ id: 2, url: 'http://localhost:3000' } as chrome.tabs.Tab).supported).toBe(true);
  });

  it('rejects chrome:// and edge:// internal URLs', () => {
    expect(isTabSupported({ id: 3, url: 'chrome://extensions' } as chrome.tabs.Tab).supported).toBe(false);
    expect(isTabSupported({ id: 4, url: 'edge://settings' } as chrome.tabs.Tab).supported).toBe(false);
  });

  it('rejects Chrome Web Store URLs', () => {
    expect(isTabSupported({ id: 5, url: 'https://chromewebstore.google.com/detail/123' } as chrome.tabs.Tab).supported).toBe(false);
  });
});
