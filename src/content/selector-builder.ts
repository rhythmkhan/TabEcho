/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { ElementDescriptor, SelectorCandidate } from '@/shared/types';

export function buildElementDescriptor(el: Element): ElementDescriptor {
  const candidates: SelectorCandidate[] = [];
  const tagName = el.tagName.toLowerCase();

  if (el.id) {
    const escapedId = `#${CSS.escape(el.id)}`;
    try {
      if (document.querySelectorAll(escapedId).length === 1) {
        candidates.push({
          strategy: 'unique-id',
          value: escapedId,
          confidence: 1.0,
        });
      }
    } catch {
      // safe drop
    }
  }

  const testAttrs = ['data-testid', 'data-test', 'data-cy', 'data-qa'];
  for (const attr of testAttrs) {
    const val = el.getAttribute(attr);
    if (val) {
      const sel = `[${attr}="${CSS.escape(val)}"]`;
      candidates.push({
        strategy: 'test-attribute',
        value: sel,
        confidence: 0.95,
      });
    }
  }

  const nameVal = el.getAttribute('name');
  if (nameVal) {
    const sel = `${tagName}[name="${CSS.escape(nameVal)}"]`;
    candidates.push({
      strategy: 'name',
      value: sel,
      confidence: 0.9,
    });
  }

  const role = el.getAttribute('role');
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) {
    const sel = `${tagName}[aria-label="${CSS.escape(ariaLabel)}"]`;
    candidates.push({
      strategy: 'aria',
      value: sel,
      confidence: 0.85,
    });
  } else if (role) {
    const sel = `${tagName}[role="${CSS.escape(role)}"]`;
    candidates.push({
      strategy: 'aria',
      value: sel,
      confidence: 0.75,
    });
  }

  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    if (el.placeholder) {
      candidates.push({
        strategy: 'stable-attribute',
        value: `${tagName}[placeholder="${CSS.escape(el.placeholder)}"]`,
        confidence: 0.8,
      });
    }
  }

  const cssPath = getCssPath(el);
  candidates.push({
    strategy: 'css-path',
    value: cssPath,
    confidence: 0.6,
  });

  let textHint: string | undefined;
  if (el.textContent && el.textContent.length < 50) {
    textHint = el.textContent.trim();
  }

  const rect = el.getBoundingClientRect();
  const widthRatio = window.innerWidth > 0 ? rect.width / window.innerWidth : 0;
  const heightRatio = window.innerHeight > 0 ? rect.height / window.innerHeight : 0;

  const attributes: Record<string, string> = {};
  if (el instanceof HTMLInputElement) {
    if (el.type) attributes.type = el.type;
  }

  return {
    tagName,
    inputType: (el as HTMLInputElement).type,
    role: role || undefined,
    accessibleName: ariaLabel || undefined,
    textHint,
    attributes,
    selectors: candidates,
    boundingBox: { widthRatio, heightRatio },
  };
}

function getCssPath(el: Element): string {
  const parts: string[] = [];
  let curr: Element | null = el;

  while (curr && curr !== document.documentElement && parts.length < 5) {
    const parent: Element | null = curr.parentElement;
    if (!parent) break;

    const tag = curr.tagName.toLowerCase();
    const siblings = Array.from(parent.children).filter(
      (c) => c.tagName === curr?.tagName,
    );
    const index = siblings.indexOf(curr) + 1;

    parts.unshift(`${tag}:nth-of-type(${index.toString()})`);
    curr = parent;
  }

  return parts.length > 0 ? parts.join(' > ') : el.tagName.toLowerCase();
}
