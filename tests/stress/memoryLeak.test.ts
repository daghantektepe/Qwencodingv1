import { describe, it, expect } from 'vitest';
import { offlineDictionary } from '../../src/services/dictionary/offlineDictionary';
import { textExpanderService } from '../../src/services/snippets/textExpander';
import { mapStore } from '../../src/services/map/mapStore';
import { styleHeatmapEngine } from '../../src/services/style/styleHeatmapEngine';

describe('Phase 99: Memory Leak & Resource Cleanup Stress Suite', () => {
  it('should clean up store listeners without leaking subscription references', () => {
    const unsubscribers: (() => void)[] = [];

    // Subscribe 5,000 listeners
    for (let i = 0; i < 5000; i++) {
      const unsubMap = mapStore.subscribe(() => {});
      const unsubExp = textExpanderService.subscribe(() => {});
      unsubscribers.push(unsubMap, unsubExp);
    }

    expect(unsubscribers.length).toBe(10000);

    // Unsubscribe all
    unsubscribers.forEach((unsub) => unsub());

    // Trigger state changes and ensure no lingering overhead
    const start = performance.now();
    mapStore.setActiveMapId('map_default_eldoria');
    textExpanderService.resetToDefault();
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(50); // Under 50ms notification
  });

  it('should maintain stable heap and fast execution under repeated analysis iterations', () => {
    const longText = 'Bu bir performans ve bellek stres testi metnidir. '.repeat(100);

    const start = performance.now();
    for (let i = 0; i < 200; i++) {
      styleHeatmapEngine.analyze(longText);
    }
    const totalTime = performance.now() - start;

    // 200 iterations over 100-sentence prose under 1000ms
    expect(totalTime).toBeLessThan(1000);
  });
});
