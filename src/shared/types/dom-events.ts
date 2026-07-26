export type SelectorStrategy =
  | 'unique-id'
  | 'test-attribute'
  | 'name'
  | 'aria'
  | 'stable-attribute'
  | 'css-path'
  | 'text-role'
  | 'coordinate';

export interface SelectorCandidate {
  strategy: SelectorStrategy;
  value: string;
  confidence: number;
}

export interface NormalizedBoundingBox {
  widthRatio: number;
  heightRatio: number;
}

export interface ElementDescriptor {
  tagName: string;
  inputType?: string;
  role?: string;
  accessibleName?: string;
  textHint?: string;
  attributes: Record<string, string>;
  selectors: SelectorCandidate[];
  boundingBox?: NormalizedBoundingBox;
}

export interface FrameDescriptor {
  isTop: boolean;
  origin?: string;
  path: number[];
}

export type LiveSyncEventType =
  | 'click'
  | 'dblclick'
  | 'mousedown'
  | 'mouseup'
  | 'contextmenu'
  | 'input'
  | 'change'
  | 'keydown'
  | 'keyup'
  | 'focus'
  | 'blur'
  | 'scroll'
  | 'mousemove'
  | 'hover'
  | 'dragstart'
  | 'dragover'
  | 'drop'
  | 'contenteditable'
  | 'submit-intent';

export const LiveSyncEventTypeEnum = {
  Click: 'click',
  Dblclick: 'dblclick',
  Mousedown: 'mousedown',
  Mouseup: 'mouseup',
  Contextmenu: 'contextmenu',
  Input: 'input',
  Change: 'change',
  Keydown: 'keydown',
  Keyup: 'keyup',
  Focus: 'focus',
  Blur: 'blur',
  Scroll: 'scroll',
  Mousemove: 'mousemove',
  Hover: 'hover',
  Dragstart: 'dragstart',
  Dragover: 'dragover',
  Drop: 'drop',
  Contenteditable: 'contenteditable',
  SubmitIntent: 'submit-intent',
} as const;

export interface DomInputPayload {
  value: string;
  checked?: boolean;
  indeterminate?: boolean;
  selectedOptions?: string[];
  isSensitive?: boolean;
}

export interface DomMousePayload {
  button?: number;
  buttons?: number;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  offsetXRatio?: number;
  offsetYRatio?: number;
  clientXRatio?: number;
  clientYRatio?: number;
}

export interface DomKeyboardPayload {
  key: string;
  code: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  repeat?: boolean;
}

export interface DomScrollPayload {
  scrollX: number;
  scrollY: number;
  isWindow: boolean;
}

export interface DomMousemovePayload {
  xRatio: number;
  yRatio: number;
  cursorStyle?: string;
}

export interface DomContentEditablePayload {
  text: string;
}

export interface DomDragPayload {
  xRatio: number;
  yRatio: number;
  dataText?: string;
}

export type LiveSyncPayload =
  | DomInputPayload
  | DomMousePayload
  | DomKeyboardPayload
  | DomScrollPayload
  | DomMousemovePayload
  | DomContentEditablePayload
  | DomDragPayload;

export interface LiveSyncEvent {
  schemaVersion: 1;
  sessionId: string;
  eventId: string;
  sequence: number;
  generation: number;
  createdAt: number;
  sourceTabId: number;
  type: LiveSyncEventType;
  frame: FrameDescriptor;
  target: ElementDescriptor | null;
  payload: LiveSyncPayload;
}

export interface ReplayAck {
  eventId: string;
  sequence: number;
  generation: number;
  tabId?: number;
  success: boolean;
  resolvedBy?: SelectorStrategy;
  durationMs: number;
  errorCode?: string;
  errorMessage?: string;
}
