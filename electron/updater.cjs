/**
 * Auto-Updater & SHA-256 Release Integrity Verification
 * Phase 112: Otomatik Güncelleyici (Auto-Updater) ve Sürüm Bütünlük Kontrolü
 */

const { ipcMain, app } = require('electron');
const crypto = require('crypto');
const https = require('https');

function compareSemver(current, latest) {
  const parse = (v) => String(v || '').replace(/^v/, '').split('.').map((x) => parseInt(x, 10) || 0);
  const [cMaj = 0, cMin = 0, cPat = 0] = parse(current);
  const [lMaj = 0, lMin = 0, lPat = 0] = parse(latest);

  if (lMaj > cMaj) return 1;
  if (lMaj < cMaj) return -1;
  if (lMin > cMin) return 1;
  if (lMin < cMin) return -1;
  if (lPat > cPat) return 1;
  if (lPat < cPat) return -1;
  return 0; // Aynı sürüm
}

function verifySha256(dataBuffer, expectedHash) {
  if (!dataBuffer || !expectedHash) return false;
  const hash = crypto.createHash('sha256').update(dataBuffer).digest('hex').toLowerCase();
  return hash === expectedHash.trim().toLowerCase();
}

function computeBufferSha256(dataBuffer) {
  return crypto.createHash('sha256').update(dataBuffer).digest('hex').toLowerCase();
}

async function fetchLatestReleaseMetadata() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: '/repos/daghantektepe/Qwencodingv1/releases/latest',
      headers: {
        'User-Agent': 'OpenScriv-Desktop-App',
        Accept: 'application/vnd.github.v3+json',
      },
      timeout: 3000,
    };

    const req = https.get(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const data = JSON.parse(body);
            resolve({
              ok: true,
              version: data.tag_name ? data.tag_name.replace(/^v/, '') : null,
              releaseNotes: data.body || '',
              htmlUrl: data.html_url || '',
            });
          } else {
            resolve({ ok: false, error: `HTTP ${res.statusCode}` });
          }
        } catch (e) {
          resolve({ ok: false, error: e.message });
        }
      });
    });

    req.on('error', (err) => resolve({ ok: false, error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'Ağ zaman aşımı' });
    });
  });
}

function registerUpdaterHandlers() {
  if (!ipcMain || typeof ipcMain.handle !== 'function') return;

  ipcMain.handle('updater:check', async (_evt, options = {}) => {
    const currentVersion = (app && typeof app.getVersion === 'function') ? app.getVersion() : '2.1.0';

    // Test veya simülasyon argümanı varsa öncelikli kullan
    if (options.simulateVersion) {
      const targetVersion = options.simulateVersion;
      const hasUpdate = compareSemver(currentVersion, targetVersion) > 0;
      return {
        hasUpdate,
        currentVersion,
        latestVersion: targetVersion,
        releaseNotes: '• Faz 101-120 Desktop Mastery tamamlandı.\n• SQLite FTS5 yüksek hızlı arama motoru.\n• Çerçevesiz özel başlık çubuğu.',
        downloadUrl: `https://github.com/daghantektepe/Qwencodingv1/releases/tag/v${targetVersion}`,
        sha256: computeBufferSha256(Buffer.from(targetVersion)),
      };
    }

    // Gerçek GitHub Release kontrolü
    const releaseRes = await fetchLatestReleaseMetadata();
    if (releaseRes.ok && releaseRes.version) {
      const hasUpdate = compareSemver(currentVersion, releaseRes.version) > 0;
      return {
        hasUpdate,
        currentVersion,
        latestVersion: releaseRes.version,
        releaseNotes: releaseRes.releaseNotes,
        downloadUrl: releaseRes.htmlUrl,
        sha256: null,
      };
    }

    // Ağ erişimi yoksa veya yeni sürüm henüz çıkmadıysa mevcut sürümü bildir
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
      releaseNotes: 'Mevcut sürüm günceldir.',
      downloadUrl: '',
      sha256: null,
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
  computeBufferSha256,
  registerUpdaterHandlers,
};
