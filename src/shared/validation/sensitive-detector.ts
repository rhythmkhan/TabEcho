const SENSITIVE_TYPES = new Set(['password', 'file']);

const SENSITIVE_AUTOCOMPLETE = new Set([
  'cc-number',
  'cc-exp',
  'cc-exp-month',
  'cc-exp-year',
  'cc-csc',
  'cc-type',
  'current-password',
  'new-password',
  'one-time-code',
]);

const SENSITIVE_NAME_PATTERNS = [
  /password/i,
  /passwd/i,
  /secret/i,
  /token/i,
  /apikey/i,
  /api_key/i,
  /ssn/i,
  /creditcard/i,
  /cardnumber/i,
  /card_number/i,
  /cvv/i,
  /cvc/i,
  /pin/i,
  /otp/i,
  /private_key/i,
];

const DESTRUCTIVE_KEYWORDS = [
  'pay',
  'purchase',
  'buy',
  'place order',
  'delete',
  'remove account',
  'confirm payment',
  'transfer',
  'send money',
  'submit payment',
  'unsubscribe',
  'terminate',
  'factory reset',
];

export function isElementSensitive(el: Element): boolean {
  if (
    el.hasAttribute('data-tabecho-ignore') ||
    el.hasAttribute('data-private') ||
    el.hasAttribute('data-sensitive')
  ) {
    return true;
  }

  if (el instanceof HTMLInputElement) {
    const inputType = (el.type || '').toLowerCase();
    if (SENSITIVE_TYPES.has(inputType)) return true;

    const autocomplete = (el.getAttribute('autocomplete') || '').toLowerCase();
    if (SENSITIVE_AUTOCOMPLETE.has(autocomplete)) return true;

    const name = el.name || el.id || '';
    if (SENSITIVE_NAME_PATTERNS.some((pattern) => pattern.test(name))) {
      return true;
    }
  }

  return false;
}

export function isDestructiveAction(el: Element): boolean {
  const textContent = (el.textContent || '').toLowerCase();
  const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
  const dataAction = (el.getAttribute('data-action') || '').toLowerCase();
  const title = (el.getAttribute('title') || '').toLowerCase();

  const combinedText = `${textContent} ${ariaLabel} ${dataAction} ${title}`;

  return DESTRUCTIVE_KEYWORDS.some((kw) => combinedText.includes(kw));
}

export function sanitizeValueForLog(value: string, isSensitive: boolean): string {
  if (isSensitive) {
    return '[REDACTED_SENSITIVE_DATA]';
  }
  return value;
}
