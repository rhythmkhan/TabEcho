import {
  ActiveSession,
  ExtensionMessage,
  ExtensionMessageTypeEnum,
  LiveSyncEvent,
  LiveSyncPayload,
  PureSyncOptions,
} from '@/shared/types';
import { chrome } from 'jest-chrome';
import { createMessageRouter } from './message-router';
import { SessionManager } from './session-manager';

type Listener = (
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: ExtensionMessage) => void,
) => boolean | void;

describe('createMessageRouter', () => {
  let manager: jest.Mocked<
    Pick<
      SessionManager,
      | 'start'
      | 'pause'
      | 'resume'
      | 'stop'
      | 'emergencyStop'
      | 'removeTarget'
      | 'getNextSequence'
    >
  > & {
    currentSession: ActiveSession | null;
    targetHealth: { processAck: jest.Mock };
  };

  let listener: Listener;

  beforeEach(() => {
    jest.clearAllMocks();
    chrome.runtime.onMessage.clearListeners();

    const captured: { fn: Listener | null } = { fn: null };
    jest
      .spyOn(chrome.runtime.onMessage, 'addListener')
      .mockImplementation((l) => {
        captured.fn = l as unknown as Listener;
      });

    manager = {
      start: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn().mockResolvedValue(undefined),
      resume: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      emergencyStop: jest.fn().mockResolvedValue(undefined),
      removeTarget: jest.fn().mockResolvedValue(undefined),
      getNextSequence: jest.fn().mockReturnValue(1),
      currentSession: null,
      targetHealth: { processAck: jest.fn() },
    };

    createMessageRouter(manager as unknown as SessionManager);
    listener = captured.fn!;
  });

  it('delegates StartSession to sessionManager.start', () => {
    const sendResponse = jest.fn();
    const payload = {
      mode: 'existing-tabs' as const,
      sourceTabId: 1,
      targetTabIds: [2],
      targetOptions: {},
      syncOptions: { click: true } as unknown as PureSyncOptions,
    };

    const result = listener(
      { type: ExtensionMessageTypeEnum.StartSession, payload },
      {} as chrome.runtime.MessageSender,
      sendResponse,
    );

    expect(result).toBe(true);
    expect(manager.start).toHaveBeenCalledWith(payload, sendResponse);
  });

  it('delegates EmergencyStop to sessionManager.emergencyStop', async () => {
    const sendResponse = jest.fn();
    const result = listener(
      { type: ExtensionMessageTypeEnum.EmergencyStop, reason: 'test' },
      {} as chrome.runtime.MessageSender,
      sendResponse,
    );

    expect(result).toBe(true);
    await flushPromises();

    expect(manager.emergencyStop).toHaveBeenCalledWith('test');
  });

  it('routes LiveSyncEvent to target tabs when valid', async () => {
    manager.currentSession = {
      id: 'sess-1',
      mode: 'existing-tabs',
      status: 'active',
      sourceTabId: 10,
      targetTabIds: [20, 30],
      generation: 1,
      sequenceNumber: 0,
      startedAt: '',
      isPaused: false,
      syncOptions: {} as unknown as PureSyncOptions,
      targetStates: {
        20: { tabId: 20, status: 'ready', delayMs: 0, pendingEventCount: 0, failureCount: 0 },
        30: { tabId: 30, status: 'ready', delayMs: 0, pendingEventCount: 0, failureCount: 0 },
      },
    };

    const event: LiveSyncEvent = {
      schemaVersion: 1,
      sessionId: 'sess-1',
      eventId: 'evt-1',
      sequence: 0,
      generation: 1,
      createdAt: Date.now(),
      sourceTabId: 10,
      type: 'click',
      frame: { isTop: true, path: [] },
      target: null,
      payload: { value: '' } as LiveSyncPayload,
    };

    (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue(undefined);

    listener(
      { type: ExtensionMessageTypeEnum.LiveSyncEvent, payload: event },
      { tab: { id: 10 } } as chrome.runtime.MessageSender,
      jest.fn(),
    );

    await flushPromises();

    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(20, {
      type: ExtensionMessageTypeEnum.LiveSyncEvent,
      payload: event,
    });
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(30, {
      type: ExtensionMessageTypeEnum.LiveSyncEvent,
      payload: event,
    });
  });
});

async function flushPromises(): Promise<void> {
  for (let i = 0; i < 20; i++) {
    await Promise.resolve();
  }
}
