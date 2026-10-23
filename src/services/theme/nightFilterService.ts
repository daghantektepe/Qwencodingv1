import { useSyncExternalStore } from 'react';

export type NightModeType = 'normal' | 'oled' | 'amber' | 'paper_dim';

export interface NightFilterConfig {
  mode: NightModeType;
  intensity: number; // 0 to 100
  contrastBoost: number; // 0 to 50
  autoSchedule: boolean;
  startHour: number; // e.g. 20 (20:00)
  endHour: number; // e.g. 7 (07:00)
}

const STORAGE_KEY = 'openscriv_night_filter_settings';

export const DEFAULT_NIGHT_FILTER: NightFilterConfig = {
  mode: 'normal',
  intensity: 60,
  contrastBoost: 10,
  autoSchedule: false,
  startHour: 20,
  endHour: 7
};

export class NightFilterService {
  private config: NightFilterConfig;
  private cachedSnapshot: NightFilterConfig;
  private listeners: Set<() => void> = new Set();
  private timerId: any = null;

  constructor() {
    this.config = { ...DEFAULT_NIGHT_FILTER };
    this.loadFromStorage();
    this.cachedSnapshot = { ...this.config };
    this.applyToDOM();
    this.startSchedulerIfNeeded();
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          this.config = { ...DEFAULT_NIGHT_FILTER, ...JSON.parse(raw) };
        }
      }
    } catch {
      // Ignore
    }
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
      }
    } catch {
      // Ignore
    }
    this.cachedSnapshot = { ...this.config };
    this.applyToDOM();
    this.notify();
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public getSnapshot = (): NightFilterConfig => {
    return this.cachedSnapshot;
  };

  public getState() {
    return {
      config: this.getSnapshot(),
      setMode: this.setMode.bind(this),
      setIntensity: this.setIntensity.bind(this),
      setContrastBoost: this.setContrastBoost.bind(this),
      setAutoSchedule: this.setAutoSchedule.bind(this),
      setScheduleHours: this.setScheduleHours.bind(this),
      reset: this.reset.bind(this),
      isNightTimeNow: this.isNightTimeNow.bind(this),
      getFilterStyleString: this.getFilterStyleString.bind(this)
    };
  }

  public setMode(mode: NightModeType) {
    this.config.mode = mode;
    this.saveToStorage();
  }

  public setIntensity(intensity: number) {
    this.config.intensity = Math.max(0, Math.min(100, intensity));
    this.saveToStorage();
  }

  public setContrastBoost(contrastBoost: number) {
    this.config.contrastBoost = Math.max(0, Math.min(50, contrastBoost));
    this.saveToStorage();
  }

  public setAutoSchedule(autoSchedule: boolean) {
    this.config.autoSchedule = autoSchedule;
    this.saveToStorage();
    this.startSchedulerIfNeeded();
    this.checkSchedule();
  }

  public setScheduleHours(startHour: number, endHour: number) {
    this.config.startHour = startHour;
    this.config.endHour = endHour;
    this.saveToStorage();
    this.checkSchedule();
  }

  public isNightTimeNow(currentHour: number = new Date().getHours()): boolean {
    const { startHour, endHour } = this.config;
    if (startHour > endHour) {
      // Over midnight: e.g. 20:00 to 07:00
      return currentHour >= startHour || currentHour < endHour;
    } else {
      // Same day: e.g. 18:00 to 23:00
      return currentHour >= startHour && currentHour < endHour;
    }
  }

  public checkSchedule(currentHour: number = new Date().getHours()): boolean {
    if (!this.config.autoSchedule) return false;
    const isNight = this.isNightTimeNow(currentHour);
    if (isNight && this.config.mode === 'normal') {
      this.config.mode = 'amber';
      this.saveToStorage();
      return true;
    } else if (!isNight && this.config.mode === 'amber') {
      this.config.mode = 'normal';
      this.saveToStorage();
      return true;
    }
    return false;
  }

  private startSchedulerIfNeeded() {
    if (typeof window === 'undefined') return;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.config.autoSchedule) {
      this.timerId = setInterval(() => {
        this.checkSchedule();
      }, 60000); // Check every minute
    }
  }

  public getFilterStyleString(): string {
    const { mode, intensity, contrastBoost } = this.config;
    const ratio = intensity / 100;
    const contrastRatio = 1 + contrastBoost / 100;

    switch (mode) {
      case 'amber': {
        const sepiaVal = Math.round(ratio * 70);
        const hueRotate = Math.round(ratio * -25);
        const brightness = Math.max(70, Math.round(100 - ratio * 15));
        return `sepia(${sepiaVal}%) hue-rotate(${hueRotate}deg) brightness(${brightness}%) contrast(${contrastRatio})`;
      }
      case 'oled': {
        return `contrast(${contrastRatio + 0.15}) brightness(95%)`;
      }
      case 'paper_dim': {
        const sepiaVal = Math.round(ratio * 35);
        const brightness = Math.max(75, Math.round(100 - ratio * 20));
        return `sepia(${sepiaVal}%) brightness(${brightness}%) contrast(${contrastRatio})`;
      }
      case 'normal':
      default:
        return 'none';
    }
  }

  public applyToDOM() {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Toggle OLED class
    if (this.config.mode === 'oled') {
      root.classList.add('oled-black-theme');
      root.style.setProperty('--oled-bg', '#000000');
    } else {
      root.classList.remove('oled-black-theme');
      root.style.removeProperty('--oled-bg');
    }

    // Apply CSS filter
    const filterStr = this.getFilterStyleString();
    if (filterStr === 'none') {
      root.style.removeProperty('filter');
    } else {
      root.style.filter = filterStr;
    }
  }

  public reset() {
    this.config = { ...DEFAULT_NIGHT_FILTER };
    this.saveToStorage();
  }

  public destroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

export const nightFilterService = new NightFilterService();

export function useNightFilterStore() {
  const config = useSyncExternalStore(
    nightFilterService.subscribe,
    nightFilterService.getSnapshot,
    nightFilterService.getSnapshot
  );

  return {
    ...config,
    setMode: nightFilterService.setMode.bind(nightFilterService),
    setIntensity: nightFilterService.setIntensity.bind(nightFilterService),
    setContrastBoost: nightFilterService.setContrastBoost.bind(nightFilterService),
    setAutoSchedule: nightFilterService.setAutoSchedule.bind(nightFilterService),
    setScheduleHours: nightFilterService.setScheduleHours.bind(nightFilterService),
    reset: nightFilterService.reset.bind(nightFilterService),
    isNightTimeNow: nightFilterService.isNightTimeNow.bind(nightFilterService),
    getFilterStyleString: nightFilterService.getFilterStyleString.bind(nightFilterService)
  };
}

useNightFilterStore.getState = () => nightFilterService.getState();
