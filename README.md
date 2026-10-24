# OpenScriv

OpenScriv is a local-first desktop writing studio for long-form projects. It is built with Electron, React, TypeScript, and Vite.

## Start on Windows

Double-click `OpenScriv.bat`. It installs dependencies when needed, builds the app, and opens the Electron desktop window.

Requirements: Node.js 20 or newer.

## Commands

- `npm install` — Bağımlılıkları yükler.
- `npm run build` — `tsc --noEmit` typecheck + Vite üretim derlemesini yürütür.
- `npm run typecheck` — TypeScript tip denetimi (`tsc --noEmit`).
- `npm test` — 113 dosyalık 910+ Vitest test takımını çalıştırır.
- `npm run smoke` — Gerçek Electron masaüstü penceresini açıp DOM yüklenmesini doğrulayan otomatik smoke testi.
- `npm start` / `npm run electron:start` — Masaüstü uygulamasını yerel olarak başlatır (`OpenScriv.bat` da bu komutu çağırır).
- `npm run dist:win` — Üretim Windows NSIS kurulum paketini (`OpenScriv Setup 2.1.0.exe`) ve taşınabilir yürütücüyü (`OpenScriv 2.1.0.exe`) üretir.

## Mimari ve Güvenlik Güvenceleri

- **Tek Kanonik Proje Biçimi:** `.opscriv` paket dizini (`manifest.json`, `binder.json` ve `docs/*.md`). Windows dosya ilişkilendirmesi ve çift tıklama desteği mevcuttur.
- **Yol Kaçışı (Path Traversal) Koruması:** `assertPathWithinRoot` ve `sanitizeDocId` ile tüm dosya okuma/yazma işlemleri proje kök dizini altında hapsedilmiştir.
- **Preload Güvenliği:** Preload köprüsünde sıkı IPC kanal izin listesi (whitelist) uygulanmıştır ve Chromium `sandbox: true` kuralı devrededir.
- **%100 Çevrimdışı Çalışma:** Harici CDN bağımlılıkları (Font Awesome vb.) tamamen kaldırılmış, yerel SVG ikon motoru kullanılmıştır.
- **Doğrulanmış Dağıtım Çıktıları:** `release-builds/` altında NSIS Installer (`OpenScriv Setup 2.1.0.exe`) ve Portable EXE (`OpenScriv 2.1.0.exe`) mevcuttur.
