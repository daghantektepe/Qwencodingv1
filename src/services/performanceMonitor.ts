/**
 * performanceMonitor.ts — Faz 46: Performans İzleyici ve Profil Çıkarıcı
 *
 * Devasa projelerde (100+ bölüm, 1.000.000+ kelime) render süreleri,
 * ağaç düzleştirme (tree flattening) ve arama gecikmelerini izler.
 */

export interface PerformanceMetric {
  name: string;
  count: number;
  totalDurationMs: number;
  averageDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
  lastExecutedAt: number;
}

export interface MemorySnapshot {
  heapUsedBytes?: number;
  heapTotalBytes?: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private activeTimers: Map<string, number> = new Map();

  /**
   * Bir fonksiyonun çalışma süresini senkron veya asenkron olarak ölçer.
   */
  public measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    try {
      const result = fn();
      if (result instanceof Promise) {
        return (result.then((res) => {
          this.recordDuration(name, performance.now() - start);
          return res;
        }) as unknown) as T;
      }
      this.recordDuration(name, performance.now() - start);
      return result;
    } catch (err) {
      this.recordDuration(name, performance.now() - start);
      throw err;
    }
  }

  /**
   * Manuel zamanlayıcı başlatır.
   */
  public startTimer(name: string): void {
    this.activeTimers.set(name, performance.now());
  }

  /**
   * Manuel zamanlayıcıyı sonlandırır ve ölçümü kaydeder.
   */
  public endTimer(name: string): number {
    const start = this.activeTimers.get(name);
    if (start === undefined) return 0;

    const duration = performance.now() - start;
    this.activeTimers.delete(name);
    this.recordDuration(name, duration);
    return duration;
  }

  private recordDuration(name: string, durationMs: number): void {
    const existing = this.metrics.get(name);
    if (!existing) {
      this.metrics.set(name, {
        name,
        count: 1,
        totalDurationMs: durationMs,
        averageDurationMs: durationMs,
        minDurationMs: durationMs,
        maxDurationMs: durationMs,
        lastExecutedAt: Date.now(),
      });
    } else {
      existing.count += 1;
      existing.totalDurationMs += durationMs;
      existing.averageDurationMs = existing.totalDurationMs / existing.count;
      existing.minDurationMs = Math.min(existing.minDurationMs, durationMs);
      existing.maxDurationMs = Math.max(existing.maxDurationMs, durationMs);
      existing.lastExecutedAt = Date.now();
    }
  }

  public getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  public getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  public getMemorySnapshot(): MemorySnapshot {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const mem = process.memoryUsage();
      return {
        heapUsedBytes: mem.heapUsed,
        heapTotalBytes: mem.heapTotal,
        timestamp: Date.now(),
      };
    }
    return { timestamp: Date.now() };
  }

  public reset(): void {
    this.metrics.clear();
    this.activeTimers.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;
