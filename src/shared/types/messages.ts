import { LiveSyncEvent, ReplayAck } from './dom-events';
import {
  ActiveSession,
  BrowserTabSummary,
  LiveSessionStatus,
  SessionConfig,
  SessionRole,
  TabEchoSettings,
} from './session';

export const ExtensionMessageTypeEnum = {
  StartSession: 'start-session',
  StopSession: 'stop-session',
  PauseSession: 'pause-session',
  ResumeSession: 'resume-session',
  EmergencyStop: 'emergency-stop',
  GetSession: 'get-session',
  SessionStarted: 'session-started',
  SessionError: 'session-error',
  SessionStatus: 'session-status',
  RemoveTarget: 'remove-target',
  LiveSyncEvent: 'live-sync-event',
  ReplayAck: 'replay-ack',
  SetRole: 'set-role',
  GetEligibleTabs: 'get-eligible-tabs',
  TabSummaryResponse: 'tab-summary-response',
  RequestHotkeyAction: 'request-hotkey-action',
  SaveSettings: 'save-settings',
  GetSettings: 'get-settings',
} as const;

export type ExtensionMessage =
  | { type: typeof ExtensionMessageTypeEnum.StartSession; payload: SessionConfig }
  | { type: typeof ExtensionMessageTypeEnum.StopSession; reason?: string }
  | { type: typeof ExtensionMessageTypeEnum.PauseSession; reason?: string }
  | { type: typeof ExtensionMessageTypeEnum.ResumeSession; reason?: string }
  | { type: typeof ExtensionMessageTypeEnum.EmergencyStop; reason?: string }
  | { type: typeof ExtensionMessageTypeEnum.GetSession }
  | { type: typeof ExtensionMessageTypeEnum.SessionStarted; payload: ActiveSession }
  | { type: typeof ExtensionMessageTypeEnum.SessionError; error: string }
  | { type: typeof ExtensionMessageTypeEnum.SessionStatus; payload: ActiveSession | null }
  | { type: typeof ExtensionMessageTypeEnum.RemoveTarget; payload: { targetTabId: number } }
  | { type: typeof ExtensionMessageTypeEnum.LiveSyncEvent; payload: LiveSyncEvent }
  | { type: typeof ExtensionMessageTypeEnum.ReplayAck; payload: ReplayAck }
  | {
      type: typeof ExtensionMessageTypeEnum.SetRole;
      role: SessionRole;
      generation: number;
      status: LiveSessionStatus;
      isPaused: boolean;
    }
  | { type: typeof ExtensionMessageTypeEnum.GetEligibleTabs }
  | { type: typeof ExtensionMessageTypeEnum.TabSummaryResponse; payload: BrowserTabSummary[] }
  | {
      type: typeof ExtensionMessageTypeEnum.RequestHotkeyAction;
      action: 'PAUSE' | 'RESUME' | 'TOGGLE_PAUSE' | 'STOP' | 'EMERGENCY_STOP';
      reason?: string;
    }
  | { type: typeof ExtensionMessageTypeEnum.SaveSettings; settings: TabEchoSettings }
  | { type: typeof ExtensionMessageTypeEnum.GetSettings };

export type ExtensionMessageType = ExtensionMessage['type'];
