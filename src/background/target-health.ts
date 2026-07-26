import { ReplayAck, TargetRuntimeState } from '@/shared/types';

export class TargetHealthManager {
  private targetStates: Map<number, TargetRuntimeState> = new Map();

  initializeTargets(targetTabIds: number[]): Record<number, TargetRuntimeState> {
    this.targetStates.clear();
    targetTabIds.forEach((tabId, index) => {
      this.targetStates.set(tabId, {
        tabId,
        status: 'connecting',
        delayMs: index * 100,
        pendingEventCount: 0,
        failureCount: 0,
      });
    });
    return this.getAllStates();
  }

  setTargetReady(tabId: number): void {
    const state = this.targetStates.get(tabId);
    if (state) {
      state.status = 'ready';
      state.lastErrorCode = undefined;
    }
  }

  setTargetPaused(tabId: number): void {
    const state = this.targetStates.get(tabId);
    if (state) {
      state.status = 'paused';
    }
  }

  processAck(ack: ReplayAck): void {
    if (!ack.tabId) return;
    const state = this.targetStates.get(ack.tabId);
    if (!state) return;

    state.lastAckSequence = ack.sequence;
    state.lastAckAt = Date.now();
    if (state.pendingEventCount > 0) {
      state.pendingEventCount -= 1;
    }

    if (ack.success) {
      state.status = 'syncing';
    } else {
      state.failureCount += 1;
      state.lastErrorCode = ack.errorCode || 'REPLAY_FAILED';
      if (state.failureCount >= 5) {
        state.status = 'failed';
      }
    }
  }

  markTargetClosed(tabId: number): void {
    const state = this.targetStates.get(tabId);
    if (state) {
      state.status = 'closed';
    }
  }

  removeTarget(tabId: number): void {
    this.targetStates.delete(tabId);
  }

  getTargetState(tabId: number): TargetRuntimeState | undefined {
    return this.targetStates.get(tabId);
  }

  getAllStates(): Record<number, TargetRuntimeState> {
    const res: Record<number, TargetRuntimeState> = {};
    for (const [tabId, state] of this.targetStates.entries()) {
      res[tabId] = { ...state };
    }
    return res;
  }
}
