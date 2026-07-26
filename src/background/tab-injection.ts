import { logger } from '@/shared/util';

export async function injectContentScript(tabId: number): Promise<boolean> {
  try {
    const manifest = chrome.runtime.getManifest();
    const contentScriptFile = manifest.content_scripts?.[0]?.js?.[0];
    const fileToInject = contentScriptFile || 'src/content/main.ts';

    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: [fileToInject],
    });
    return true;
  } catch (err) {
    logger.warn(`Dynamic injection skipped for tab ${tabId.toString()}:`, err);
    return false;
  }
}
