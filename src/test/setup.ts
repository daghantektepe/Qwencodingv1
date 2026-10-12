import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';

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

// Suppress React 18/19 act() warnings in tests
const originalError = console.error;
console.error = (...args: any[]) => {
  const message = typeof args[0] === 'string' ? args[0] : '';
  if (
    message.includes('act(') ||
    message.includes('Warning: An update to') ||
    message.includes('inside a test was not wrapped in act')
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

// Mock jsPDF for tests
vi.mock('jspdf', () => {
  return {
    jsPDF: vi.fn().mockImplementation(() => ({
      internal: {
        pageSize: {
          getWidth: () => 210,
          getHeight: () => 297,
        },
      },
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      addPage: vi.fn(),
      splitTextToSize: vi.fn((text: string) => [text]),
      getNumberOfPages: vi.fn(() => 1),
      setPage: vi.fn(),
      output: vi.fn(() => new Blob(['test pdf'], { type: 'application/pdf' })),
    })),
  };
});

// Mock JSZip for tests
vi.mock('jszip', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      file: vi.fn(),
      folder: vi.fn(() => ({
        file: vi.fn(),
        folder: vi.fn(),
      })),
      generateAsync: vi.fn(() => Promise.resolve(new Blob(['test epub'], { type: 'application/epub+zip' }))),
    })),
  };
});
