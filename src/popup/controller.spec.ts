/**
 * @jest-environment jsdom
 */

import { ExtensionMessageTypeEnum } from '@/shared/types';
import { chrome } from 'jest-chrome';
import { PopupController } from './controller';

describe('PopupController', () => {
  let controller: PopupController;

  beforeEach(() => {
    document.body.innerHTML = `
      <span id="statusBadge" class="status-badge status-idle">IDLE</span>
      <p id="summaryText">No active live session</p>
      <button id="btnOpenControlCenter">Open Control Center</button>
      <button id="btnPauseResume" disabled>Pause</button>
      <button id="btnEmergencyStop" disabled>Stop</button>
    `;

    jest.clearAllMocks();
    (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
      type: ExtensionMessageTypeEnum.SessionStatus,
      payload: null,
    });

    controller = new PopupController();
  });

  it('fetches session state on init', async () => {
    await controller.init();
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: ExtensionMessageTypeEnum.GetSession,
    });
  });

  it('opens Control Center when button is clicked', async () => {
    (chrome.runtime.getURL as jest.Mock).mockReturnValue('chrome-extension://id/src/manager/index.html');
    (chrome.tabs.create as jest.Mock).mockResolvedValue({} as unknown as chrome.tabs.Tab);

    await controller.init();
    document.getElementById('btnOpenControlCenter')?.click();

    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://id/src/manager/index.html',
    });
  });
});
