import { SessionRoleEnum } from '@/shared/types';
import { sendRoleToTab } from '@/shared/util';
import { SessionManager } from './session-manager';
import { injectContentScript } from './tab-injection';

export function setupTabLifecycle(sessionManager: SessionManager): void {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    void (async () => {
      const session = sessionManager.currentSession;
      if (!session) return;
      if (changeInfo.status !== 'complete') return;

      if (tabId === session.sourceTabId) {
        await injectContentScript(tabId);
        await sendRoleToTab(
          tabId,
          SessionRoleEnum.Source,
          session.generation,
          session.status,
          session.isPaused,
        );
      } else if (session.targetTabIds.includes(tabId)) {
        await injectContentScript(tabId);
        await sendRoleToTab(
          tabId,
          SessionRoleEnum.Target,
          session.generation,
          session.status,
          session.isPaused,
        );
        sessionManager.targetHealth.setTargetReady(tabId);
      }
    })();
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    void (async () => {
      const session = sessionManager.currentSession;
      if (!session) return;

      if (tabId === session.sourceTabId) {
        await sessionManager.stop('source-tab-closed');
      } else if (session.targetTabIds.includes(tabId)) {
        await sessionManager.removeTarget(tabId);
      }
    })();
  });

  chrome.windows.onRemoved.addListener((windowId) => {
    void (async () => {
      const session = sessionManager.currentSession;
      if (!session) return;

      try {
        const sourceTab = await chrome.tabs.get(session.sourceTabId);
        if (sourceTab.windowId === windowId) {
          await sessionManager.stop('source-window-closed');
        }
      } catch {
        await sessionManager.stop('source-tab-not-found');
      }
    })();
  });
}
