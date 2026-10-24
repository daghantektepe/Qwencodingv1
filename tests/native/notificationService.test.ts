import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NativeNotificationService } from '../../src/services/native/notificationService';
const { isNotificationSupported, showNativeNotification } = require('../../electron/notificationIpc.cjs');

describe('Phase 117: Native OS Notifications & Sprint Alarms', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete (window as any).electronBridge;
    NativeNotificationService.resetTargetAnnounced();
  });

  it('Backend notificationIpc destek kontrolünü ve bildirim fırlatmayı yönetir', () => {
    const supported = isNotificationSupported();
    expect(typeof supported).toBe('boolean');

    const res = showNativeNotification({ title: 'Test', body: 'Mesaj' });
    expect(res).toHaveProperty('ok');
  });

  it('Electron ortamında showNotification IPC üzerinden tetiklenir', async () => {
    const mockInvoke = vi.fn().mockResolvedValue({ ok: true, title: 'Başarı', body: 'Kaydedildi' });
    (window as any).electronBridge = {
      isDesktop: true,
      invoke: mockInvoke,
    };

    const success = await NativeNotificationService.showNotification({
      title: 'Başarı',
      body: 'Kaydedildi',
    });

    expect(success).toBe(true);
    expect(mockInvoke).toHaveBeenCalledWith('notification:show', {
      title: 'Başarı',
      body: 'Kaydedildi',
    });
  });

  it('Yazarlık kelime hedefine ulaşıldığında bildirim tetiklenir ve mükerrer bildirim engellenir', async () => {
    const showSpy = vi.spyOn(NativeNotificationService, 'showNotification').mockResolvedValue(true);

    // 1000 hedefli, 800 kelimede tetiklenmemeli
    let triggered = await NativeNotificationService.checkSprintWordTarget(800, 1000, 'proj_1');
    expect(triggered).toBe(false);
    expect(showSpy).not.toHaveBeenCalled();

    // 1050 kelimede tetiklenmeli
    triggered = await NativeNotificationService.checkSprintWordTarget(1050, 1000, 'proj_1');
    expect(triggered).toBe(true);
    expect(showSpy).toHaveBeenCalledTimes(1);
    expect(showSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '🎯 Hedefe Ulaşıldı!',
      })
    );

    // Tekrar 1060 kelime yazıldığında kilit devrede olduğu için tekrar tetiklenmemeli
    triggered = await NativeNotificationService.checkSprintWordTarget(1060, 1000, 'proj_1');
    expect(triggered).toBe(false);
    expect(showSpy).toHaveBeenCalledTimes(1);
  });

  it('Yazı sprinti tamamlandığında kutlama bildirimi fırlatılır', async () => {
    const showSpy = vi.spyOn(NativeNotificationService, 'showNotification').mockResolvedValue(true);

    await NativeNotificationService.notifySprintComplete(25, 650);

    expect(showSpy).toHaveBeenCalledWith({
      title: '⏱️ Yazı Sprinti Tamamlandı!',
      body: '25 dakikalık yazı sprinti sona erdi. Toplam 650 kelime kaleme aldınız. Harika bir seanstı!',
    });
  });
});
