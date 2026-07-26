import { APP_NAME } from '@/shared/consts';
import { logger } from '@/shared/util';

const CURSOR_SVGS: Record<string, string> = {
  pointer: `
    <svg width="18" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 11.5V4.5C9 3.67 9.67 3 10.5 3C11.33 3 12 3.67 12 4.5V11.5M12 7.5C12 6.67 12.67 6 13.5 6C14.33 6 15 6.67 15 7.5V11.5M15 9.5C15 8.67 15.67 8 16.5 8C17.33 8 18 8.67 18 9.5V15.5C18 19.09 15.09 22 11.5 22C7.91 22 5 19.09 5 15.5V12.5C5 11.67 5.67 11 6.5 11C7.33 11 8 11.67 8 12.5V11.5" stroke="#ffffff" stroke-width="1.5" fill="#14b8a6"/>
    </svg>
  `.trim(),

  text: `
    <svg width="14" height="20" viewBox="0 0 16 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 2H12M8 2V20M4 20H12" stroke="#14b8a6" stroke-width="3" stroke-linecap="round"/>
      <path d="M4 2H12M8 2V20M4 20H12" stroke="#ffffff" stroke-width="1" stroke-linecap="round"/>
    </svg>
  `.trim(),

  crosshair: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" stroke="#14b8a6" stroke-width="2"/>
      <line x1="12" y1="0" x2="12" y2="24" stroke="#14b8a6" stroke-width="2"/>
      <line x1="0" y1="12" x2="24" y2="12" stroke="#14b8a6" stroke-width="2"/>
    </svg>
  `.trim(),

  move: `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15 6H9L12 2ZM12 22L15 18H9L12 22ZM2 12L6 9V15L2 12ZM22 12L18 9V15L22 12ZM12 6V18M6 12H18" stroke="#ffffff" stroke-width="1.5" fill="#14b8a6"/>
    </svg>
  `.trim(),

  'not-allowed': `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="#ef4444" stroke-width="2.5" fill="#ef4444" fill-opacity="0.2"/>
      <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke="#ef4444" stroke-width="2.5"/>
    </svg>
  `.trim(),

  grab: `
    <svg width="20" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 11V5A1.5 1.5 0 0 1 11 5V11M11 7.5A1.5 1.5 0 0 1 14 7.5V11M14 8.5A1.5 1.5 0 0 1 17 8.5V11M6 13V15.5C6 18.5 8.5 21 11.5 21S17 18.5 17 15.5V12" stroke="#ffffff" stroke-width="1.5" fill="#14b8a6"/>
    </svg>
  `.trim(),

  grabbing: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 13V15.5C6 18.5 8.5 21 11.5 21S17 18.5 17 15.5V13" stroke="#ffffff" stroke-width="1.5" fill="#0d9488"/>
    </svg>
  `.trim(),

  wait: `
    <svg width="18" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 2H18L12 11L18 20H6L12 11L6 2Z" stroke="#ffffff" stroke-width="1.5" fill="#f59e0b"/>
    </svg>
  `.trim(),

  help: `
    <svg width="22" height="24" viewBox="0 0 24 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.5 2L3.5 21.5L8 17L11.5 24.5L14.5 23L11 15.5L17.5 15.5L3.5 2Z" fill="#14b8a6" stroke="#ffffff" stroke-width="1.5"/>
      <text x="14" y="20" fill="#fbbf24" font-size="14" font-weight="900" font-family="sans-serif">?</text>
    </svg>
  `.trim(),

  'col-resize': `
    <svg width="22" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 12L8 8V16L4 12ZM20 12L16 8V16L20 12ZM8 12H16" stroke="#ffffff" stroke-width="1.5" fill="#14b8a6"/>
    </svg>
  `.trim(),

  'row-resize': `
    <svg width="18" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4L8 8H16L12 4ZM12 20L8 16H16L12 20ZM12 8V16" stroke="#ffffff" stroke-width="1.5" fill="#14b8a6"/>
    </svg>
  `.trim(),

  default: `
    <svg width="18" height="21" viewBox="0 0 22 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.5 2L3.5 21.5L8 17L11.5 24.5L14.5 23L11 15.5L17.5 15.5L3.5 2Z" fill="#14b8a6" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    </svg>
  `.trim(),
};

export class VirtualCursor {
  private host: HTMLDivElement | null = null;
  private cursorEl: HTMLElement | null = null;
  private rippleEl: HTMLElement | null = null;
  private currentCursorStyle = 'default';

  moveTo(x: number, y: number): void {
    if (!this.cursorEl) return;
    this.cursorEl.style.transform = `translate(${String(Math.round(x))}px, ${String(Math.round(y))}px)`;
  }

  setCursorStyle(style: string): void {
    if (!this.cursorEl || !style) return;
    const normalized = style.toLowerCase();
    if (this.currentCursorStyle === normalized) return;

    this.currentCursorStyle = normalized;
    const key = this.resolveCursorKey(normalized);
    const svgHtml = CURSOR_SVGS[key] || CURSOR_SVGS.default;
    this.cursorEl.innerHTML = svgHtml;
  }

  animateClick(x: number, y: number): void {
    this.moveTo(x, y);
    if (!this.rippleEl) return;

    const r = this.rippleEl;
    r.style.setProperty('--rx', `${String(Math.round(x - 16))}px`);
    r.style.setProperty('--ry', `${String(Math.round(y - 16))}px`);
    r.classList.remove('active');
    void r.offsetWidth;
    r.classList.add('active');
  }

  show(): void {
    if (!this.host) {
      this.mount();
    }

    if (this.host) {
      this.host.style.display = 'block';
      return;
    }

    logger.error('Virtual cursor host not found');
  }

  hide(): void {
    if (!this.host) return;
    this.host.style.display = 'none';
  }

  private resolveCursorKey(style: string): string {
    if (style.includes('pointer')) return 'pointer';
    if (style.includes('text')) return 'text';
    if (style.includes('crosshair')) return 'crosshair';
    if (style.includes('move') || style.includes('all-scroll')) return 'move';
    if (style.includes('not-allowed') || style.includes('no-drop')) return 'not-allowed';
    if (style.includes('grabbing')) return 'grabbing';
    if (style.includes('grab')) return 'grab';
    if (style.includes('wait') || style.includes('progress')) return 'wait';
    if (style.includes('help')) return 'help';
    if (
      style.includes('col-resize') ||
      style.includes('ew-resize') ||
      style.includes('e-resize') ||
      style.includes('w-resize')
    ) {
      return 'col-resize';
    }
    if (
      style.includes('row-resize') ||
      style.includes('ns-resize') ||
      style.includes('n-resize') ||
      style.includes('s-resize')
    ) {
      return 'row-resize';
    }
    return 'default';
  }

  private mount(): void {
    const host = document.createElement('div');
    host.id = `${APP_NAME.toLowerCase()}-cursor-host`;
    Object.assign(host.style, {
      all: 'initial',
      position: 'fixed',
      top: '0',
      left: '0',
      width: '0',
      height: '0',
      pointerEvents: 'none',
      zIndex: '2147483647',
      overflow: 'visible',
    });

    const shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      .tabecho-cursor {
        position: fixed;
        top: 0;
        left: 0;
        width: 24px;
        height: 24px;
        pointer-events: none;
        transform: translate(0, 0);
        transition: transform 40ms linear;
        will-change: transform;
        filter:
          drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4))
          drop-shadow(0 0px 4px rgba(20, 184, 166, 0.4));
      }

      .tabecho-ripple {
        position: fixed;
        top: 0;
        left: 0;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid rgba(20, 184, 166, 0.8);
        box-shadow: 0 0 8px 2px rgba(20, 184, 166, 0.4);
        background: rgba(20, 184, 166, 0.12);
        pointer-events: none;
        opacity: 0;
        transform: translate(0, 0) scale(0);
      }

      .tabecho-ripple.active {
        animation: tabecho-ripple-anim 480ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }

      @keyframes tabecho-ripple-anim {
        0%   { transform: translate(var(--rx), var(--ry)) scale(0.15); opacity: 1; }
        60%  { opacity: 0.7; }
        100% { transform: translate(var(--rx), var(--ry)) scale(1.9);  opacity: 0; }
      }
    `;

    const cursorEl = document.createElement('div');
    cursorEl.className = 'tabecho-cursor';
    cursorEl.innerHTML = CURSOR_SVGS.default;

    const rippleEl = document.createElement('div');
    rippleEl.className = 'tabecho-ripple';
    rippleEl.addEventListener('animationend', () => {
      rippleEl.classList.remove('active');
    });

    shadow.appendChild(style);
    shadow.appendChild(cursorEl);
    shadow.appendChild(rippleEl);

    document.documentElement.appendChild(host);

    this.host = host;
    this.cursorEl = cursorEl;
    this.rippleEl = rippleEl;
  }
}
