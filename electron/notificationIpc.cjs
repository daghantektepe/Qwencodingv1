/**
 * Native OS Notifications Bridge
 * Phase 117: Yerel İşletim Sistemi Bildirimleri ve Yazarlık Alarmı
 */

let electron = {};
try {
  const req = require('electron');
  if (req && typeof req === 'object') {
    electron = req;
  }
} catch {
  electron = {};
}

const { Notification, ipcMain } = electron;

function isNotificationSupported() {
  if (Notification && typeof Notification.isSupported === 'function') {
    return Notification.isSupported();
  }
  return Boolean(Notification);
}

function showNativeNotification(options = {}) {
  const { title = 'OpenScriv', body = '', silent = false } = options;

  if (!isNotificationSupported()) {
    return { ok: false, error: 'İşletim sistemi bildirimi desteklenmiyor' };
  }

  try {
    const notif = new Notification({
      title,
      body,
      silent,
    });

    notif.show();
    return { ok: true, title, body };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function registerNotificationIpcHandlers() {
  if (ipcMain && typeof ipcMain.handle === 'function') {
    ipcMain.handle('notification:show', (_evt, options) => {
      return showNativeNotification(options);
    });

    ipcMain.handle('notification:is-supported', () => {
      return isNotificationSupported();
    });
  }
}

module.exports = {
  isNotificationSupported,
  showNativeNotification,
  registerNotificationIpcHandlers,
};
