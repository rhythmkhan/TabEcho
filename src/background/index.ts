import { createMessageRouter } from './message-router';
import { SessionManager } from './session-manager';
import { setupTabLifecycle } from './tab-lifecycle';

const sessionManager = new SessionManager();

void sessionManager.restore();

setupTabLifecycle(sessionManager);
createMessageRouter(sessionManager);

// Handle Chrome Extension Commands
chrome.commands.onCommand.addListener((command) => {
  switch (command) {
    case 'tabecho-toggle-pause': {
      const current = sessionManager.currentSession;
      if (current?.isPaused) {
        void sessionManager.resume('chrome-command');
      } else {
        void sessionManager.pause('chrome-command');
      }
      break;
    }

    case 'tabecho-resume': {
      void sessionManager.resume('chrome-command');
      break;
    }

    case 'tabecho-stop': {
      void sessionManager.stop('chrome-command');
      break;
    }

    case 'tabecho-emergency-stop': {
      void sessionManager.emergencyStop('chrome-command');
      break;
    }

    case 'tabecho-open-control-center': {
      void chrome.tabs.create({
        url: chrome.runtime.getURL('src/manager/index.html'),
      });
      break;
    }

    default:
      break;
  }
});
