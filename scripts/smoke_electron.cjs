/**
 * Automated Electron Window Smoke Test
 * Real Desktop Window & DOM Lifecycle Verification
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function runSmokeTest() {
  console.log('[SMOKE] 1/3: Üretim derlemesi (dist/index.html) kontrol ediliyor...');
  const distHtml = path.resolve(__dirname, '../dist/index.html');
  if (!fs.existsSync(distHtml)) {
    console.error('[SMOKE HATA] dist/index.html bulunamadı! Lütfen önce "npm run build" çalıştırın.');
    process.exit(1);
  }

  console.log('[SMOKE] 2/3: Gerçek Electron süreci başlatılıyor...');
  const electronBin = process.platform === 'win32'
    ? path.resolve(__dirname, '../node_modules/.bin/electron.cmd')
    : path.resolve(__dirname, '../node_modules/.bin/electron');

  const appDir = path.resolve(__dirname, '..');
  const child = spawn(electronBin, ['.', '--smoke-test'], {
    cwd: appDir,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      ELECTRON_ENABLE_LOGGING: '1',
    },
  });

  const timeoutTimer = setTimeout(() => {
    console.error('[SMOKE HATA] Zaman aşımı (15s): Electron penceresi zamanında açılıp yanıt vermedi!');
    child.kill('SIGTERM');
    process.exit(1);
  }, 15000);

  child.on('close', (code) => {
    clearTimeout(timeoutTimer);
    if (code === 0) {
      console.log('[SMOKE] 3/3: TEBRİKLER! Gerçek Electron penceresi hatasız açıldı, DOM yüklendi ve temiz kapandı. (KOD: 0)');
      process.exit(0);
    } else {
      console.error(`[SMOKE HATA] Electron süreci başarısız çıkış koduyla bitti: ${code}`);
      process.exit(code || 1);
    }
  });

  child.on('error', (err) => {
    clearTimeout(timeoutTimer);
    console.error('[SMOKE HATA] Electron süreci başlatılamadı:', err);
    process.exit(1);
  });
}

runSmokeTest();
