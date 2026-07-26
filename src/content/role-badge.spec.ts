/**
 * @jest-environment jsdom
 */

import { APP_NAME } from '@/shared/consts';
import { SessionRoleEnum } from '@/shared/types';
import { RoleBadge } from './role-badge';

describe('RoleBadge', () => {
  let badge: RoleBadge;

  const getBadgeEl = () => document.getElementById(`${APP_NAME.toLowerCase()}-badge`);

  beforeEach(() => {
    document.documentElement.innerHTML = '<head></head><body></body>';
    badge = new RoleBadge();
  });

  describe('update', () => {
    it('creates the badge element on first non-idle update', () => {
      expect(getBadgeEl()).toBeNull();

      badge.update(SessionRoleEnum.Source);

      const el = getBadgeEl();
      expect(el).not.toBeNull();
      expect(el?.textContent).toBe(`${APP_NAME} · SOURCE`);
    });

    it('updates label when role changes to TARGET', () => {
      badge.update(SessionRoleEnum.Source);
      badge.update(SessionRoleEnum.Target);

      const el = getBadgeEl();
      expect(el?.textContent).toBe(`${APP_NAME} · TARGET`);
    });

    it('removes the badge when role becomes idle', () => {
      badge.update(SessionRoleEnum.Source);
      expect(getBadgeEl()).not.toBeNull();

      badge.update(SessionRoleEnum.Idle);

      expect(getBadgeEl()).toBeNull();
    });
  });
});
