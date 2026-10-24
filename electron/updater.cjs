/**
 * Auto-Updater & SHA-256 Release Integrity Verification
 * Phase 112: Otomatik Güncelleyici (Auto-Updater) ve Sürüm Bütünlük Kontrolü
 */

const { ipcMain, app } = require('electron');
const crypto = require('crypto');

function compareSemver(current, latest) {
  const parse = (v) => String(v || '').replace(/^v/, '').split('.').map(Number);
  const [cMaj = 0, cMin = 0, cPat = 0] = parse(current);
  const [lMaj = 0, lMin = 0, lPat = 0] = parse(latest);

  if (lMaj > cMaj) return 1;
  if (lMaj < cMaj) return -1;
  if (lMin > cMin) return 1;
  if (lMin < cMin) return -1;
  if (lPat > cPat) return 1;
  if (lPat < cPat) return -1;
  return 0; // Same version
}

function verifySha256(dataBuffer, expectedHash) {
  if (!dataBuffer || !expectedHash) return false;
  const hash = crypto.createHash('sha256').update(dataBuffer).digest('hex').toLowerCase();
  return hash === expectedHash.trim().toLowerCase();
}

function registerUpdaterHandlers() {
  ipcMain.handle('updater:check', async (_evt, options = {}) => {
    const currentVersion = (app && typeof app.getVersion === 'function') ? app.getVersion() : '2.0.0';
    const targetVersion = options.simulateVersion || '2.1.0';

    const hasUpdate = compareSemver(currentVersion, targetVersion) > 0;

    return {
      hasUpdate,
      currentVersion,
      latestVersion: targetVersion,
      releaseNotes: '• Faz 101-120 Desktop Mastery tamamlandı.\n• SQLite FTS5 yüksek hızlı arama motoru.\n• Çerçevesiz özel başlık çubuğu.',
      downloadUrl: `https://github.com/daghantektepe/Qwencodingv1/releases/tag/v${targetVersion}`,
      sha256: 'mock_sha256_checksum',
    };
  });

  ipcMain.handle('updater:install-restart', () => {
    if (app && typeof app.quit === 'function') {
      app.quit();
    }
    return { ok: true };
  });
}

module.exports = {
  compareSemver,
  verifySha256,
  registerUpdaterHandlers,
};
