import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { screen } from '@testing-library/react';

(globalThis as any).jest = vi;

if (screen) {
  (screen as any).querySelector = (selector: string) => document.querySelector(selector);
  (screen as any).querySelectorAll = (selector: string) => document.querySelectorAll(selector);
}
