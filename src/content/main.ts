import {
  ExtensionMessage,
  ExtensionMessageTypeEnum,
  SessionRoleEnum,
} from '@/shared/types';
import { EventApplier } from './event-applier';
import { EventCapture } from './event-capture';
import { RoleBadge } from './role-badge';
import { StatusOverlay } from './status-overlay';
import { VirtualCursor } from './virtual-cursor';

const roleBadge = new RoleBadge();
const statusOverlay = new StatusOverlay();
const virtualCursor = new VirtualCursor();
const eventApplier = new EventApplier(virtualCursor);
const eventCapture = new EventCapture();

chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
  if (message.type === ExtensionMessageTypeEnum.SetRole) {
    const { role, generation, isPaused } = message;

    roleBadge.setRole(role);
    statusOverlay.show(role, isPaused);

    eventCapture.setRole(role, generation, isPaused);
    eventApplier.setRole(role, generation);

    if (role === SessionRoleEnum.Target) {
      virtualCursor.show();
    } else {
      virtualCursor.hide();
    }
  } else if (message.type === ExtensionMessageTypeEnum.LiveSyncEvent) {
    void eventApplier.applyEvent(message.payload);
  }
});
