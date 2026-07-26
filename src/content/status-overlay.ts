import { SessionRole } from '@/shared/types';

export class StatusOverlay {
  private host: HTMLDivElement | null = null;
  private shadow: ShadowRoot | null = null;
  private banner: HTMLDivElement | null = null;

  show(role: SessionRole, isPaused: boolean, resumeHotkey = 'F8'): void {
    this.ensureHost();
    if (!this.banner) return;

    if (isPaused) {
      const roleText = role.toUpperCase();
      this.banner.style.display = 'flex';
      this.banner.style.borderColor = '#f59e0b';
      this.banner.innerHTML = `
        <div style="font-weight: 700; color: #fbbf24; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase;">
          ${roleText} · PAUSED
        </div>
        <div style="color: #f3f4f6; font-size: 12px; margin-top: 2px;">
          TABECHO PAUSED — Press <strong>${resumeHotkey}</strong> to Resume
        </div>
      `;
    } else {
      this.banner.style.display = 'flex';
      this.banner.style.borderColor = '#10b981';
      this.banner.innerHTML = `
        <div style="font-weight: 700; color: #34d399; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase;">
          ${role.toUpperCase()} · LIVE
        </div>
        <div style="color: #e5e7eb; font-size: 12px; margin-top: 2px;">
          Synchronization active
        </div>
      `;
      setTimeout(() => {
        if (this.banner) {
          this.banner.style.display = 'none';
        }
      }, 2000);
    }
  }

  hide(): void {
    if (this.host?.parentNode) {
      this.host.parentNode.removeChild(this.host);
      this.host = null;
      this.shadow = null;
      this.banner = null;
    }
  }

  private ensureHost(): void {
    if (this.host) return;

    this.host = document.createElement('div');
    this.host.id = 'tabecho-status-overlay-root';
    this.host.style.position = 'fixed';
    this.host.style.top = '16px';
    this.host.style.right = '16px';
    this.host.style.zIndex = '2147483646';
    this.host.style.pointerEvents = 'none';

    this.shadow = this.host.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = `
      .tabecho-banner {
        display: none;
        flex-direction: column;
        background: rgba(17, 24, 39, 0.92);
        backdrop-filter: blur(8px);
        border: 1.5px solid #f59e0b;
        border-radius: 8px;
        padding: 10px 16px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #fff;
        pointer-events: none;
        transition: all 0.2s ease-in-out;
      }
    `;

    this.banner = document.createElement('div');
    this.banner.className = 'tabecho-banner';

    this.shadow.appendChild(style);
    this.shadow.appendChild(this.banner);
    document.documentElement.appendChild(this.host);
  }
}
