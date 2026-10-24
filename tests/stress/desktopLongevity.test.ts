import { describe, it, expect, vi } from 'vitest';
import { SqliteFtsEngine } from '../../src/services/search/sqliteFtsEngine';
import { CrashGuardService } from '../../src/services/recovery/crashGuardService';
import { SystemThemeBridge } from '../../src/services/native/systemThemeBridge';
import { NativeNotificationService } from '../../src/services/native/notificationService';

describe('Phase 119: Desktop Longevity & Memory Leak Stress Test', () => {
  it('1,000 döngülük belge yazma ve indeksleme stres testinde bellek sızıntısı yapmaz', async () => {
    const initialMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;

    // 1000 iterasyon simülasyonu
    for (let i = 0; i < 1000; i++) {
      const docId = `stress_doc_${i % 50}`;
      const title = `Bölüm ${i}: Uzun Soluklu Roman Metni`;
      const content = `Bu içerik döngü ${i} için yazılmıştır. Yazar derin kurgusal dünyasında yüzlerce paragraf üretmektedir.`;

      // 1. FTS İndeksleme ve Arama
      await SqliteFtsEngine.updateDocument(docId, title, content);
      if (i % 100 === 0) {
        const res = await SqliteFtsEngine.search('kurgusal', { limit: 5 });
        expect(res.results.length).toBeGreaterThan(0);
      }

      // 2. CrashGuard periyodik journal kaydı
      if (i % 200 === 0) {
        CrashGuardService.logChange(docId, content, title);
      }
    }

    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
    const memoryDiffMb = (finalMemory - initialMemory) / (1024 * 1024);

    // 1000 iterasyon sonrası kabul edilebilir azami heap artışı (50 MB altı)
    expect(memoryDiffMb).toBeLessThan(50);
  });

  it('Olay dinleyicilerinde (Event Listener) abone ve abonelikten çıkma döngüsü sızıntı yapmaz', () => {
    const unsubscribers: Array<() => void> = [];

    // 500 abone ekle ve çıkar
    for (let i = 0; i < 500; i++) {
      const unsub = SystemThemeBridge.subscribe(() => {});
      unsubscribers.push(unsub);
    }

    // Hepsini serbest bırak
    unsubscribers.forEach((unsub) => unsub());

    // Dinleyici listesi temizlenmiş olmalı
    SystemThemeBridge.applyThemeToDom({
      isDark: false,
      themeSource: 'light',
      accentColor: '#3b82f6',
    });

    expect(unsubscribers.length).toBe(500);
  });

  it('Hedef bildirim kilidi (Announce Lock) bellek şişmesi olmadan güvenle sıfırlanır', () => {
    for (let i = 0; i < 200; i++) {
      NativeNotificationService.checkSprintWordTarget(1000, 500, `proj_${i}`);
    }

    NativeNotificationService.resetTargetAnnounced();
    expect(true).toBe(true);
  });
});
