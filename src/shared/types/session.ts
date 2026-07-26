export const SessionRoleEnum = {
  Idle: 'idle',
  Source: 'source',
  Target: 'target',
} as const;

export type SessionRole =
  (typeof SessionRoleEnum)[keyof typeof SessionRoleEnum];

export type LiveSessionStatus =
  | 'idle'
  | 'starting'
  | 'active'
  | 'paused'
  | 'degraded'
  | 'stopping'
  | 'error';

export type TargetConnectionStatus =
  | 'connecting'
  | 'ready'
  | 'syncing'
  | 'paused'
  | 'failed'
  | 'closed'
  | 'unsupported';

export interface PureSyncOptions {
  click: boolean;
  doubleClick: boolean;
  pointer: boolean;
  contextMenu: boolean;
  input: boolean;
  change: boolean;
  keyboard: boolean;
  focus: boolean;
  blur: boolean;
  scroll: boolean;
  mouseMove: boolean;
  hover: boolean;
  dragAndDrop: boolean;
  contentEditable: boolean;
  formActions: boolean;
  navigation: boolean;
  iframe: boolean;
  openShadowDom: boolean;
  coordinateFallback: boolean;
}

export const DEFAULT_PURE_SYNC_OPTIONS: PureSyncOptions = {
  click: true,
  doubleClick: true,
  pointer: true,
  contextMenu: true,
  input: true,
  change: true,
  keyboard: true,
  focus: true,
  blur: true,
  scroll: true,
  mouseMove: true,
  hover: true,
  dragAndDrop: true,
  contentEditable: true,
  formActions: true,
  navigation: true,
  iframe: true,
  openShadowDom: true,
  coordinateFallback: true,
};

export interface TargetOptions {
  delayMs: number;
  enabled: boolean;
}

export interface TargetRuntimeState {
  tabId: number;
  windowId?: number;
  status: TargetConnectionStatus;
  delayMs: number;
  lastAckSequence?: number;
  lastAckAt?: number;
  pendingEventCount: number;
  failureCount: number;
  lastErrorCode?: string;
}

export interface ExistingTabsSessionConfig {
  mode: 'existing-tabs';
  sourceTabId: number;
  targetTabIds: number[];
  targetOptions: Record<number, TargetOptions>;
  syncOptions: PureSyncOptions;
}

export interface UrlSessionConfig {
  mode: 'urls';
  sourceUrl: string;
  targetUrls: string[];
  syncOptions: PureSyncOptions;
}

export type SessionConfig = ExistingTabsSessionConfig | UrlSessionConfig;

export interface ActiveSession {
  id: string;
  mode: 'existing-tabs' | 'urls';
  status: LiveSessionStatus;
  sourceTabId: number;
  targetTabIds: number[];
  generation: number;
  sequenceNumber: number;
  startedAt: string;
  isPaused: boolean;
  syncOptions: PureSyncOptions;
  targetStates: Record<number, TargetRuntimeState>;
  sourceUrl?: string;
  targetUrls?: string[];
}

export interface BrowserTabSummary {
  id: number;
  windowId: number;
  index: number;
  active: boolean;
  pinned: boolean;
  title: string;
  url: string;
  favIconUrl?: string;
  supported: boolean;
  unsupportedReason?: string;
}

export interface HotkeyBinding {
  key: string;
  code?: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

export interface PageHotkeySettings {
  pause: HotkeyBinding;
  resume: HotkeyBinding;
  togglePause: HotkeyBinding;
  stop: HotkeyBinding;
  emergencyStop: HotkeyBinding;
  openControlCenter?: HotkeyBinding;
}

export const DEFAULT_PAGE_HOTKEYS: PageHotkeySettings = {
  pause: { key: 'Escape', ctrl: false, alt: false, shift: false, meta: false },
  resume: { key: 'F8', ctrl: false, alt: false, shift: false, meta: false },
  togglePause: { key: 'F9', ctrl: false, alt: false, shift: false, meta: false },
  stop: { key: 'F10', ctrl: false, alt: false, shift: false, meta: false },
  emergencyStop: {
    key: 'F12',
    ctrl: true,
    alt: false,
    shift: true,
    meta: false,
  },
};

export type EscapeBehavior =
  | 'hard-intercept'
  | 'pause-and-propagate'
  | 'disabled';

export interface TabEchoSettings {
  maxTargets: number;
  escapeBehavior: EscapeBehavior;
  pageHotkeys: PageHotkeySettings;
  allowSingleKeyShortcuts: boolean;
  allowShortcutsWhileTyping: boolean;
  defaultSyncOptions: PureSyncOptions;
}

export const DEFAULT_SETTINGS: TabEchoSettings = {
  maxTargets: 8,
  escapeBehavior: 'hard-intercept',
  pageHotkeys: DEFAULT_PAGE_HOTKEYS,
  allowSingleKeyShortcuts: false,
  allowShortcutsWhileTyping: false,
  defaultSyncOptions: DEFAULT_PURE_SYNC_OPTIONS,
};
