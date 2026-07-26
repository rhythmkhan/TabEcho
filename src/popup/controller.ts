import {
  ActiveSession,
  ExtensionMessage,
  ExtensionMessageTypeEnum,
} from '@/shared/types';

export class PopupController {
  private currentSession: ActiveSession | null = null;

  async init(): Promise<void> {
    this.bindEvents();
    await this.refreshSession();
  }

  private bindEvents(): void {
    document.getElementById('btnOpenControlCenter')?.addEventListener('click', () => {
      void chrome.tabs.create({
        url: chrome.runtime.getURL('src/manager/index.html'),
      });
    });

    document.getElementById('btnPauseResume')?.addEventListener('click', () => {
      if (this.currentSession?.isPaused) {
        void this.sendAction(ExtensionMessageTypeEnum.ResumeSession);
      } else {
        void this.sendAction(ExtensionMessageTypeEnum.PauseSession);
      }
    });

    document.getElementById('btnEmergencyStop')?.addEventListener('click', () => {
      void this.sendAction(ExtensionMessageTypeEnum.EmergencyStop);
    });
  }

  private async refreshSession(): Promise<void> {
    const response = (await chrome.runtime.sendMessage({
      type: ExtensionMessageTypeEnum.GetSession,
    })) as unknown as ExtensionMessage | undefined;
    if (response?.type === ExtensionMessageTypeEnum.SessionStatus) {
      this.updateState(response.payload);
    }
  }

  private updateState(session: ActiveSession | null): void {
    this.currentSession = session;

    const badgeEl = document.getElementById('statusBadge');
    const summaryText = document.getElementById('summaryText');
    const btnPauseResume = document.getElementById('btnPauseResume') as HTMLButtonElement | null;
    const btnEmergencyStop = document.getElementById('btnEmergencyStop') as HTMLButtonElement | null;

    if (!session) {
      if (badgeEl) {
        badgeEl.className = 'status-badge status-idle';
        badgeEl.textContent = 'IDLE';
      }
      if (summaryText) summaryText.textContent = 'No active live session';
      if (btnPauseResume) btnPauseResume.disabled = true;
      if (btnEmergencyStop) btnEmergencyStop.disabled = true;
      return;
    }

    if (badgeEl) {
      badgeEl.className = `status-badge status-${session.status}`;
      badgeEl.textContent = session.status.toUpperCase();
    }

    if (summaryText) {
      summaryText.textContent = `1 Source → ${session.targetTabIds.length.toString()} Targets (${session.isPaused ? 'Paused' : 'Live'})`;
    }

    if (btnPauseResume) {
      btnPauseResume.disabled = false;
      btnPauseResume.textContent = session.isPaused ? '▶ Resume' : '⏸ Pause';
    }

    if (btnEmergencyStop) {
      btnEmergencyStop.disabled = false;
    }
  }

  private async sendAction(type: ExtensionMessage['type']): Promise<void> {
    const response = (await chrome.runtime.sendMessage({ type })) as unknown as ExtensionMessage | undefined;
    if (response?.type === ExtensionMessageTypeEnum.SessionStatus) {
      this.updateState(response.payload);
    }
  }
}
