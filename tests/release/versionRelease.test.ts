import { describe, it, expect } from 'vitest';
import { APP_VERSION, TOTAL_PHASES, APP_CODENAME, OPEN_SCRIV_VERSION } from '../../src/version';
import fs from 'fs';
import path from 'path';

describe('Phase 120: Desktop Release v2.1 Verification', () => {
  it('Uygulama sürümü 2.1.0 ve faz sayısı 120 olarak mühürlenmiştir', () => {
    expect(APP_VERSION).toBe('2.1.0');
    expect(TOTAL_PHASES).toBe(120);
    expect(APP_CODENAME).toBe('Desktop Mastery');
    expect(OPEN_SCRIV_VERSION.version).toBe('2.1.0');
    expect(OPEN_SCRIV_VERSION.phase).toBe(120);
  });

  it('package.json sürümü 2.1.0 ve masaüstü dağıtım scriptleri tanımlıdır', () => {
    const pkgPath = path.resolve(__dirname, '../../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    expect(pkg.version).toBe('2.1.0');
    expect(pkg.main).toBe('electron/main.cjs');
    expect(pkg.scripts).toHaveProperty('dist:win');
    expect(pkg.scripts).toHaveProperty('dist:mac');
    expect(pkg.scripts).toHaveProperty('dist:linux');
  });

  it('electron-builder.yml yapılandırma dosyası .opscriv dosya ilişkisini içerir', () => {
    const builderPath = path.resolve(__dirname, '../../electron-builder.yml');
    const content = fs.readFileSync(builderPath, 'utf-8');

    expect(content).toContain('appId: com.openscriv.desktop');
    expect(content).toContain('productName: OpenScriv');
    expect(content).toContain('ext: opscriv');
    expect(content).toContain('target: nsis');
  });
});
