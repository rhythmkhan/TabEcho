import {
  DomInputPayload,
  DomKeyboardPayload,
  DomMousemovePayload,
  DomMousePayload,
  DomScrollPayload,
  ExtensionMessage,
  ExtensionMessageTypeEnum,
  LiveSyncEvent,
  SessionRole,
  SessionRoleEnum,
} from '@/shared/types';
import { isElementSensitive } from '@/shared/validation/sensitive-detector';
import { getIsReplaying } from './event-applier';
import { buildElementDescriptor } from './selector-builder';

export class EventCapture {
  private role: SessionRole = SessionRoleEnum.Idle;
  private currentGeneration = 0;
  private isPaused = false;
  private rafPending = false;
  private lastMouseXRatio = 0;
  private lastMouseYRatio = 0;

  constructor() {
    this.registerHotkeyListeners();
    this.registerEventListeners();
  }

  setRole(role: SessionRole, generation: number, isPaused: boolean): void {
    this.role = role;
    this.currentGeneration = generation;
    this.isPaused = isPaused;
  }

  private active(): boolean {
    return (
      this.role === SessionRoleEnum.Source &&
      !this.isPaused &&
      !getIsReplaying()
    );
  }

  private registerHotkeyListeners(): void {
    window.addEventListener(
      'keydown',
      (e: KeyboardEvent) => {
        if (this.role !== SessionRoleEnum.Source) return;

        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          this.requestHotkeyAction('PAUSE', 'escape-hotkey');
          return;
        }

        if (e.key === 'F8') {
          e.preventDefault();
          this.requestHotkeyAction('RESUME', 'f8-hotkey');
          return;
        }

        if (e.key === 'F9') {
          e.preventDefault();
          this.requestHotkeyAction('TOGGLE_PAUSE', 'f9-hotkey');
          return;
        }

        if (e.key === 'F10') {
          e.preventDefault();
          this.requestHotkeyAction('STOP', 'f10-hotkey');
          return;
        }

        if (e.key === 'F12' && e.ctrlKey && e.shiftKey) {
          e.preventDefault();
          this.requestHotkeyAction('EMERGENCY_STOP', 'f12-hotkey');
        }
      },
      true,
    );
  }

  private requestHotkeyAction(
    action: 'PAUSE' | 'RESUME' | 'TOGGLE_PAUSE' | 'STOP' | 'EMERGENCY_STOP',
    reason: string,
  ): void {
    const msg: ExtensionMessage = {
      type: ExtensionMessageTypeEnum.RequestHotkeyAction,
      action,
      reason,
    };
    chrome.runtime.sendMessage(msg).catch(() => {
      // safe drop
    });
  }

  private sendEvent(
    type: LiveSyncEvent['type'],
    targetEl: Element | null,
    payload: LiveSyncEvent['payload'],
  ): void {
    if (!this.active()) return;

    const targetDescriptor = targetEl ? buildElementDescriptor(targetEl) : null;

    const event: LiveSyncEvent = {
      schemaVersion: 1,
      sessionId: '',
      eventId: crypto.randomUUID(),
      sequence: 0,
      generation: this.currentGeneration,
      createdAt: Date.now(),
      sourceTabId: 0,
      type,
      frame: { isTop: window.self === window.top, path: [] },
      target: targetDescriptor,
      payload,
    };

    const msg: ExtensionMessage = {
      type: ExtensionMessageTypeEnum.LiveSyncEvent,
      payload: event,
    };

    chrome.runtime.sendMessage(msg).catch(() => {
      // safe drop
    });
  }

  private registerEventListeners(): void {
    const buildMousePayload = (e: MouseEvent, target: Element): DomMousePayload => {
      const rect = target.getBoundingClientRect();
      return {
        button: e.button,
        buttons: e.buttons,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
        offsetXRatio: rect.width > 0 ? (e.clientX - rect.left) / rect.width : 0.5,
        offsetYRatio: rect.height > 0 ? (e.clientY - rect.top) / rect.height : 0.5,
        clientXRatio: window.innerWidth > 0 ? e.clientX / window.innerWidth : 0,
        clientYRatio: window.innerHeight > 0 ? e.clientY / window.innerHeight : 0,
      };
    };

    document.addEventListener(
      'click',
      (e: MouseEvent) => {
        if (!this.active()) return;
        const target = e.target as Element | null;
        if (!target) return;
        this.sendEvent('click', target, buildMousePayload(e, target));
      },
      true,
    );

    document.addEventListener(
      'auxclick',
      (e: MouseEvent) => {
        if (!this.active()) return;
        const target = e.target as Element | null;
        if (!target) return;
        this.sendEvent('auxclick', target, buildMousePayload(e, target));
      },
      true,
    );

    document.addEventListener(
      'contextmenu',
      (e: MouseEvent) => {
        if (!this.active()) return;
        const target = e.target as Element | null;
        if (!target) return;
        this.sendEvent('contextmenu', target, buildMousePayload(e, target));
      },
      true,
    );

    document.addEventListener(
      'mousedown',
      (e: MouseEvent) => {
        if (!this.active()) return;
        const target = e.target as Element | null;
        if (!target) return;
        this.sendEvent('mousedown', target, buildMousePayload(e, target));
      },
      true,
    );

    document.addEventListener(
      'mouseup',
      (e: MouseEvent) => {
        if (!this.active()) return;
        const target = e.target as Element | null;
        if (!target) return;
        this.sendEvent('mouseup', target, buildMousePayload(e, target));
      },
      true,
    );

    document.addEventListener(
      'pointerdown',
      (e: PointerEvent) => {
        if (!this.active()) return;
        if (e.button >= 3) {
          const target = e.target as Element | null;
          if (!target) return;
          this.sendEvent('mousedown', target, buildMousePayload(e, target));
        }
      },
      true,
    );

    document.addEventListener(
      'pointerup',
      (e: PointerEvent) => {
        if (!this.active()) return;
        if (e.button >= 3) {
          const target = e.target as Element | null;
          if (!target) return;
          this.sendEvent('mouseup', target, buildMousePayload(e, target));
          this.sendEvent('auxclick', target, buildMousePayload(e, target));
        }
      },
      true,
    );

    document.addEventListener(
      'dblclick',
      (e: MouseEvent) => {
        if (!this.active()) return;
        const target = e.target as Element | null;
        if (!target) return;
        this.sendEvent('dblclick', target, buildMousePayload(e, target));
      },
      true,
    );

    document.addEventListener(
      'input',
      (e: Event) => {
        if (!this.active()) return;
        const target = e.target as HTMLInputElement | HTMLTextAreaElement | null;
        if (!target) return;

        const sensitive = isElementSensitive(target);
        const payload: DomInputPayload = {
          value: sensitive ? '[REDACTED_SENSITIVE_DATA]' : target.value,
          checked: (target as HTMLInputElement).checked,
          isSensitive: sensitive,
        };

        this.sendEvent('input', target, payload);
      },
      true,
    );

    document.addEventListener(
      'change',
      (e: Event) => {
        if (!this.active()) return;
        const target = e.target as HTMLInputElement | HTMLSelectElement | null;
        if (!target) return;

        const sensitive = isElementSensitive(target);
        let selectedOptions: string[] | undefined;
        if (target instanceof HTMLSelectElement) {
          selectedOptions = Array.from(target.selectedOptions).map((o) => o.value);
        }

        const payload: DomInputPayload = {
          value: sensitive ? '[REDACTED_SENSITIVE_DATA]' : (target as HTMLInputElement).value,
          checked: (target as HTMLInputElement).checked,
          selectedOptions,
          isSensitive: sensitive,
        };

        this.sendEvent('change', target, payload);
      },
      true,
    );

    document.addEventListener(
      'submit',
      (e: Event) => {
        if (!this.active()) return;
        const target = e.target as Element | null;
        if (!target) return;
        this.sendEvent('submit-intent', target, { value: '' });
      },
      true,
    );

    document.addEventListener(
      'keydown',
      (e: KeyboardEvent) => {
        if (!this.active()) return;
        if (['Escape', 'F8', 'F9', 'F10', 'F12'].includes(e.key)) return;

        const target = e.target as Element | null;
        const payload: DomKeyboardPayload = {
          key: e.key,
          code: e.code,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
          metaKey: e.metaKey,
          repeat: e.repeat,
        };

        this.sendEvent('keydown', target, payload);
      },
      true,
    );

    document.addEventListener(
      'keyup',
      (e: KeyboardEvent) => {
        if (!this.active()) return;
        if (['Escape', 'F8', 'F9', 'F10', 'F12'].includes(e.key)) return;

        const target = e.target as Element | null;
        const payload: DomKeyboardPayload = {
          key: e.key,
          code: e.code,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
          metaKey: e.metaKey,
        };

        this.sendEvent('keyup', target, payload);
      },
      true,
    );

    document.addEventListener(
      'scroll',
      (e: Event) => {
        if (!this.active()) return;
        const target = e.target as Element | Document | null;
        const isWindow =
          !target ||
          target === document ||
          (target instanceof Element &&
            (target === document.documentElement || target === document.body));

        const payload: DomScrollPayload = {
          scrollX: isWindow ? window.scrollX : (target as Element).scrollLeft,
          scrollY: isWindow ? window.scrollY : (target as Element).scrollTop,
          isWindow,
        };

        this.sendEvent('scroll', isWindow ? null : (target as Element), payload);
      },
      { capture: true, passive: true },
    );

    document.addEventListener(
      'mousemove',
      (e: MouseEvent) => {
        if (!this.active()) return;
        this.lastMouseXRatio = e.clientX / window.innerWidth;
        this.lastMouseYRatio = e.clientY / window.innerHeight;

        if (this.rafPending) return;
        this.rafPending = true;

        requestAnimationFrame(() => {
          this.rafPending = false;
          if (!this.active()) return;

          let cursorStyle = 'default';
          const target = document.elementFromPoint(e.clientX, e.clientY) || (e.target as Element | null);
          if (target instanceof Element) {
            try {
              cursorStyle = window.getComputedStyle(target).cursor || 'default';
            } catch {
              // safe fallback
            }
          }

          const payload: DomMousemovePayload = {
            xRatio: this.lastMouseXRatio,
            yRatio: this.lastMouseYRatio,
            cursorStyle,
          };
          this.sendEvent('mousemove', null, payload);
        });
      },
      true,
    );
  }
}
