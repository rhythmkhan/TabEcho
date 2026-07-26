import { APP_NAME } from '@/shared/consts';
import { SessionRole, SessionRoleEnum } from '@/shared/types';

const ROLE_CONFIG: Record<
  string,
  { label: string; bg: string }
> = {
  [SessionRoleEnum.Source]: { label: 'SOURCE', bg: '#6366f1cc' },
  [SessionRoleEnum.Target]: { label: 'TARGET', bg: '#14b8a6cc' },
};

export class RoleBadge {
  private element: HTMLElement | null = null;

  setRole(role: SessionRole): void {
    this.update(role);
  }

  update(role: SessionRole): void {
    if (role === SessionRoleEnum.Idle) {
      this.element?.remove();
      this.element = null;
      return;
    }

    if (!this.element) {
      this.element = document.createElement('div');
      this.element.id = `${APP_NAME.toLowerCase()}-badge`;
      Object.assign(this.element.style, {
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: '2147483647',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '11px',
        fontWeight: '700',
        padding: '4px 10px',
        borderRadius: '6px',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 12px rgba(0,0,0,.3)',
        pointerEvents: 'none',
        letterSpacing: '.5px',
        transition: 'background .3s',
      });
      document.documentElement.appendChild(this.element);
    }

    const config = ROLE_CONFIG[role];
    this.element.textContent = `${APP_NAME} · ${config.label}`;
    this.element.style.background = config.bg;
  }
}
