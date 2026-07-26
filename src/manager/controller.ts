/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import {
  ActiveSession,
  BrowserTabSummary,
  DEFAULT_PURE_SYNC_OPTIONS,
  ExistingTabsSessionConfig,
  ExtensionMessage,
  ExtensionMessageTypeEnum,
} from '@/shared/types';

export class ManagerController {
  private tabs: BrowserTabSummary[] = [];
  private selectedSourceId: number | null = null;
  private selectedTargetIds: Set<number> = new Set();

  async init(): Promise<void> {
    this.bindEvents();
    await this.refreshTabs();
    await this.refreshSession();
  }

  private bindEvents(): void {
    document.getElementById('btnRefreshTabs')?.addEventListener('click', () => {
      void this.refreshTabs();
    });

    document.getElementById('btnSelectActiveSource')?.addEventListener('click', () => {
      const activeTab = this.tabs.find((t) => t.active && t.supported);
      if (activeTab) {
        this.selectedSourceId = activeTab.id;
        this.renderTabs();
      }
    });

    document.getElementById('btnClearTargets')?.addEventListener('click', () => {
      this.selectedTargetIds.clear();
      this.renderTabs();
    });

    document.getElementById('btnStart')?.addEventListener('click', () => {
      void this.startSession();
    });

    document.getElementById('btnPause')?.addEventListener('click', () => {
      void this.sendAction(ExtensionMessageTypeEnum.PauseSession);
    });

    document.getElementById('btnResume')?.addEventListener('click', () => {
      void this.sendAction(ExtensionMessageTypeEnum.ResumeSession);
    });

    document.getElementById('btnStop')?.addEventListener('click', () => {
      void this.sendAction(ExtensionMessageTypeEnum.StopSession);
    });

    document.getElementById('btnEmergencyStop')?.addEventListener('click', () => {
      void this.sendAction(ExtensionMessageTypeEnum.EmergencyStop);
    });
  }

  private async refreshTabs(): Promise<void> {
    const response = (await chrome.runtime.sendMessage({
      type: ExtensionMessageTypeEnum.GetEligibleTabs,
    })) as unknown as ExtensionMessage | undefined;

    if (response?.type === ExtensionMessageTypeEnum.TabSummaryResponse) {
      this.tabs = response.payload;
      this.renderTabs();
    }
  }

  private async refreshSession(): Promise<void> {
    const response = (await chrome.runtime.sendMessage({
      type: ExtensionMessageTypeEnum.GetSession,
    })) as unknown as ExtensionMessage | undefined;

    if (response?.type === ExtensionMessageTypeEnum.SessionStatus) {
      this.updateSessionState(response.payload);
    }
  }

  private updateSessionState(session: ActiveSession | null): void {
    const badgeEl = document.getElementById('sessionStatusBadge');
    const summaryEl = document.getElementById('sessionSummary');
    const btnStart = document.getElementById('btnStart') as HTMLButtonElement | null;
    const btnPause = document.getElementById('btnPause') as HTMLButtonElement | null;
    const btnResume = document.getElementById('btnResume') as HTMLButtonElement | null;
    const btnStop = document.getElementById('btnStop') as HTMLButtonElement | null;

    if (!session) {
      if (badgeEl) {
        badgeEl.className = 'status-badge status-idle';
        badgeEl.textContent = 'IDLE';
      }
      if (summaryEl) summaryEl.textContent = 'No active session';
      if (btnStart) btnStart.disabled = false;
      if (btnPause) btnPause.disabled = true;
      if (btnResume) btnResume.disabled = true;
      if (btnStop) btnStop.disabled = true;
      return;
    }

    if (badgeEl) {
      badgeEl.className = `status-badge status-${session.status}`;
      badgeEl.textContent = session.status.toUpperCase();
    }

    if (summaryEl) {
      summaryEl.textContent = `1 Source → ${session.targetTabIds.length.toString()} Targets (${session.isPaused ? 'Paused' : 'Live'})`;
    }

    if (btnStart) btnStart.disabled = true;
    if (btnPause) btnPause.disabled = session.isPaused;
    if (btnResume) btnResume.disabled = !session.isPaused;
    if (btnStop) btnStop.disabled = false;

    this.renderTargetHealth(session);
  }

  private renderTabs(): void {
    const container = document.getElementById('windowGroupsContainer');
    if (!container) return;

    if (this.tabs.length === 0) {
      container.innerHTML = '<p class="empty-text">No eligible browser tabs found.</p>';
      return;
    }

    const windowGroups = new Map<number, BrowserTabSummary[]>();
    for (const t of this.tabs) {
      const list = windowGroups.get(t.windowId) || [];
      list.push(t);
      windowGroups.set(t.windowId, list);
    }

    let html = '';
    let windowCounter = 1;

    for (const [windowId, groupTabs] of windowGroups.entries()) {
      html += `
        <div class="window-card">
          <div class="window-header">
            <span>WINDOW ${windowCounter.toString()} (ID: ${windowId.toString()})</span>
            <span>${groupTabs.length.toString()} tabs</span>
          </div>
          <div class="window-tab-list">
      `;

      for (const t of groupTabs) {
        const isSource = this.selectedSourceId === t.id;
        const isTarget = this.selectedTargetIds.has(t.id);
        const favicon = t.favIconUrl || '../../public/icon16.png';

        html += `
          <div class="tab-row ${t.supported ? '' : 'unsupported'}" data-tab-id="${t.id.toString()}">
            <div class="tab-controls">
              <input type="radio" name="sourceRadio" value="${t.id.toString()}" ${isSource ? 'checked' : ''} ${t.supported ? '' : 'disabled'} />
              <input type="checkbox" class="targetCheckbox" value="${t.id.toString()}" ${isTarget ? 'checked' : ''} ${t.supported && !isSource ? '' : 'disabled'} />
            </div>
            <img src="${favicon}" class="favicon" alt="" />
            <div class="tab-info">
              <div class="tab-title">${escapeHtml(t.title)} ${t.active ? '🟢 (Active)' : ''}</div>
              <div class="tab-url">${escapeHtml(t.url)} ${t.unsupportedReason ? `[${t.unsupportedReason}]` : ''}</div>
            </div>
          </div>
        `;
      }

      html += `</div></div>`;
      windowCounter += 1;
    }

    container.innerHTML = html;

    container.querySelectorAll('input[name="sourceRadio"]').forEach((radio) => {
      radio.addEventListener('change', (e) => {
        const val = Number((e.target as HTMLInputElement).value);
        this.selectedSourceId = val;
        this.selectedTargetIds.delete(val);
        this.renderTabs();
      });
    });

    container.querySelectorAll('.targetCheckbox').forEach((cb) => {
      cb.addEventListener('change', (e) => {
        const val = Number((e.target as HTMLInputElement).value);
        if ((e.target as HTMLInputElement).checked) {
          this.selectedTargetIds.add(val);
        } else {
          this.selectedTargetIds.delete(val);
        }
      });
    });
  }

  private renderTargetHealth(session: ActiveSession): void {
    const listEl = document.getElementById('targetHealthList');
    if (!listEl) return;

    if (!session.targetStates || Object.keys(session.targetStates).length === 0) {
      listEl.innerHTML = '<p class="empty-text">No active target health records.</p>';
      return;
    }

    let html = '';
    for (const [tabId, state] of Object.entries(session.targetStates)) {
      html += `
        <div class="target-health-item">
          <div>
            <strong>Tab ID: ${tabId}</strong> — Status: <span class="status-${state.status}">${state.status}</span>
          </div>
          <div>
            Ack Seq: ${state.lastAckSequence !== undefined ? state.lastAckSequence.toString() : 'None'}
          </div>
        </div>
      `;
    }

    listEl.innerHTML = html;
  }

  private async startSession(): Promise<void> {
    const alertEl = document.getElementById('validationAlert');
    if (alertEl) alertEl.hidden = true;

    if (this.selectedSourceId === null) {
      this.showValidationError('Exactly one Source tab must be selected.');
      return;
    }

    if (this.selectedTargetIds.size === 0) {
      this.showValidationError('At least one Target tab must be selected.');
      return;
    }

    if (this.selectedTargetIds.has(this.selectedSourceId)) {
      this.showValidationError('Source tab cannot also be selected as a Target tab.');
      return;
    }

    const maxTargetsInput = document.getElementById('maxTargetsInput') as HTMLInputElement | null;
    const maxTargets = Math.min(32, Math.max(1, Number(maxTargetsInput?.value || 8)));

    if (this.selectedTargetIds.size > maxTargets) {
      this.showValidationError(`Target count (${this.selectedTargetIds.size.toString()}) exceeds configured max capacity (${maxTargets.toString()}).`);
      return;
    }

    const config: ExistingTabsSessionConfig = {
      mode: 'existing-tabs',
      sourceTabId: this.selectedSourceId,
      targetTabIds: Array.from(this.selectedTargetIds),
      targetOptions: {},
      syncOptions: DEFAULT_PURE_SYNC_OPTIONS,
    };

    const response = (await chrome.runtime.sendMessage({
      type: ExtensionMessageTypeEnum.StartSession,
      payload: config,
    })) as unknown as ExtensionMessage | undefined;

    if (response?.type === ExtensionMessageTypeEnum.SessionStarted) {
      this.updateSessionState(response.payload);
    } else if (response?.type === ExtensionMessageTypeEnum.SessionError) {
      this.showValidationError(response.error);
    }
  }

  private async sendAction(type: ExtensionMessage['type']): Promise<void> {
    const response = (await chrome.runtime.sendMessage({ type })) as unknown as ExtensionMessage | undefined;
    if (response?.type === ExtensionMessageTypeEnum.SessionStatus) {
      this.updateSessionState(response.payload);
    }
  }

  private showValidationError(msg: string): void {
    const alertEl = document.getElementById('validationAlert');
    if (alertEl) {
      alertEl.textContent = msg;
      alertEl.hidden = false;
    }
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
