import '@testing-library/jest-dom';
import { afterEach, vi, afterAll } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock ResizeObserver
(window as any).ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
(window as any).IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
  root = null;
  rootMargin = '';
  thresholds = [];
};

// Mock requestAnimationFrame
(window as any).requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(callback, 0) as unknown as number;
};

(window as any).cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock Element.animate (for Tailwind animations)
Element.prototype.animate = function() {
  return {
    cancel: () => {},
    finish: () => {},
    pause: () => {},
    play: () => {},
    reverse: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  } as any;
};

// Mock window.scrollTo
window.scrollTo = () => {};

// Mock getComputedStyle
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = (elt: Element, pseudoElt?: string | null) => {
  try {
    return originalGetComputedStyle(elt, pseudoElt);
  } catch {
    return {} as CSSStyleDeclaration;
  }
};

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = function() {
  return null;
} as any;

// Mock useLayoutEffect for jsdom environment
// React 18/19 throws error when useLayoutEffect is used in non-browser environment
const originalUseLayoutEffect = (await import('react')).useLayoutEffect;
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useLayoutEffect: (actual as any).useEffect,
  };
});

// Suppress React 18/19 act() warnings in tests
const originalError = console.error;
console.error = (...args: any[]) => {
  const message = typeof args[0] === 'string' ? args[0] : '';
  if (
    message.includes('act(') ||
    message.includes('Warning: An update to') ||
    message.includes('inside a test was not wrapped in act') ||
    message.includes('useLayoutEffect')
  ) {
    return;
  }
  originalError.call(console, ...args);
};

// Mock structuredClone if not available
if (typeof structuredClone === 'undefined') {
  (globalThis as any).structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
}

// Mock queueMicrotask
if (typeof queueMicrotask === 'undefined') {
  (globalThis as any).queueMicrotask = (callback: () => void) => {
    Promise.resolve().then(callback);
  };
}

// Cleanup timers after each test
afterEach(() => {
  vi.clearAllTimers();
});

// Cleanup after all tests
afterAll(() => {
  vi.restoreAllMocks();
});
