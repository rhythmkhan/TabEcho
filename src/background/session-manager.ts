/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { HARD_MAX_TARGETS, STORAGE_KEY } from '@/shared/consts';
import {
  ActiveSession,
  ExtensionMessage,
  ExtensionMessageTypeEnum,
  SessionConfig,
  SessionRoleEnum,
} from '@/shared/types';
import { openTab, sendRoleToTab, waitForTabLoad } from '@/shared/util';
import { isTabSupported } from './tab-discovery';
import { injectContentScript } from './tab-injection';
import { TargetHealthManager } from './target-health';

export class SessionManager {
  private session: ActiveSession | null = null;
  public readonly targetHealth = new TargetHealthManager();

  get currentSession(): ActiveSession | null {
    return this.session;
  }

  async restore(): Promise<void> {
    try {
      const data = await chrome.storage.local.get(STORAGE_KEY);
      const stored = data[STORAGE_KEY] as ActiveSession | undefined;
      if (stored) {
        try {
          const sourceTab = await chrome.tabs.get(stored.sourceTabId);
          if (!sourceTab) {
            await this.clearSession();
            return;
          }
          const validTargets: number[] = [];
          for (const tid of stored.targetTabIds) {
            try {
              await chrome.tabs.get(tid);
              validTargets.push(tid);
            } catch {
              // safe drop closed tab
            }
          }

          if (validTargets.length === 0) {
            await this.clearSession();
            return;
          }

          stored.targetTabIds = validTargets;
          this.session = stored;
          this.targetHealth.initializeTargets(validTargets);

          await sendRoleToTab(
            stored.sourceTabId,
            SessionRoleEnum.Source,
            stored.generation,
            stored.status,
            stored.isPaused,
          );
          for (const tid of validTargets) {
            await sendRoleToTab(
              tid,
              SessionRoleEnum.Target,
              stored.generation,
              stored.status,
              stored.isPaused,
            );
          }
        } catch {
          await this.clearSession();
        }
      }
    } catch {
      await this.clearSession();
    }
  }

  async start(
    config: SessionConfig,
    sendResponse: (msg: ExtensionMessage) => void,
  ): Promise<void> {
    try {
      let sourceTabId: number;
      let targetTabIds: number[] = [];

      if (config.mode === 'existing-tabs') {
        sourceTabId = config.sourceTabId;
        targetTabIds = [...config.targetTabIds];
      } else {
        const sourceTab = await openTab(config.sourceUrl);
        const targetTabs = await Promise.all(
          config.targetUrls.map((url) => openTab(url)),
        );
        sourceTabId = Number(sourceTab.id);
        targetTabIds = targetTabs.map((t) => Number(t.id));

        await Promise.all([
          waitForTabLoad(sourceTabId),
          ...targetTabIds.map((id) => waitForTabLoad(id)),
        ]);
      }

      if (isNaN(sourceTabId) || targetTabIds.some(isNaN)) {
        throw new Error('INVALID_TAB_ID: Invalid tab IDs provided');
      }

      if (targetTabIds.includes(sourceTabId)) {
        throw new Error('DUPLICATE_TAB: Source tab cannot also be a Target tab');
      }

      const uniqueTargets = Array.from(new Set(targetTabIds));
      if (uniqueTargets.length !== targetTabIds.length) {
        throw new Error('DUPLICATE_TAB: Duplicate target tabs selected');
      }

      if (uniqueTargets.length > HARD_MAX_TARGETS) {
        throw new Error(
          `TARGET_LIMIT_EXCEEDED: Cannot exceed hard maximum of ${HARD_MAX_TARGETS.toString()} targets`,
        );
      }

      let sourceTab: chrome.tabs.Tab;
      try {
        sourceTab = await chrome.tabs.get(sourceTabId);
      } catch {
        throw new Error(
          `SOURCE_TAB_CLOSED: Selected source tab (ID ${sourceTabId.toString()}) is no longer open`,
        );
      }

      const sourceSupport = isTabSupported(sourceTab);
      if (!sourceSupport.supported) {
        const reasonStr = sourceSupport.reason ?? 'invalid scheme';
        throw new Error(
          `UNSUPPORTED_URL: Source tab is unsupported (${reasonStr})`,
        );
      }

      const validTargets: number[] = [];
      for (const tid of uniqueTargets) {
        try {
          const t = await chrome.tabs.get(tid);
          const tSupp = isTabSupported(t);
          if (!tSupp.supported) {
            const reasonStr = tSupp.reason ?? 'invalid scheme';
            throw new Error(
              `UNSUPPORTED_URL: Target tab ${tid.toString()} is unsupported (${reasonStr})`,
            );
          }
          validTargets.push(tid);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.startsWith('UNSUPPORTED_URL')) {
            throw err;
          }
          // Tab closed or unavailable — automatically filter it out without failing
        }
      }

      if (validTargets.length === 0) {
        throw new Error(
          'NO_VALID_TARGETS: None of the selected target tabs are currently available',
        );
      }

      await injectContentScript(sourceTabId);
      for (const tid of validTargets) {
        await injectContentScript(tid);
      }

      const generation = (this.session?.generation || 0) + 1;
      const initialTargetStates = this.targetHealth.initializeTargets(validTargets);

      this.session = {
        id: crypto.randomUUID(),
        mode: config.mode,
        status: 'active',
        sourceTabId,
        targetTabIds: validTargets,
        generation,
        sequenceNumber: 0,
        startedAt: new Date().toISOString(),
        isPaused: false,
        syncOptions: config.syncOptions,
        targetStates: initialTargetStates,
      };

      await this.persist();

      await sendRoleToTab(sourceTabId, SessionRoleEnum.Source, generation, 'active', false);
      for (const tid of validTargets) {
        await sendRoleToTab(tid, SessionRoleEnum.Target, generation, 'active', false);
        this.targetHealth.setTargetReady(tid);
      }

      try {
        await chrome.tabs.update(sourceTabId, { active: true });
      } catch {
        // safe drop
      }

      sendResponse({
        type: ExtensionMessageTypeEnum.SessionStarted,
        payload: this.session,
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      sendResponse({
        type: ExtensionMessageTypeEnum.SessionError,
        error,
      });
    }
  }

  async pause(_reason = 'user'): Promise<void> {
    void _reason;
    if (!this.session || this.session.isPaused) return;

    this.session.isPaused = true;
    this.session.status = 'paused';
    this.session.generation += 1;
    this.session.sequenceNumber = 0;

    await this.persist();

    await sendRoleToTab(
      this.session.sourceTabId,
      SessionRoleEnum.Source,
      this.session.generation,
      'paused',
      true,
    );

    for (const tid of this.session.targetTabIds) {
      await sendRoleToTab(
        tid,
        SessionRoleEnum.Target,
        this.session.generation,
        'paused',
        true,
      );
      this.targetHealth.setTargetPaused(tid);
    }
  }

  async resume(_reason = 'user'): Promise<void> {
    void _reason;
    if (!this.session || !this.session.isPaused) return;

    this.session.isPaused = false;
    this.session.status = 'active';
    this.session.generation += 1;
    this.session.sequenceNumber = 0;

    await this.persist();

    await sendRoleToTab(
      this.session.sourceTabId,
      SessionRoleEnum.Source,
      this.session.generation,
      'active',
      false,
    );

    for (const tid of this.session.targetTabIds) {
      await sendRoleToTab(
        tid,
        SessionRoleEnum.Target,
        this.session.generation,
        'active',
        false,
      );
      this.targetHealth.setTargetReady(tid);
    }
  }

  async stop(_reason = 'user'): Promise<void> {
    void _reason;
    if (!this.session) return;
    const { sourceTabId, targetTabIds, generation } = this.session;
    this.session = null;
    await this.clearSession();

    try {
      await sendRoleToTab(sourceTabId, SessionRoleEnum.Idle, generation, 'idle', false);
    } catch {
      // safe drop
    }

    for (const tid of targetTabIds) {
      try {
        await sendRoleToTab(tid, SessionRoleEnum.Idle, generation, 'idle', false);
      } catch {
        // safe drop
      }
    }
  }

  async emergencyStop(reason = 'emergency'): Promise<void> {
    await this.stop(reason);
  }

  async removeTarget(targetTabId: number): Promise<void> {
    if (!this.session) return;

    const idx = this.session.targetTabIds.indexOf(targetTabId);
    if (idx === -1) return;

    this.session.targetTabIds.splice(idx, 1);
    this.targetHealth.removeTarget(targetTabId);

    try {
      await sendRoleToTab(
        targetTabId,
        SessionRoleEnum.Idle,
        this.session.generation,
        'idle',
        false,
      );
    } catch {
      // safe drop
    }

    if (this.session.targetTabIds.length === 0) {
      await this.stop('all-targets-closed');
      return;
    }

    await this.persist();
  }

  getNextSequence(): number {
    if (!this.session) return 0;
    this.session.sequenceNumber += 1;
    return this.session.sequenceNumber;
  }

  private async persist(): Promise<void> {
    if (this.session) {
      this.session.targetStates = this.targetHealth.getAllStates();
      await chrome.storage.local.set({ [STORAGE_KEY]: this.session });
    } else {
      await this.clearSession();
    }
  }

  private async clearSession(): Promise<void> {
    this.session = null;
    await chrome.storage.local.remove([STORAGE_KEY]);
  }
}
