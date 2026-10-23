import { useSyncExternalStore } from 'react';

export type OperatingSystem = 'macos' | 'windows' | 'linux' | 'unknown';

export interface TouchPlatformState {
  touchModeEnabled: boolean;
  isTouchHardwareDetected: boolean;
  operatingSystem: OperatingSystem;
  virtualKeyboardOpen: boolean;
}

const STORAGE_KEY = 'openscriv_touch_mode_enabled';

export class TouchModeAdapter {
  private touchModeEnabled: boolean = false;
  private isTouchHardwareDetected: boolean = false;
  private operatingSystem: OperatingSystem = 'unknown';
  private virtualKeyboardOpen: boolean = false;
  private cachedSnapshot: TouchPlatformState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.detectHardwareAndOS();
    this.loadFromStorage();
    this.cachedSnapshot = this.getSnapshot();
    this.applyToDOM();
    this.setupVirtualKeyboardWatcher();
  }

  private detectHardwareAndOS() {
    if (typeof window !== 'undefined') {
      // Touch detection
      this.isTouchHardwareDetected =
        (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
        'ontouchstart' in window;

      // OS detection
      const userAgent = (navigator.userAgent || '').toLowerCase();
      if (userAgent.includes('mac') || userAgent.includes('darwin')) {
        this.operatingSystem = 'macos';
      } else if (userAgent.includes('win')) {
        this.operatingSystem = 'windows';
      } else if (userAgent.includes('linux')) {
        this.operatingSystem = 'linux';
      }
    }
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          this.touchModeEnabled = stored === 'true';
          return;
        }
      }
    } catch {
      // Ignore
    }
    // Auto-enable if touch screen tablet detected
    this.touchModeEnabled = this.isTouchHardwareDetected;
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, String(this.touchModeEnabled));
      }
    } catch {
      // Ignore
    }
    this.applyToDOM();
    this.notify();
  }

  private notify() {
    this.cachedSnapshot = {
      touchModeEnabled: this.touchModeEnabled,
      isTouchHardwareDetected: this.isTouchHardwareDetected,
      operatingSystem: this.operatingSystem,
      virtualKeyboardOpen: this.virtualKeyboardOpen
    };
    this.listeners.forEach((l) => l());
  }

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public getSnapshot = (): TouchPlatformState => {
    return (
      this.cachedSnapshot || {
        touchModeEnabled: this.touchModeEnabled,
        isTouchHardwareDetected: this.isTouchHardwareDetected,
        operatingSystem: this.operatingSystem,
        virtualKeyboardOpen: this.virtualKeyboardOpen
      }
    );
  };

  public toggleTouchMode() {
    this.touchModeEnabled = !this.touchModeEnabled;
    this.saveToStorage();
  }

  public setTouchMode(enabled: boolean) {
    this.touchModeEnabled = enabled;
    this.saveToStorage();
  }

  public applyToDOM() {
    if (typeof document === 'undefined') return;
    if (this.touchModeEnabled) {
      document.body.classList.add('touch-mode-active');
    } else {
      document.body.classList.remove('touch-mode-active');
    }
  }

  private setupVirtualKeyboardWatcher() {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    window.visualViewport.addEventListener('resize', () => {
      if (window.visualViewport) {
        // If viewport height significantly shrinks (e.g. keyboard taking 200px+)
        const isShrunk = window.visualViewport.height < window.innerHeight * 0.75;
        if (this.virtualKeyboardOpen !== isShrunk) {
          this.virtualKeyboardOpen = isShrunk;
          this.notify();
        }
      }
    });
  }
}

export const touchModeAdapter = new TouchModeAdapter();

export function useTouchModeStore() {
  const snapshot = useSyncExternalStore(
    touchModeAdapter.subscribe,
    touchModeAdapter.getSnapshot,
    touchModeAdapter.getSnapshot
  );

  return {
    ...snapshot,
    toggleTouchMode: touchModeAdapter.toggleTouchMode.bind(touchModeAdapter),
    setTouchMode: touchModeAdapter.setTouchMode.bind(touchModeAdapter)
  };
}

useTouchModeStore.getState = () => touchModeAdapter.getSnapshot();
