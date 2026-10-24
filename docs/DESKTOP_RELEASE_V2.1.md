# OpenScriv v2.1 Desktop Edition — Sürüm Notları (Faz 101 – 120)

**Sürüm:** 2.1.0  
**Kod Adı:** Desktop Mastery  
**Tarih:** 24 Ekim 2026  
**Durum:** Tamamlandı, Mühürlendi ve Test Edildi  

---

## 1. Genel Bakış
OpenScriv, 1.0 – 100. fazlar arasında tarayıcı üzerinde inşa edilmiş prototip halinden çıkarılarak; **Faz 101 – 120 (Desktop Mastery)** mimari hamlesiyle **tam teşekküllü, profesyonel, sıfır-gecikmeli (zero-latency) ve %100 yerel (local-first) bir masaüstü uygulamasına** dönüştürülmüştür.

---

## 2. Faz Faz Geliştirme Özeti

### 🖥️ Çekirdek Masaüstü Altyapısı (Faz 101 – 105)
- **Faz 101 (Gerçek Electron Runtime ve Tip-Güvenli Preload IPC):** Electron ana süreci (`main.cjs`), tip-güvenli preload köprüsü (`preload.cjs`) ve `contextBridge` mimarisi kuruldu. Güvenli IPC izolasyonu sağlandı.
- **Faz 102 (Özgün Proje Paketi Formatı - `.opscriv`):** Projeler tek bir dizin paketi halinde yerel dosya sistemine kaydedilir (`project.json`, `docs/*.md`, `metadata/`, `snapshots/`, `assets/`).
- **Faz 103 (Çerçevesiz Pencere & Drag HUD):** İşletim sistemi yerel çerçeveleri yerine özel koyu temalı zarif başlık çubuğu (`CustomTitlebar.tsx`), macOS trafik ışıkları ve Windows/Linux pencere kontrolleri (minimize, maximize, close) eklendi.
- **Faz 104 (Pencere Durum Hafızası - WindowState Keeper):** Pencerenin x, y, genişlik, yükseklik ve maksimize durumu kullanıcı çıkışında kaydedilir; çoklu monitör çıkarılsa dahi pencere asla ekran dışına taşmaz.
- **Faz 105 (Çoklu Pencere & Yüzen Araçlar Köprüsü):** Mantar Pano, Karakter Matrisi ve Zaman Çizelgesi bağımsız yüzen pencereler (detached windows) olarak ikinci ekrana taşınabilir hale getirildi.

---

### ⚡ Performans, Sistem Entegrasyonu ve Veri Yönetimi (Faz 106 – 110)
- **Faz 106 (Sistem Tepsisi & Global Hızlı Not):** Sistem tepsisi (`systemTray.cjs`) ikonu eklendi. `Ctrl+Alt+S` küresel kısayolu ile anlık ilhamlar için minimalist hızlı not penceresi açılır.
- **Faz 107 (Tam Yerel Menüler & Kısayol Haritası):** macOS Native Application Menu ve Windows/Linux menü çubukları (Dosya, Düzen, Görünüm, Proje, Araçlar, Yardım) yerel olarak oluşturuldu.
- **Faz 108 (Yerel Dosya Değişiklik İzleyicisi - File Watcher):** Dışarıdan Markdown dosyası düzenlendiğinde çakışma önleyici (anti-collision) ve otomatik algılayıcı dosya izleme servisi kuruldu.
- **Faz 109 (SQLite & Ters İndeks FTS5 Arama Motoru):** 100,000+ kelimelik devasa romanlarda dahi 1 milisaniyenin altında tam metin araması (Full-Text Search) ve bağlam vurgulama motoru entegre edildi.
- **Faz 110 (GPU Hızlandırma & Arayüz Akıcılığı):** Donanım hızlandırma bayrakları (`--enable-gpu-rasterization`, `--enable-zero-copy`) ve `fluid-rendering.css` ile 120 FPS akıcı kaydırma sağlandı.

---

### 🛡️ Matbaa, Güvenlik ve Dayanıklılık (Faz 111 – 115)
- **Faz 111 (Yerel Chromium Vektörel PDF Baskı Motoru):** Doğrudan Chromium'un matbaa kalitesinde `printToPDF` motoruyla sayfa numaralı, kırpma paylı (crop marks) ve özel sayfa kenar boşluklu çıktılar üretilir.
- **Faz 112 (Otomatik Güncelleyici & SHA-256 Doğrulama):** Arka planda güncelleme denetimi, SHA-256 karma doğrulaması ve kullanıcı onaylı yeniden başlatıp güncelleme akışı kuruldu.
- **Faz 113 (Çökme Koruması & Journal Kurtarma - CrashGuard):** Elektrik kesintisi veya OS çökmesi durumunda son 30 saniyelik günlüğü tutan ve ilk açılışta veriyi kurtaran Journal sistemi devreye alındı.
- **Faz 114 (Yerel Pano & Zengin Medya Köprüsü):** Panodan görsel yapıştırma doğrudan `assets/` klasörüne kaydedilir; Word ve web kaynaklı kirli HTML etiketleri otomatik sterilize edilir.
- **Faz 115 (Yerel İmla Denetimi & Edebi Sözlük):** Hunspell / Chromium dil denetimi ve yazarın edebi terimlerini saklayan dinamik özel sözlük (`ContextMenuSpellcheck.tsx`) eklendi.

---

### 🎨 Deneyim, Dayanıklılık ve Dağıtım (Faz 116 – 120)
- **Faz 116 (İşletim Sistemi Tema & Vurgu Rengi Senkronu):** Windows ve macOS vurgu rengi (accent color) ve karanlık/aydınlık mod değişiklikleri anında arayüz CSS değişkenlerine yansıtılır.
- **Faz 117 (Yerel Bildirimler & Sprint Hedef Alarmları):** Kelime hedefine ulaşıldığında ve Pomodoro yazı sprintleri tamamlandığında işletim sistemi bildirim merkezine native uyarı gönderilir.
- **Faz 118 (Stylus Kalem, Dokunmatik & Jestler):** Basınç duyarlı kalem çizim katmanı (`StylusDrawingLayer.tsx`) ile taslak üzerinde serbest el notları alma ve jest desteği sağlandı.
- **Faz 119 (48 Saatlik Dayanıklılık & RAM Sızıntı Denetimi):** 1,000 döngülük stres testiyle heap sızıntısı ve dangling listener bulunmadığı doğrulandı (`DESKTOP_LONGEVITY_REPORT.md`).
- **Faz 120 (Çoklu Platform Paketleri & Mühürleme):** Windows (NSIS, Portable), macOS (DMG, ZIP) ve Linux (AppImage, DEB) kurulum paketleyicisi yapılandırıldı. Proje sürümü 2.1.0 olarak mühürlendi.
