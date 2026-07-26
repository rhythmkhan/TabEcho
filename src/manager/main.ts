import { ManagerController } from './controller';

const controller = new ManagerController();

document.addEventListener('DOMContentLoaded', () => {
  void controller.init();
});
