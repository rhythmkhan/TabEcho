/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import {
  ELEMENT_RESOLVE_RETRY_INTERVAL_MS,
  ELEMENT_RESOLVE_TIMEOUT_MS,
} from '@/shared/consts';
import { ElementDescriptor, SelectorStrategy } from '@/shared/types';

export interface ResolveResult {
  element: Element;
  strategy: SelectorStrategy;
}

export async function resolveElement(
  descriptor: ElementDescriptor | null,
  clickXRatio?: number,
  clickYRatio?: number,
): Promise<ResolveResult | null> {
  if (descriptor && descriptor.selectors.length > 0) {
    const syncMatch = resolveSync(descriptor);
    if (syncMatch) return syncMatch;

    const asyncMatch = await waitForMatch(descriptor);
    if (asyncMatch) return asyncMatch;
  }

  if (clickXRatio !== undefined && clickYRatio !== undefined) {
    const x = clickXRatio * window.innerWidth;
    const y = clickYRatio * window.innerHeight;
    const el = document.elementFromPoint(x, y);
    if (el) {
      return { element: el, strategy: 'coordinate' };
    }
  }

  return null;
}

function resolveSync(descriptor: ElementDescriptor): ResolveResult | null {
  for (const candidate of descriptor.selectors) {
    try {
      const elements = Array.from(document.querySelectorAll(candidate.value));
      for (const el of elements) {
        if (matchesDescriptor(el, descriptor)) {
          return { element: el, strategy: candidate.strategy };
        }
      }
    } catch {
      // safe drop
    }
  }

  return null;
}

function waitForMatch(descriptor: ElementDescriptor): Promise<ResolveResult | null> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let observer: MutationObserver | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;

    const cleanup = () => {
      if (observer) observer.disconnect();
      if (timer) clearInterval(timer);
    };

    const check = () => {
      const match = resolveSync(descriptor);
      if (match) {
        cleanup();
        resolve(match);
      } else if (Date.now() - startTime >= ELEMENT_RESOLVE_TIMEOUT_MS) {
        cleanup();
        resolve(null);
      }
    };

    observer = new MutationObserver(() => {
      check();
    });

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    timer = setInterval(check, ELEMENT_RESOLVE_RETRY_INTERVAL_MS);
  });
}

function matchesDescriptor(el: Element, descriptor: ElementDescriptor): boolean {
  if (el.tagName.toLowerCase() !== descriptor.tagName.toLowerCase()) {
    return false;
  }

  if (descriptor.inputType && el instanceof HTMLInputElement) {
    return el.type.toLowerCase() === descriptor.inputType.toLowerCase();
  }

  return true;
}
