# OpenScriv ROADMAP3 — Veri güvenliği, uygulama içi güncelleme ve sadeleştirme

**Durum:** Uygulanacak plan
**Denetim tarihi:** 7 Kasım 2026, `main` @ `d6b6e79` (v2.1.0)
**Yöntem:** Beş açıdan (temel akışlar, arayüz özellikleri, paketleme/güncelleme, güvenlik, kod sağlığı) kod okuması. Her bulgu ikinci, bağımsız bir incelemeyle kodun kendisinden doğrulandı: 72 bulgunun 70'i doğrulandı, 2'si çürütüldü. Bulgu kimlikleri (`CF-01` gibi) denetim kaydına atıftır; aynı sorunu farklı açılardan gösteren bulgular birleştirildi.
**Önceki planlar:** ROADMAP2'deki Faz 1–3'ün büyük kısmı `main`'de tamamlandı (açılış ekranı, kayıt sözleşmesi, smoke testleri). Kalan maddeleri bu belge devralır.

## 0. Şu anki durum — özet

**Çalışıyor:** Proje oluşturma, belge yazma, otomatik kayıt, kapatıp yeniden açma ve Markdown/HTML/TXT dışa aktarma. Bu akış gerçek pencerede uçtan uca doğrulandı. Derleme temiz; 117 test dosyası ve 921 testin hepsi geçiyor. Paketlenmiş EXE açılıyor.

**Sorunlu:** Ana akışın dışındaki birçok kontrol ya çalışmıyor ya da veri kaybettiriyor. Kod tabanının yaklaşık üçte ikisi uygulamadan erişilemiyor. Uygulama içi güncelleme şu an yalnızca bir görüntü: Gerçekte indirme veya kurulum yapmıyor.

**Kullanıcı için geçici uyarı (Faz 0 bitene kadar):**
- `Ctrl+Alt+S` kısayolunu ve sistem tepsisindeki "Hızlı Not Al" seçeneğini kullanma. Bunlar projenin eski bir kopyasını yeni çalışmanın üzerine yazabiliyor (`CF-01`).
- Uygulamayı aynı anda iki kez açma (`CF-02`).
- Sürüm geri yükleme, paragraf geri alma ve eş anlamlı ekleme belgedeki tüm biçimlendirmeyi siliyor (`CF-05`).
- "Yedekleme Geçmişi"ne güvenme. Gerçek bir dosya yedeği almıyor ve geri yükleme başka bir projeyi yükleyebiliyor (`CF-06`).

## 1. İlkeler

1. **Önce veri güvenliği, sonra güncelleme altyapısı, sonra özellikler.** Güncelleme altyapısı erken gelmeli; sonraki tüm düzeltmeler kullanıcıya uygulama içinden ulaşsın.
2. **Görünüp çalışmayan kontrol bırakmamak.** Her kontrol ya gerçekten çalışmalı ya da gizlenmeli.
3. **Her düzeltmede bir test olmalı.** Davranışı doğrulayan bir test eklenir. Kullanıcı akışına dokunan değişiklikler gerçek pencerede, CDP ile sürülen bir e2e testiyle doğrulanır.
4. **Küçük ve sürümlenmiş adımlar.** Her faz bir sürüm (tag) olarak yayımlanır.

## 2. Fazlar

### Faz 0 — Acil veri güvenliği (v2.1.1, elle kurulum)

| # | İş | Bulgu | Kabul ölçütü |
|---|---|---|---|
| 0.1 | Hızlı not penceresi tam uygulamayı yüklemesin. `#quick-note` durumunda yalnızca `QuickNotePopup` çizilsin, proje açılmasın ve kaydedilmesin. | CF-01 | Hızlı not açıkken ana pencerede yazılanlar kaybolmuyor (e2e). |
| 0.2 | Tek örnek kilidi: `requestSingleInstanceLock()` eklenecek. İkinci açılışta mevcut pencere öne gelecek ve argv'deki `.opscriv` yolu ona iletilecek. | CF-02, PU-7 | İkinci kez açmak yeni süreç başlatmıyor. |
| 0.3 | Ana pencere kapanınca hızlı not penceresi yok edilsin. Tepsideki "Aç" ana pencereyi bulsun ya da yeniden oluştursun. | CF-03 | Pencere kapatılınca süreç bitiyor; tepsiden yeniden açılabiliyor. |
| 0.4 | Sürüm, paragraf geri alma, karalama defteri ve eş anlamlı işlemleri HTML'i korusun. Sürümler `contentHtml` saklasın. | CF-05, UI-13 | Biçimli belgeyi geri yükleyince biçim kalıyor (test). |
| 0.5 | "Yedekleme Geçmişi" localStorage'dan çıkarılsın. Yedek, projenin `.opscriv` paketinin diske kopyası olsun, proje kimliğine göre filtrelensin ve geri yüklemeden önce otomatik yedek alınsın. Hazır olana kadar menüden gizlensin. | CF-06, UI-04, CH-05 | Başka projenin yedeği listede görünmüyor; yazma hatası kullanıcıya gösteriliyor. |
| 0.6 | Bilgi panelindeki durum, hedef, özet, etiket ve not değişiklikleri kaydedilsin. | UI-01 | Belge değiştirip geri dönünce değerler korunuyor (test). |
| 0.7 | Kapanışta ve proje değiştirirken bekleyen kayıt tamamlansın; kayıt başarısızsa kullanıcıya sorulsun. | CF-07, CF-08 | Kayıt sürerken kapatma kaybettirmiyor. |
| 0.8 | Gezinme korunsun: Pencereye bırakılan dosya veya link uygulamanın yerine geçmesin (`will-navigate`, `setWindowOpenHandler`). | SEC-1 | Bırakılan HTML dosyası açılmıyor. |
| 0.9 | Yol güvenliği: Sürüm ve yedek `timestamp` değeri yalnızca rakam olsun. `assertPathWithinRoot`, renderer'dan gelen yolu değil, kullanıcının seçtiği paket yollarını kök kabul etsin. | SEC-2, SEC-3 | Kötü niyetli IPC çağrıları reddediliyor (test). |

**Faz 0 durumu (7 Kasım 2026): 9 maddenin 9'u tamamlandı** (`main` @ `e484958`). İş üç dalda yapıldı, her dal bağımsız bir incelemeden geçti ve engelleyici bulgu çıkmadı.

- **Testler:** 124 dosya, 959 test (+38 yeni). Yeni testlerin büyük çoğunluğunun eski kodda başarısız olduğu doğrulandı; eski sürüm biçimiyle geriye dönük uyumluluğu ölçen birkaç test eski kodda da geçiyor.
- **Gerçek pencerede doğrulanan senaryolar:**
  - İkinci kez açma mevcut pencereyi öne getiriyor.
  - Hızlı not karalama defterine düşüyor; proje dosyaları değişmiyor.
  - `file://` adresine gitmek ve `window.open` engelleniyor.
  - Bilgi panelindeki özet belge değiştirince korunuyor ve `binder.json`'a yazılıyor.
  - Kapatmadan hemen önce yazılan metin diske kaydediliyor ve uygulama tamamen kapanıyor.
- **Gerçek pencerede denenmedi; yalnızca birim testleriyle kapsanıyor:** Sürüm geri yüklemede biçimin korunması (0.4).

**İncelemeden çıkan takip işleri** (engelleyici değil):
- Paragraf geri alındığında, değişen blok düz metin olarak geri geliyor. Eş anlamlı kelime imlecin olduğu yere değil, belgenin sonuna ekleniyor. (Faz 2)
- Bilgi panelindeki metin yalnızca alandan çıkınca (blur) kaydediliyor. Belge klavyeyle değiştirilirse yazılan metin kaybolabilir. Hedef alanının adı iki yerde farklı (`wordTarget` / `targetWords`, UI-08). Durum anahtarları da tutarsız (`idea` ↔ `Taslak`). (Faz 2)
- `read-package`, içinde `manifest.json` bulunan her klasörü izin listesine alıyor; manifest'in OpenScriv'e ait olduğu (`generator`) kontrol edilmeli. Ayrılmış pencereler (`window:open-detached`) hâlâ tam uygulamayı yüklüyor. (Faz 2)
- Hızlı not, ana pencere yokken kaydedilemezse metni sessizce siliyor. macOS'ta `Cmd+Q` iki adımda kapanıyor. (düşük öncelik)

### Faz 1 — Gerçek uygulama içi güncelleme (v2.2.0)

**Hedef:** Uygulama açılışta ve menüden yeni sürümü denetlesin, kullanıcı onayıyla indirsin, indirme ilerlemesini gerçek olarak göstersin ve yeniden başlatınca kursun.

1. `electron-updater`'ı `dependencies`'e ekle (PU-2).
2. `electron-builder.yml`'de `publish: null` yerine şunu yaz: `publish: { provider: github, owner: daghantektepe, repo: Qwencodingv1, releaseType: release }` (PU-1). Böylece derleme `app-update.yml`, `latest.yml` ve blockmap üretir.
3. `electron/updater.cjs`'i yeniden yaz (PU-5, PU-11):
   - `autoUpdater` kullanılacak, `autoDownload = false`.
   - Kanallar: `updater:check`, `updater:download`, `updater:install-restart` (`quitAndInstall`).
   - `update-available`, `download-progress`, `update-downloaded` ve `error` olayları renderer'a iletilecek.
   - `simulateVersion` ve sabit `'2.1.0'` kaldırılacak.
4. Preload izin listesine `updater:download` ve `updater:event` eklenecek. `UpdateNotificationModal` gerçek olaylarla bağlanacak; sahte `setInterval` kaldırılacak.
5. Menüye "Güncellemeleri denetle" eklenecek. Açılıştan yaklaşık 10 saniye sonra sessiz bir denetim yapılacak.
6. **Taşınabilir EXE kendini güncelleyemez** (PU-4). Taşınabilir sürümde (`PORTABLE_EXECUTABLE_DIR`) güncelleme yalnızca indirme sayfasını açacak. Asıl dağıtım NSIS kurulumu olacak; kurulum masaüstü kısayolunu zaten oluşturuyor.
7. `.github/workflows/release.yml` (PU-3):
   - `v*` tag'i push edilince `windows-latest` üzerinde çalışacak: `npm ci`, derleme, testler, smoke ve `electron-builder --win --publish always` (`GH_TOKEN`).
   - Tag ile `package.json` sürümünün eşleştiği doğrulanacak.
   - Release taslak olarak kalmayacak; `electron-updater` taslakları görmez.
8. Sürüm akışı: `npm version patch|minor` ve ardından `git push --follow-tags`. Testlerdeki sabit sürüm değerleri ve kullanılmayan `src/version.ts` kaldırılacak (PU-10, CH-11).
9. **Geçiş adımı:** Şu anki 2.1.0'da güncelleyici yok. v2.2.0 bir kez elle kurulacak; sonraki sürümler uygulama içinden gelecek.
10. **Kod imzalama** (PU-6): İmzasız kurulum her ilk kurulumda SmartScreen uyarısı veriyor; güncelleme yine çalışıyor. Seçenekler: Azure Trusted Signing (aylık ücretli) ya da OV sertifika ve `win.publisherName`. Karar kullanıcıya ait.

**Kabul:**
- v2.2.0 NSIS ile kurulur.
- `v2.2.1` tag'i atılır ve release otomatik oluşur.
- Kurulu uygulama güncellemeyi bulur, indirir, yeniden başlayınca 2.2.1 olarak açılır ve proje verisi korunur.

### Faz 2 — Bozuk ve yanıltıcı özellikleri düzeltmek ya da gizlemek (v2.3.x)

| İş | Bulgu |
|---|---|
| Proje ağacında yeniden adlandırma, silme (onaylı, çöp kutusuna) ve sürükle-bırak bağlansın. | CF-04, UI-05 |
| Yeni belge seçili klasöre eklensin ve otomatik açılsın. Klasörlere de belge eklenebilsin. | CF-10, UI-15 |
| Menü: 29 öğenin 24'ü çalışmıyor. Ya bağlansın ya kaldırılsın. `Ctrl+N` yeni belge oluştursun, kısayol ipuçları gerçek olsun. | CF-09, UI-06, UI-07, CH-02 |
| Tailwind derlemeye bağlansın (ya da bileşenler uygulamanın kendi CSS'ine taşınsın). Zaman, Evren, Harita ve araç pencereleri düzgün çizilsin; araç pencereleri gerçek bir overlay içinde açılsın. | UI-02, UI-03, CH-03 |
| Çift pencere çerçevesi: Ya yerel ya özel başlık çubuğu kalsın. | UI-19, CH-10 |
| Kelime hedefi tek alan adıyla çalışsın ve "bugün" gerçekten bugünün kelime sayısını göstersin. | UI-08 |
| Yakınlaştırma çubuğu, daktilo sesleri, zaman çizelgesine olay ekleme: Çalıştırılsın ya da kaldırılsın. | UI-09, UI-10, UI-11 |
| Toplu dışa aktarma sahte `.zip` üretiyor: Gerçek dosya üretene kadar gizlensin. | UI-12, CH-04 |
| Ana hat görünümünün hiyerarşisi ve hücre düzenleme; bölünmüş görünümde boş sol panel. | UI-14, UI-18 |
| Metin genişletici, çevrimdışı sözlük ve harita demo verisi: "Deneysel" diye işaretlensin ya da gizlensin. | UI-17, UI-20 |
| Sürüm silme onay istesin. Kayıt hatasından sonra otomatik yeniden deneme yapılsın. | UI-21, CF-15 |
| `.opscriv` çift tıklama: Paket bir klasör olduğu için dosya ilişkilendirmesi çalışmıyor. Klasör için "OpenScriv ile aç" komutu eklensin ve argv okunsun, ya da yanıltıcı ilişkilendirme kaldırılsın. | CF-12, PU-8 |
| Renderer çökerse kurtarma ekranı gösterilip yeniden yüklensin. | CF-11 |

### Faz 3 — Proje verisini pakete toplamak (v2.4.0)

- Karakterler, zaman çizelgesi, haritalar, karalama defteri, beta okuyucu notları ve sürümler şu an localStorage'da ya da paketin dışında duruyor. Hepsi `.opscriv` paketinin içine taşınacak (UI-16, CF-13). Proje taşınınca veya yedeklenince hepsi birlikte gitmeli.
- Eski localStorage verisi için bir kerelik geçiş: Önce yedek alınacak, sonra veri taşınacak; geri alma notu yazılacak.
- Atomik yazma `.tmp` dosyalarını temizlesin; Windows'taki `EPERM` hatasında yeniden denesin (CF-14).
- Yeni projeler eski tek-proje verisini varsayılan olarak içe aktarmasın (CF-16). Eski IPC kanalları kaldırılsın (CF-17).

### Faz 4 — Sadeleştirme (v2.5.0)

- **Erişilemeyen kod:** 245 kaynak modülün 167'si (yaklaşık 30 bin satır) uygulamadan erişilemiyor; 117 test dosyasının 76'sı bu kodları test ediyor (CH-06). Her özellik için karar verilecek: bağlanacak ya da testleriyle birlikte silinecek. Önce kopya implementasyonlardan başlanacak (CH-08).
- **IPC:** 57 handler'ın 39'u hiç çağrılmıyor; preload izin listesi handler'larla uyuşmuyor (CH-07, SEC-5). Kullanılmayanlar silinecek; köprü tek bir global olacak (CH-15).
- **Bağımlılıklar:** 13 bağımlılık kullanılmıyor; `@supabase/supabase-js`, `jspdf` ve `jszip` bunlara dahil (CH-09).
- **Testler:** Hiçbir şey doğrulamayan totoloji testleri düzeltilecek (CH-12).
- **Kod yapısı:** 1.541 satırlık `App.tsx` kabuk, çalışma alanı ve diyaloglar olarak bölünecek (CH-14). Görünümler `lazy()` ile yüklenecek; 744 KB'lık tek parça küçülecek (CH-13).
- **Pencereler:** PDF yazdırma ve ayrılmış pencereler `sandbox: true` ile açılacak (SEC-7).

### Faz 5 — Sürekli doğrulama

- CI'da gerçek pencerede çalışan e2e testleri olacak: Oluştur → yaz → kaydet → kapat → aç → dışa aktar. Bu oturumda CDP ile elle yapılan akış otomatikleştirilecek.
- Smoke testi sadece `win-unpacked` klasörünü değil, gerçekten dağıtılan NSIS kurulumunu da test edecek: sessiz kurulum, açılış, kaldırma (PU-9).
- Her release'te önceki sürümden güncelleme testi yapılacak.
- ROADMAP2'den kalanlar: %100, %150 ve %200 ölçekte ve 1280×800 ile 1920×1080 çözünürlükte görsel kontrol; klavye ve erişilebilirlik kontrolü.

## 3. Çürütülen bulgular (kayıt için)

- SEC-4 (CSP, araştırma görüntüleyicisini engelliyor) ve SEC-6 (preload `on()` olay nesnesini sızdırıyor): Doğrulayıcı koddan teyit edemedi; plana alınmadı.

## 4. Bitti tanımı

- Faz 0'daki veri kaybı senaryolarının her biri için başarısız olan ve sonra düzelen bir test var.
- Kurulu uygulama bir sonraki sürüme uygulama içinden güncelleniyor ve veri korunuyor.
- Arayüzde, çalışmayan hiçbir kontrol görünür değil.
- Her fazın sonunda bu belge işaretleniyor; sürüm notları yazılıyor.
