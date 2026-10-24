/**
 * Native Notification & Sprint Alarm Service
 * Phase 117: Yerel İşletim Sistemi Bildirimleri ve Yazarlık Alarmı
 */

export interface NotificationOptions {
  title: string;
  body: string;
  silent?: boolean;
}

export class NativeNotificationService {
  private static targetReachedAnnounced: Set<string> = new Set();

  static isElectron(): boolean {
    return typeof window !== 'undefined' && !!(window as any).electronBridge?.isDesktop;
  }

  static async showNotification(options: NotificationOptions): Promise<boolean> {
    if (this.isElectron()) {
      try {
        const res = await (window as any).electronBridge.invoke('notification:show', options);
        return Boolean(res?.ok);
      } catch (err) {
        console.warn('[NotificationService] IPC bildirim hatası:', err);
      }
    }

    // Web Notification API Fallback
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(options.title, { body: options.body, silent: options.silent });
          return true;
        } else if (Notification.permission !== 'denied') {
          const perm = await Notification.requestPermission();
          if (perm === 'granted') {
            new Notification(options.title, { body: options.body, silent: options.silent });
            return true;
          }
        }
      }
    } catch {
      // ignore
    }

    return false;
  }

  static async checkSprintWordTarget(
    currentWords: number,
    targetWords: number,
    projectKey: string
  ): Promise<boolean> {
    if (targetWords <= 0) return false;

    if (currentWords >= targetWords && !this.targetReachedAnnounced.has(projectKey)) {
      this.targetReachedAnnounced.add(projectKey);
      await this.showNotification({
        title: '🎯 Hedefe Ulaşıldı!',
        body: `Tebrikler! Belirlediğiniz ${targetWords.toLocaleString()} kelimelik hedefi tamamladınız (${currentWords.toLocaleString()} kelime).`,
      });
      return true;
    }

    if (currentWords < targetWords && this.targetReachedAnnounced.has(projectKey)) {
      // Hedefin altına düşerse veya hedef sıfırlanırsa kilidi kaldır
      this.targetReachedAnnounced.delete(projectKey);
    }

    return false;
  }

  static async notifySprintComplete(durationMinutes: number, wordsWritten: number): Promise<boolean> {
    return this.showNotification({
      title: '⏱️ Yazı Sprinti Tamamlandı!',
      body: `${durationMinutes} dakikalık yazı sprinti sona erdi. Toplam ${wordsWritten} kelime kaleme aldınız. Harika bir seanstı!`,
    });
  }

  static resetTargetAnnounced(projectKey?: string) {
    if (projectKey) {
      this.targetReachedAnnounced.delete(projectKey);
    } else {
      this.targetReachedAnnounced.clear();
    }
  }
}
