import { PopupController } from './controller';

const controller = new PopupController();

document.addEventListener('DOMContentLoaded', () => {
  void controller.init();
});
