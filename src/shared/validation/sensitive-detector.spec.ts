/**
 * @jest-environment jsdom
 */

import {
  isDestructiveAction,
  isElementSensitive,
  sanitizeValueForLog,
} from './sensitive-detector';

describe('sensitive-detector', () => {
  it('detects password input type as sensitive', () => {
    const el = document.createElement('input');
    el.type = 'password';
    expect(isElementSensitive(el)).toBe(true);
  });

  it('detects file input type as sensitive', () => {
    const el = document.createElement('input');
    el.type = 'file';
    expect(isElementSensitive(el)).toBe(true);
  });

  it('detects autocomplete="cc-number" as sensitive', () => {
    const el = document.createElement('input');
    el.setAttribute('autocomplete', 'cc-number');
    expect(isElementSensitive(el)).toBe(true);
  });

  it('detects data-tabecho-ignore attribute as sensitive', () => {
    const el = document.createElement('div');
    el.setAttribute('data-tabecho-ignore', 'true');
    expect(isElementSensitive(el)).toBe(true);
  });

  it('detects destructive button actions', () => {
    const btn = document.createElement('button');
    btn.textContent = 'Confirm Payment';
    expect(isDestructiveAction(btn)).toBe(true);

    const deleteBtn = document.createElement('button');
    deleteBtn.setAttribute('aria-label', 'Delete account');
    expect(isDestructiveAction(deleteBtn)).toBe(true);
  });

  it('redacts sensitive values in logs', () => {
    expect(sanitizeValueForLog('my-secret-pw', true)).toBe('[REDACTED_SENSITIVE_DATA]');
    expect(sanitizeValueForLog('hello', false)).toBe('hello');
  });
});
