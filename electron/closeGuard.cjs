/**
 * Kapanış koruması (CF-07): pencere kapanmadan önce renderer'dan bekleyen/süren
 * kaydı bitirmesini ister. Renderer 'app:close-ready' { ok } ile yanıt verir.
 *   ok: true            → pencere kapanır.
 *   ok: false / yanıt yok (timeoutMs) → kullanıcıya sorulur; "Açık kalsın" seçilirse kapanmaz.
 */

const pending = new Map(); // webContents.id -> resolve
let registeredOn = null;

function installCloseGuard(win, { ipcMain, dialog, timeoutMs = 10000 }) {
  if (registeredOn !== ipcMain) {
    registeredOn = ipcMain;
    ipcMain.handle('app:close-ready', (event, res) => {
      const resolve = pending.get(event.sender.id);
      if (resolve) resolve(res);
      return { ok: true };
    });
  }

  const wcId = win.webContents.id;
  let allowClose = false;
  let waiting = false;

  win.on('close', (event) => {
    if (allowClose) return;
    event.preventDefault();
    if (waiting) return;
    waiting = true;

    let timer;
    new Promise((resolve) => {
      pending.set(wcId, resolve);
      timer = setTimeout(() => resolve({ ok: false, error: 'Kayıt zamanında tamamlanmadı.' }), timeoutMs);
      win.webContents.send('app:before-close');
    })
      .then(async (res) => {
        clearTimeout(timer);
        pending.delete(wcId);
        if (win.isDestroyed()) return;
        if (res && res.ok) {
          allowClose = true;
          win.close();
          return;
        }
        const { response } = await dialog.showMessageBox(win, {
          type: 'warning',
          title: 'Kaydedilmemiş değişiklikler',
          message: 'Son değişiklikler kaydedilemedi. Yine de kapatılsın mı?',
          detail: (res && res.error) || '',
          buttons: ['Açık kalsın', 'Yine de kapat'],
          defaultId: 0,
          cancelId: 0,
        });
        if (response === 1 && !win.isDestroyed()) {
          allowClose = true;
          // destroy: renderer'ın beforeunload'u aynı soruyu ikinci kez sormasın.
          win.destroy();
        }
      })
      .finally(() => {
        waiting = false;
      });
  });
}

module.exports = { installCloseGuard };
