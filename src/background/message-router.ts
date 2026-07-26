import {
  ExtensionMessage,
  ExtensionMessageTypeEnum,
} from '@/shared/types';
import { SessionManager } from './session-manager';
import { queryEligibleTabs } from './tab-discovery';

export function createMessageRouter(sessionManager: SessionManager): void {
  chrome.runtime.onMessage.addListener(
    (
      message: ExtensionMessage,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: ExtensionMessage) => void,
    ) => {
      switch (message.type) {
        case ExtensionMessageTypeEnum.StartSession: {
          sessionManager
            .start(message.payload, sendResponse)
            .catch((err: unknown) => {
              sendResponse({
                type: ExtensionMessageTypeEnum.SessionError,
                error: err instanceof Error ? err.message : String(err),
              });
            });
          return true;
        }

        case ExtensionMessageTypeEnum.PauseSession: {
          sessionManager
            .pause(message.reason)
            .then(() => {
              sendResponse({
                type: ExtensionMessageTypeEnum.SessionStatus,
                payload: sessionManager.currentSession,
              });
            })
            .catch((err: unknown) => {
              sendResponse({
                type: ExtensionMessageTypeEnum.SessionError,
                error: err instanceof Error ? err.message : String(err),
              });
            });
          return true;
        }

        case ExtensionMessageTypeEnum.ResumeSession: {
          sessionManager
            .resume(message.reason)
            .then(() => {
              sendResponse({
                type: ExtensionMessageTypeEnum.SessionStatus,
                payload: sessionManager.currentSession,
              });
            })
            .catch((err: unknown) => {
              sendResponse({
                type: ExtensionMessageTypeEnum.SessionError,
                error: err instanceof Error ? err.message : String(err),
              });
            });
          return true;
        }

        case ExtensionMessageTypeEnum.StopSession: {
          sessionManager
            .stop(message.reason)
            .then(() => {
              sendResponse({
                type: ExtensionMessageTypeEnum.SessionStatus,
                payload: sessionManager.currentSession,
              });
            })
            .catch(() => {
              sendResponse({
                type: ExtensionMessageTypeEnum.SessionStatus,
                payload: sessionManager.currentSession,
              });
            });
          return true;
        }

        case ExtensionMessageTypeEnum.EmergencyStop: {
          sessionManager
            .emergencyStop(message.reason)
            .then(() => {
              sendResponse({
                type: ExtensionMessageTypeEnum.SessionStatus,
                payload: sessionManager.currentSession,
              });
            })
            .catch(() => {
              sendResponse({
                type: ExtensionMessageTypeEnum.SessionStatus,
                payload: sessionManager.currentSession,
              });
            });
          return true;
        }

        case ExtensionMessageTypeEnum.GetSession: {
          sendResponse({
            type: ExtensionMessageTypeEnum.SessionStatus,
            payload: sessionManager.currentSession,
          });
          break;
        }

        case ExtensionMessageTypeEnum.GetEligibleTabs: {
          queryEligibleTabs()
            .then((tabs) => {
              sendResponse({
                type: ExtensionMessageTypeEnum.TabSummaryResponse,
                payload: tabs,
              });
            })
            .catch(() => {
              sendResponse({
                type: ExtensionMessageTypeEnum.TabSummaryResponse,
                payload: [],
              });
            });
          return true;
        }

        case ExtensionMessageTypeEnum.RemoveTarget: {
          sessionManager
            .removeTarget(message.payload.targetTabId)
            .then(() => {
              sendResponse({
                type: ExtensionMessageTypeEnum.SessionStatus,
                payload: sessionManager.currentSession,
              });
            })
            .catch((err: unknown) => {
              sendResponse({
                type: ExtensionMessageTypeEnum.SessionError,
                error: err instanceof Error ? err.message : String(err),
              });
            });
          return true;
        }

        case ExtensionMessageTypeEnum.RequestHotkeyAction: {
          const { action, reason } = message;
          if (action === 'PAUSE') {
            void sessionManager.pause(reason);
          } else if (action === 'RESUME') {
            void sessionManager.resume(reason);
          } else if (action === 'TOGGLE_PAUSE') {
            const current = sessionManager.currentSession;
            if (current?.isPaused) {
              void sessionManager.resume(reason);
            } else {
              void sessionManager.pause(reason);
            }
          } else if (action === 'STOP') {
            void sessionManager.stop(reason);
          } else {
            void sessionManager.emergencyStop(reason);
          }
          break;
        }

        case ExtensionMessageTypeEnum.LiveSyncEvent: {
          const session = sessionManager.currentSession;
          if (!session || session.isPaused) break;
          if (sender.tab?.id !== session.sourceTabId) break;

          const event = message.payload;
          if (event.generation !== session.generation) break;

          event.sequence = sessionManager.getNextSequence();

          const jsonString = JSON.stringify(event);
          if (jsonString.length > 102400) {
            break;
          }

          const promises = session.targetTabIds.map(async (targetTabId) => {
            const targetState = session.targetStates[targetTabId];
            const delay = targetState.delayMs;

            if (delay > 0) {
              await new Promise((resolve) => setTimeout(resolve, delay));
            }

            try {
              await chrome.tabs.sendMessage(targetTabId, {
                type: ExtensionMessageTypeEnum.LiveSyncEvent,
                payload: event,
              });
            } catch {
              sessionManager.targetHealth.processAck({
                eventId: event.eventId,
                sequence: event.sequence,
                generation: event.generation,
                tabId: targetTabId,
                success: false,
                durationMs: 0,
                errorCode: 'DELIVERY_FAILED',
                errorMessage: 'Could not send message to tab',
              });
            }
          });

          void Promise.allSettled(promises);
          break;
        }

        case ExtensionMessageTypeEnum.ReplayAck: {
          const ack = message.payload;
          sessionManager.targetHealth.processAck(ack);
          break;
        }

        default:
          break;
      }
    },
  );
}
