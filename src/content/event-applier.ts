import {
  DomContentEditablePayload,
  DomInputPayload,
  DomKeyboardPayload,
  DomMousemovePayload,
  DomMousePayload,
  DomScrollPayload,
  ExtensionMessage,
  ExtensionMessageTypeEnum,
  LiveSyncEvent,
  LiveSyncEventTypeEnum,
  ReplayAck,
  SelectorStrategy,
  SessionRole,
  SessionRoleEnum,
} from '@/shared/types';
import { resolveElement } from './element-resolver';
import { VirtualCursor } from './virtual-cursor';

let isReplaying = false;

export function getIsReplaying(): boolean {
  return isReplaying;
}

export class EventApplier {
  private currentGeneration = 0;
  private role: SessionRole = SessionRoleEnum.Idle;

  constructor(private readonly cursor: VirtualCursor) {}

  setRole(role: SessionRole, generation: number): void {
    this.role = role;
    this.currentGeneration = generation;
  }

  async applyEvent(event: LiveSyncEvent): Promise<void> {
    if (this.role !== SessionRoleEnum.Target) return;

    if (event.generation !== this.currentGeneration) {
      return;
    }

    const startTime = Date.now();
    isReplaying = true;

    try {
      const { type, payload, target } = event;

      if (type === LiveSyncEventTypeEnum.Scroll) {
        const scrollPayload = payload as DomScrollPayload;
        if (scrollPayload.isWindow || !target) {
          window.scrollTo({
            left: scrollPayload.scrollX,
            top: scrollPayload.scrollY,
            behavior: 'auto',
          });
          this.sendAck(event, true, startTime);
          return;
        }
      }

      if (type === LiveSyncEventTypeEnum.Mousemove) {
        const mousePayload = payload as DomMousemovePayload;
        this.cursor.moveTo(
          mousePayload.xRatio * window.innerWidth,
          mousePayload.yRatio * window.innerHeight,
        );
        if (mousePayload.cursorStyle) {
          this.cursor.setCursorStyle(mousePayload.cursorStyle);
        }
        this.sendAck(event, true, startTime);
        return;
      }

      const mousePayload = (type === LiveSyncEventTypeEnum.Click ||
        type === LiveSyncEventTypeEnum.Mousedown ||
        type === LiveSyncEventTypeEnum.Mouseup ||
        type === LiveSyncEventTypeEnum.Dblclick)
        ? (payload as DomMousePayload)
        : null;

      const resolveResult = await resolveElement(
        target,
        mousePayload?.clientXRatio,
        mousePayload?.clientYRatio,
      );

      if (!resolveResult) {
        this.sendAck(
          event,
          false,
          startTime,
          undefined,
          'ELEMENT_NOT_FOUND',
          'Could not resolve element on target tab',
        );
        return;
      }

      const element = resolveResult.element as HTMLElement;

      switch (type) {
        case LiveSyncEventTypeEnum.Mousedown:
        case LiveSyncEventTypeEnum.Mouseup: {
          const mp = payload as DomMousePayload;
          const rect = element.getBoundingClientRect();
          const x = mp.clientXRatio !== undefined
            ? mp.clientXRatio * window.innerWidth
            : rect.left + (mp.offsetXRatio || 0.5) * rect.width;
          const y = mp.clientYRatio !== undefined
            ? mp.clientYRatio * window.innerHeight
            : rect.top + (mp.offsetYRatio || 0.5) * rect.height;

          const pointerType = type === LiveSyncEventTypeEnum.Mousedown ? 'pointerdown' : 'pointerup';

          if (typeof PointerEvent === 'function') {
            element.dispatchEvent(
              new PointerEvent(pointerType, {
                bubbles: true,
                cancelable: true,
                clientX: x,
                clientY: y,
                button: mp.button || 0,
                ctrlKey: mp.ctrlKey || false,
                shiftKey: mp.shiftKey || false,
                altKey: mp.altKey || false,
                metaKey: mp.metaKey || false,
                pointerId: 1,
                pointerType: 'mouse',
                isPrimary: true,
              }),
            );
          }

          element.dispatchEvent(
            new MouseEvent(type, {
              bubbles: true,
              cancelable: true,
              clientX: x,
              clientY: y,
              button: mp.button || 0,
              ctrlKey: mp.ctrlKey || false,
              shiftKey: mp.shiftKey || false,
              altKey: mp.altKey || false,
              metaKey: mp.metaKey || false,
            }),
          );

          this.sendAck(event, true, startTime, resolveResult.strategy);
          break;
        }

        case LiveSyncEventTypeEnum.Click:
        case LiveSyncEventTypeEnum.Dblclick: {
          const mp = payload as DomMousePayload;
          const rect = element.getBoundingClientRect();
          const clickX = mp.clientXRatio !== undefined
            ? mp.clientXRatio * window.innerWidth
            : rect.left + (mp.offsetXRatio || 0.5) * rect.width;
          const clickY = mp.clientYRatio !== undefined
            ? mp.clientYRatio * window.innerHeight
            : rect.top + (mp.offsetYRatio || 0.5) * rect.height;

          this.cursor.animateClick(clickX, clickY);

          if (typeof element.focus === 'function') {
            try {
              element.focus();
            } catch {
              // safe fallback
            }
          }

          const eventInit = {
            bubbles: true,
            cancelable: true,
            clientX: clickX,
            clientY: clickY,
            button: mp.button || 0,
            ctrlKey: mp.ctrlKey || false,
            shiftKey: mp.shiftKey || false,
            altKey: mp.altKey || false,
            metaKey: mp.metaKey || false,
          };

          if (typeof PointerEvent === 'function') {
            element.dispatchEvent(new PointerEvent('pointerdown', { ...eventInit, pointerId: 1, pointerType: 'mouse', isPrimary: true }));
          }
          element.dispatchEvent(new MouseEvent('mousedown', eventInit));

          if (typeof PointerEvent === 'function') {
            element.dispatchEvent(new PointerEvent('pointerup', { ...eventInit, pointerId: 1, pointerType: 'mouse', isPrimary: true }));
          }
          element.dispatchEvent(new MouseEvent('mouseup', eventInit));

          element.dispatchEvent(new MouseEvent(type, eventInit));

          const clickable = element.closest('a, button, input, [role="button"], [role="menuitem"], [role="option"], [onclick], [tabindex]') || element;
          if ('click' in clickable && typeof (clickable as HTMLElement).click === 'function') {
            try {
              (clickable as HTMLElement).click();
            } catch {
              // safe fallback
            }
          }

          this.sendAck(event, true, startTime, resolveResult.strategy);
          break;
        }

        case LiveSyncEventTypeEnum.Input:
        case LiveSyncEventTypeEnum.Change: {
          const inputPayload = payload as DomInputPayload;

          if (element instanceof HTMLInputElement) {
            if (element.type === 'checkbox' || element.type === 'radio') {
              element.checked = Boolean(inputPayload.checked);
            } else {
              const val = inputPayload.value || '';
              const setter = Object.getOwnPropertyDescriptor(
                Object.getPrototypeOf(element),
                'value',
              )?.set;

              if (setter) {
                setter.call(element, val);
              } else {
                element.value = val;
              }
            }
          } else if (element instanceof HTMLTextAreaElement) {
            const val = inputPayload.value || '';
            const setter = Object.getOwnPropertyDescriptor(
              Object.getPrototypeOf(element),
              'value',
            )?.set;

            if (setter) {
              setter.call(element, val);
            } else {
              element.value = val;
            }
          } else if (element instanceof HTMLSelectElement) {
            if (inputPayload.selectedOptions) {
              Array.from(element.options).forEach((opt) => {
                opt.selected = inputPayload.selectedOptions?.includes(opt.value) || false;
              });
            } else {
              element.value = inputPayload.value || '';
            }
          }

          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));

          this.sendAck(event, true, startTime, resolveResult.strategy);
          break;
        }

        case LiveSyncEventTypeEnum.SubmitIntent: {
          const form = element instanceof HTMLFormElement ? element : element.closest('form');
          if (form) {
            if (typeof form.requestSubmit === 'function') {
              try {
                form.requestSubmit();
              } catch {
                form.submit();
              }
            } else {
              form.submit();
            }
          }
          this.sendAck(event, true, startTime, resolveResult.strategy);
          break;
        }

        case LiveSyncEventTypeEnum.Contenteditable: {
          const cePayload = payload as DomContentEditablePayload;
          element.innerText = cePayload.text || '';
          element.dispatchEvent(new Event('input', { bubbles: true }));
          this.sendAck(event, true, startTime, resolveResult.strategy);
          break;
        }

        case LiveSyncEventTypeEnum.Keydown:
        case LiveSyncEventTypeEnum.Keyup: {
          const kbPayload = payload as DomKeyboardPayload;
          const isEnter = kbPayload.key === 'Enter';

          const kbEventInit: KeyboardEventInit = {
            bubbles: true,
            cancelable: true,
            key: kbPayload.key,
            code: kbPayload.code,
            ctrlKey: kbPayload.ctrlKey,
            shiftKey: kbPayload.shiftKey,
            altKey: kbPayload.altKey,
            metaKey: kbPayload.metaKey,
            repeat: kbPayload.repeat,
          };

          const kbEvent = new KeyboardEvent(type, kbEventInit);
          if (isEnter) {
            Object.defineProperty(kbEvent, 'keyCode', { value: 13 });
            Object.defineProperty(kbEvent, 'which', { value: 13 });
          }

          const defaultNotPrevented = element.dispatchEvent(kbEvent);

          if (type === LiveSyncEventTypeEnum.Keydown && isEnter && defaultNotPrevented) {
            if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement) {
              const form = element.form || element.closest('form');
              if (form) {
                if (typeof form.requestSubmit === 'function') {
                  try {
                    form.requestSubmit();
                  } catch {
                    form.submit();
                  }
                } else {
                  form.submit();
                }
              }
            } else if (element instanceof HTMLTextAreaElement) {
              const val = element.value;
              const start = element.selectionStart;
              const end = element.selectionEnd;
              element.value = val.substring(0, start) + '\n' + val.substring(end);
              element.selectionStart = element.selectionEnd = start + 1;
              element.dispatchEvent(new Event('input', { bubbles: true }));
              element.dispatchEvent(new Event('change', { bubbles: true }));
            } else if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
              element.click();
            }
          }

          this.sendAck(event, true, startTime, resolveResult.strategy);
          break;
        }

        case LiveSyncEventTypeEnum.Focus: {
          element.focus();
          this.sendAck(event, true, startTime, resolveResult.strategy);
          break;
        }

        case LiveSyncEventTypeEnum.Blur: {
          element.blur();
          this.sendAck(event, true, startTime, resolveResult.strategy);
          break;
        }

        default: {
          this.sendAck(event, true, startTime, resolveResult.strategy);
          break;
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.sendAck(
        event,
        false,
        startTime,
        undefined,
        'REPLAY_ERROR',
        errorMsg,
      );
    } finally {
      queueMicrotask(() => {
        isReplaying = false;
      });
    }
  }

  private sendAck(
    event: LiveSyncEvent,
    success: boolean,
    startTime: number,
    resolvedBy?: SelectorStrategy,
    errorCode?: string,
    errorMessage?: string,
  ): void {
    const ack: ReplayAck = {
      eventId: event.eventId,
      sequence: event.sequence,
      generation: event.generation,
      success,
      resolvedBy,
      durationMs: Date.now() - startTime,
      errorCode,
      errorMessage,
    };

    const msg: ExtensionMessage = {
      type: ExtensionMessageTypeEnum.ReplayAck,
      payload: ack,
    };

    chrome.runtime.sendMessage(msg).catch(() => {
      // safe drop
    });
  }
}
