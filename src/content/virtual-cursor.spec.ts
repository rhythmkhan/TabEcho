/**
 * @jest-environment jsdom
 */

import { APP_NAME } from '@/shared/consts';
import { VirtualCursor } from './virtual-cursor';

describe('VirtualCursor', () => {
  let cursor: VirtualCursor;

  const getHost = () =>
    document.getElementById(`${APP_NAME.toLowerCase()}-cursor-host`) as HTMLDivElement | null;

  beforeEach(() => {
    document.documentElement.innerHTML = '<head></head><body></body>';
    cursor = new VirtualCursor();
  });

  describe('show', () => {
    it('mounts host with a shadow root on first call', () => {
      expect(getHost()).toBeNull();

      cursor.show();

      const host = getHost();
      expect(host).not.toBeNull();
      expect(host?.style.display).toBe('block');
      expect(host?.shadowRoot).not.toBeNull();
      expect(host?.shadowRoot?.querySelector('.tabecho-cursor')).not.toBeNull();
      expect(host?.shadowRoot?.querySelector('.tabecho-ripple')).not.toBeNull();
    });

    it('reuses existing host on subsequent calls', () => {
      cursor.show();
      const first = getHost();
      cursor.hide();

      cursor.show();
      const second = getHost();

      expect(second).toBe(first);
      expect(second?.style.display).toBe('block');
    });
  });

  describe('hide', () => {
    it('sets host display to none after mount', () => {
      cursor.show();
      cursor.hide();

      expect(getHost()?.style.display).toBe('none');
    });
  });

  describe('moveTo', () => {
    it('applies a translate transform using rounded coordinates', () => {
      cursor.show();
      cursor.moveTo(12.3, 45.7);

      const cursorEl = getHost()?.shadowRoot?.querySelector(
        '.tabecho-cursor',
      ) as HTMLElement;
      expect(cursorEl.style.transform).toBe('translate(12px, 46px)');
    });
  });

  describe('setCursorStyle', () => {
    it('updates visual cursor SVG for pointer, text, move, and not-allowed styles', () => {
      cursor.show();
      const cursorEl = getHost()?.shadowRoot?.querySelector(
        '.tabecho-cursor',
      ) as HTMLElement;

      cursor.setCursorStyle('pointer');
      expect(cursorEl.innerHTML).toContain('<svg');

      cursor.setCursorStyle('text');
      expect(cursorEl.innerHTML).toContain('<path');

      cursor.setCursorStyle('move');
      expect(cursorEl.innerHTML).toContain('<svg');

      cursor.setCursorStyle('not-allowed');
      expect(cursorEl.innerHTML).toContain('stroke="#ef4444"');
    });
  });
});
