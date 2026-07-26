import {
  ActiveSession,
  DEFAULT_PURE_SYNC_OPTIONS,
  ExtensionMessageTypeEnum,
  SessionRoleEnum,
} from '@/shared/types';
import { sendRoleToTab } from '@/shared/util';
import { chrome } from 'jest-chrome';
import { SessionManager } from './session-manager';

jest.mock('@/shared/util', () => ({
  openTab: jest.fn(),
  sendRoleToTab: jest.fn(),
  waitForTabLoad: jest.fn(),
}));

jest.mock('./tab-injection', () => ({
  injectContentScript: jest.fn().mockResolvedValue(true),
}));

const mockedSendRoleToTab = sendRoleToTab as jest.MockedFunction<
  typeof sendRoleToTab
>;

describe('SessionManager', () => {
  let manager: SessionManager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new SessionManager();

    (chrome.storage.local.get as jest.Mock).mockResolvedValue({});
    (chrome.storage.local.set as jest.Mock).mockResolvedValue(undefined);
    (chrome.storage.local.remove as jest.Mock).mockResolvedValue(undefined);
    (chrome.tabs.update as jest.Mock).mockResolvedValue(undefined);
    (chrome.tabs.get as jest.Mock).mockImplementation((id: number) =>
      Promise.resolve({ id, url: 'https://example.com', status: 'complete' }),
    );

    mockedSendRoleToTab.mockResolvedValue(undefined);
  });

  describe('start (Existing Tabs mode)', () => {
    it('starts session, assigns roles, and persists state', async () => {
      const sendResponse = jest.fn();
      await manager.start(
        {
          mode: 'existing-tabs',
          sourceTabId: 10,
          targetTabIds: [20, 30],
          targetOptions: {},
          syncOptions: DEFAULT_PURE_SYNC_OPTIONS,
        },
        sendResponse,
      );

      expect(mockedSendRoleToTab).toHaveBeenCalledWith(
        10,
        SessionRoleEnum.Source,
        1,
        'active',
        false,
      );
      expect(mockedSendRoleToTab).toHaveBeenCalledWith(
        20,
        SessionRoleEnum.Target,
        1,
        'active',
        false,
      );
      expect(mockedSendRoleToTab).toHaveBeenCalledWith(
        30,
        SessionRoleEnum.Target,
        1,
        'active',
        false,
      );

      expect(chrome.storage.local.set).toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ExtensionMessageTypeEnum.SessionStarted,
        }),
      );
    });

    it('rejects if source tab is also in target tab list', async () => {
      const sendResponse = jest.fn();
      await manager.start(
        {
          mode: 'existing-tabs',
          sourceTabId: 10,
          targetTabIds: [10, 20],
          targetOptions: {},
          syncOptions: DEFAULT_PURE_SYNC_OPTIONS,
        },
        sendResponse,
      );

      expect(sendResponse).toHaveBeenCalledWith({
        type: ExtensionMessageTypeEnum.SessionError,
        error: 'DUPLICATE_TAB: Source tab cannot also be a Target tab',
      });
    });

    it('rejects if target tab count exceeds hard maximum limit of 32', async () => {
      const excessiveTargets = Array.from({ length: 35 }, (_, i) => i + 100);
      const sendResponse = jest.fn();
      await manager.start(
        {
          mode: 'existing-tabs',
          sourceTabId: 1,
          targetTabIds: excessiveTargets,
          targetOptions: {},
          syncOptions: DEFAULT_PURE_SYNC_OPTIONS,
        },
        sendResponse,
      );

      expect(sendResponse).toHaveBeenCalledWith({
        type: ExtensionMessageTypeEnum.SessionError,
        error: 'TARGET_LIMIT_EXCEEDED: Cannot exceed hard maximum of 32 targets',
      });
    });
  });

  describe('pause and resume', () => {
    it('pause updates status, increments generation, and sends paused state', async () => {
      await primeSession(manager);
      const genBefore = manager.currentSession?.generation || 0;

      await manager.pause();

      expect(manager.currentSession?.isPaused).toBe(true);
      expect(manager.currentSession?.status).toBe('paused');
      expect(manager.currentSession?.generation).toBe(genBefore + 1);
    });

    it('resume clears paused status and increments generation', async () => {
      await primeSession(manager);
      await manager.pause();
      const genPaused = manager.currentSession?.generation || 0;

      await manager.resume();

      expect(manager.currentSession?.isPaused).toBe(false);
      expect(manager.currentSession?.status).toBe('active');
      expect(manager.currentSession?.generation).toBe(genPaused + 1);
    });
  });
});

async function primeSession(manager: SessionManager): Promise<ActiveSession> {
  const sendResponse = jest.fn();
  await manager.start(
    {
      mode: 'existing-tabs',
      sourceTabId: 10,
      targetTabIds: [20, 30],
      targetOptions: {},
      syncOptions: DEFAULT_PURE_SYNC_OPTIONS,
    },
    sendResponse,
  );
  return manager.currentSession!;
}
