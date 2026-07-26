import { MAX_RETRY_ATTEMPTS } from '@/shared/consts';
import { ExtensionMessageTypeEnum, SessionRoleEnum } from '@/shared/types';
import { chrome } from 'jest-chrome';
import { logger } from '../logger/logger';
import { normaliseUrl } from '../url/url';
import { openTab, sendRoleToTab, waitForTabLoad } from './tab';

jest.mock('../logger/logger', () => ({
  logger: {
    warn: jest.fn(),
  },
}));

jest.mock('../url/url', () => ({
  normaliseUrl: jest.fn((url: string) => url),
}));

describe('Tab utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('openTab', () => {
    test('creates a new tab with normalized URL and inactive', async () => {
      (chrome.tabs.create as jest.Mock).mockResolvedValue({
        id: 123,
      } as unknown as chrome.tabs.Tab);

      const url = 'http://example.com';
      const result = await openTab(url);

      expect(normaliseUrl).toHaveBeenCalledWith(url);
      expect(chrome.tabs.create).toHaveBeenCalledWith({ url, active: false });
      expect(result.id).toBe(123);
    });
  });

  describe('waitForTabLoad', () => {
    test('resolves immediately if tab is already complete', async () => {
      (chrome.tabs.get as jest.Mock).mockResolvedValue({
        status: 'complete',
      } as unknown as chrome.tabs.Tab);

      await expect(waitForTabLoad(1)).resolves.toBeUndefined();
    });

    test('registers onUpdated listener and resolves when matching tab is complete', async () => {
      (chrome.tabs.get as jest.Mock).mockResolvedValue({
        status: 'loading',
      } as unknown as chrome.tabs.Tab);

      const tabId = 42;
      const promise = waitForTabLoad(tabId);

      await Promise.resolve();

      expect(chrome.tabs.onUpdated.hasListeners()).toBe(true);

      chrome.tabs.onUpdated.callListeners(
        tabId,
        { status: 'complete' },
        { status: 'complete' } as unknown as chrome.tabs.Tab,
      );

      await expect(promise).resolves.toBeUndefined();
      expect(chrome.tabs.onUpdated.hasListeners()).toBe(false);
    });
  });

  describe('sendRoleToTab', () => {
    test('sends role message immediately if sendMessage succeeds', async () => {
      const tabId = 1;
      (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue(undefined);

      await sendRoleToTab(tabId, SessionRoleEnum.Source, 1, 'active', false);

      expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(1);
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(tabId, {
        type: ExtensionMessageTypeEnum.SetRole,
        role: SessionRoleEnum.Source,
        generation: 1,
        status: 'active',
        isPaused: false,
      });
      expect(logger.warn).not.toHaveBeenCalled();
    });

    test('logs a warning after exhausting all retry attempts', async () => {
      const tabId = 9;
      (chrome.tabs.sendMessage as jest.Mock).mockRejectedValue(
        new Error('always fails'),
      );

      const promise = sendRoleToTab(tabId, SessionRoleEnum.Target, 1, 'active', false);
      await jest.runAllTimersAsync();
      await promise;

      expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(MAX_RETRY_ATTEMPTS);
      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining(`SET_ROLE:${SessionRoleEnum.Target}`),
      );
    });
  });
});
