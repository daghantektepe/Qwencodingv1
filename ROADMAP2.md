# OpenScriv ROADMAP2 — Arayüz ve Windows sürümünü kullanıma hazır hale getirme

**Durum:** Uygulanacak plan  
**Denetim tarihi:** 24 Ekim 2026  
**Kapsam:** OpenScriv masaüstü uygulaması (`workspace/scrivener`)  
**Hedef:** Yeni kullanıcıya ne işe yaradığını ilk bakışta anlatan, yazmaya başlamayı kolaylaştıran, kayıt durumunu doğru gösteren ve Windows EXE paketinde gerçekten çalışan bir ürün.

Bu belgeyi uygulayan ajan, işleri sırayla tamamlamalı; her aşamayı kod, test ve mümkün olduğunda gerçek Windows uygulama görüntüsüyle doğrulamalıdır. Yalnızca arayüzün derlenmesi yeterli değildir: kullanıcı akışı uçtan uca çalışmalı ve veriler yeniden açıldığında korunmalıdır.

## 1. Mevcut durum ve kanıtlar

### Önceki roadmap maddelerinin durumu

| Madde | Durum | Kanıt / kalan iş |
|---|---|---|
| Windows başlatma yolu | Büyük ölçüde tamamlandı | `OpenScriv.bat` build edip Electron başlatıyor. Üst seviye `baslat.bat` bunu çağırıyor; menü açıklaması hâlâ `npm run dev` diyor. |
| Windows EXE paketleme | Kısmen tamamlandı | NSIS ve portable hedefleri, ikonlar ve `release-builds` çıktıları mevcut. EXE'lerin kurulumdan sonra açıldığı ve kaydettiği kanıtlanmış değil. |
| Windows CI | Kısmen tamamlandı | Windows/Linux matrix build ve test yapıyor; Windows smoke ve paketleme var. Paketlenmiş uygulamayı başlatıp gerçek proje akışını doğrulamıyor. `npm install` yerine `npm ci` kullanılmalı. |
| Electron smoke | Eksik/güvenilmez | `npm run smoke` bu denetimde Windows AppContainer erişim hatasıyla kapandı. Betik `shell: true` kullanıyor ve yalnızca sıfır çıkış kodunu başarı sayıyor; DOM'un doğrulandığını kanıtlamıyor. |
| IPC/yol güvenliği | Kısmen tamamlandı | `.opscriv` modülünde `sanitizeDocId` ve `assertPathWithinRoot` var. Symlink/junction, bozuk paket, payload sınırları ve tüm proje akışları için uçtan uca kanıt yok. |
| Çevrimdışı UI | README'de tamamlandı deniyor | EXE'de çevrimdışı açılış ve ağ isteği kontrolü bu denetimde doğrulanamadı. |

### Bu denetimde çalıştırılan doğrulamalar

- `npm run build`: **başarılı** (`tsc --noEmit` ve Vite; 1.428 modül).
- `npm test`: **başarılı**, 113 test dosyası ve 910 test. jsdom `window.open` ve gezinme için “Not implemented” uyarıları verdi; test sonucu başarısız olmadı.
- `npm run smoke`: **başarısız**. Electron Windows AppContainer süreci `node_modules/electron/dist` ACL erişimi nedeniyle açılamadı (kod `2147483651`). Smoke başlatıcısı `shell: true` için Node `DEP0190` uyarısı da verdi.
- NSIS kurucusu (~121,7 MB) ve portable EXE (~110,7 MB) mevcut. Denetim sırasında `dist` yeniden build edildi; var olan EXE'lerin güncel kaynakla aynı commit'ten üretildiği doğrulanmadı. Yeniden üretilene kadar bu EXE'leri güncel sürüm saymayın.
- Bu oturumda gerçek GUI tarayıcı/ekran yakalama olanağı yoktu. Yerleşim, taşma, kontrast ve etkileşim görsel olarak onaylanmış değil; uygulayan ajan gerçek Windows penceresinde doğrulamalı.

### Ürün ve arayüz bulguları

- `src/App.tsx` yaklaşık 1.096 satırlık tek orkestrasyon bileşeni; proje state'i, belge seçimi, altı görünüm, kısayollar, paneller ve modal'lar aynı yerde. Bu yapı ana görevleri ve sorumluluk sınırlarını belirsizleştiriyor.
- Editörün yanında Binder, Inspector, sekmeler, çok sayıda görünüm, Araçlar ve komut girişi bulunuyor. Komut paleti/araç çekmecesi de geniş özellik listesini tek yerde gösteriyor; “ilk ne yapmalıyım?” cevabı zayıf.
- `editor`, `corkboard`, `outliner`, `timeline`, `codex`, `map` aynı seviyede sunuluyor. Yazma işi ile planlama/araştırma ayrışmıyor; etiketlerde Türkçe ve İngilizce karışık.
- Başlangıç ağacı ve `OpenScriv Projesi` adı koddan geliyor; örnek karakter/not içerikleri de var. Yeni/var olan proje, son projeye dönme ve örnek projeyi ayırt etme için tek ve sade başlangıç akışı görünmüyor.
- `handlePersist`, `saveProjectTree` cevabını beklemeden `lastSavedAt` güncelliyor. Kayıt hata verse de başarılı izlenimi doğabilir. `useAutosave` hatayı konsola yazıp kullanıcıya göstermeden yutuyor.
- Başlatma yolları çoğalmış: `baslat.bat`, `OpenScriv.bat`, güncel `workspace/scrivener` ve eski `projects/projects/scrivener` kopyası. Kanonik kaynak ve ürün giriş yolu açık olmalı.

## 2. Ürün yönü

OpenScriv'in ana işi uzun metin projesi yazmak, bölümleri düzenlemek ve dışa aktarmaktır. Arayüz şu sırayı görünür kılmalı:

1. **Projeyi aç veya oluştur:** Son projeye devam etme ilk seçenek olsun.
2. **Yapıyı kur:** Bölüm ve belgeleri Binder'da oluşturup sırala.
3. **Yaz ve düzenle:** Editör ana çalışma alanı olsun; dikkat dağıtan modüller ikincil kalsın.
4. **Planla ve araştır:** Corkboard, outliner, timeline, codex ve map gerektiğinde açılsın.
5. **Dışa aktar:** Anlaşılır biçim ve durum mesajlarıyla çıktı üret.

Çalışan akışa bağlı olmayan buton tamamlanmış özellik gibi sunulmamalı. Eksik yetenek gizlenmeli veya ana akışı bozmadan açıkça hazır değil olarak işaretlenmeli. Özellikleri kaldırmadan önce kullanımını ve veri uyumluluğunu araştır; öncelikle yerleşim ve hiyerarşiyi sadeleştir.

## 3. Uygulama kuralları

1. Önce `AGENTS.md`, README, paketleme/CI ve testleri incele. Kod keşfinde codebase-memory grafiğini kullan (`search_graph`, `trace_path`, `get_code_snippet`, `query_graph`, `search_code`); eskiyse indeksi güncelle.
2. Kanonik kökün `workspace/scrivener` olduğunu doğrula. Eski kopyayı veya launcher'ı değiştirmeden önce kullanıcı verisi ve yönlendirme ihtiyacını belirle. `.opscriv` ve mevcut projeleri koru.
3. Önce akış taslağı/kabul ölçütü çıkar, sonra küçük UI dilimleri uygula. `App.tsx`'i tek seferde yeniden yazma.
4. Her eylemin UI → renderer state → preload IPC → main → kalıcı veri yolunu izle. Sahte başarı veya yalnızca geçici state kullanma.
5. Davranış değiştiren her dilim için test ekle/güncelle. Renderer, IPC ve paketlenmiş Windows uygulamasını doğrula; testleri yeşil göstermek için gevşetme.
6. Gerçek Windows penceresinde en az 1280×800 ve 1920×1080 ekran görüntüsü al; %100/%150/%200 ölçeklemeyi gözden geçir. Görsel kontrol bitmeden arayüz fazını kapatma.
7. Her faz sonunda değişen dosyaları, kararları, komutları ve sonuçları bu belgede işaretle. Büyük format/bağımlılık değişikliğinde geçiş ve geri alma stratejisi yaz.

## 4. Fazlar ve kabul ölçütleri

### Faz 0 — Kanonik ürün ve başlangıç noktası

- [ ] Kaynak, geliştirme, dağıtım girişlerini ve eski kopyaları belgeleyin.
- [ ] `baslat.bat` ürün menüsünü gerçek davranışa göre düzeltin; tek kanonik uygulamayı başlatsın. `npm run dev` açıklamasını kaldırın veya doğru anlatın.
- [ ] `OpenScriv.bat` ilk kurulum, build hatası, eksik Node/npm ve Electron başlatma hatalarını anlaşılır göstersin. Kilitli kurulum (`npm ci`) ve ağ gereksinimini netleştirin.
- [ ] Eski `projects/projects/scrivener` kopyasını inceleyin; kullanıcı verisi olabilecek dizini sessizce silmeyin. Gerekirse eski launcher'ı kanonik ürüne yönlendirin.
- [ ] README geliştirme, yerel çalıştırma, EXE kullanma ve test adımlarını ayırsın.

**Kabul:** Kullanıcı tek, doğru etiketli girişten uygulamayı açar; güncel kaynak yeri belirsiz değildir; eski proje verileri korunur.

### Faz 1 — Bilgi mimarisi ve sade ana kabuk

- [ ] Editörü birincil iş yapın; açılışta altı görünüm ve bütün araçları aynı seviyede göstermeyin.
- [ ] Navigasyonu üç anlaşılır alana indirgeyin: **Yaz**, **Planla/Araştır**, **Dışa aktar** (ürün dili incelemesiyle adlar netleştirilebilir).
- [ ] Editör/Binder/Inspector düzeninde Binder ve Inspector'ı aç/kapatın; varsayılanları anlaşılır yapın ve kullanıcının düzen tercihini saklayın.
- [ ] Corkboard ve Outliner'ı planlama altında gruplayın; Timeline, Codex, Map'i uygun proje/belge bağlamında açın. Boş/çalışmayan görünümü sunmayın.
- [ ] Araçlar, komut paleti, ses, not defteri, Focus, split ve istatistikleri sıklığa göre düzenleyin. Ana çubukta günlük işler; diğerleri menü/komut paletinde olsun.
- [ ] `App.tsx` sorumluluklarını kabuk, workspace, toolbar/navigation ve dialog host bileşenlerine ayırın. Modal'ları dev koşullu render bloğuna eklemeyin.
- [ ] Türkçe yerelleştirmeyi tutarlılaştırın. İngilizce ürün terimi kalacaksa Türkçe karşılık ve yazım biçimini belirleyin.

**Kabul:** Yeni kullanıcı nerede yazacağını, belgeyi nereden seçip nasıl dışa aktaracağını yardımsız bulur. Günlük yazma eylemleri kolay erişilir; gelişmiş araçlar içeriği bastırmaz.

### Faz 2 — Açılış, yeni proje ve son projeler

- [ ] Tek başlangıç ekranında **Devam et**, **Proje aç**, **Yeni proje**, gerekirse **Örnek projeyi dene** akışlarını tasarlayın.
- [ ] Yeni proje formunda ad, konum ve varsayılan belge ağacını açıklayın. Demo metnini boş projeye katmayın.
- [ ] Son projeleri gerçek metadata'dan kurun; taşınmış/silinmiş/bozuk projeleri anlaşılır ele alın.
- [ ] `.opscriv` çift tıklama, dosya seçici ve uygulama içi açma aynı yükleme servisini kullansın. Windows ikinci instance davranışını doğrulayın.
- [ ] Proje yüklenmeden demo ağacını gerçek proje gibi göstermeyin. Boş/yükleniyor/hata/örnek durumlarını ayırın.
- [ ] Kapatma veya proje değiştirmede bekleyen kayıtları tamamlayın; başarısız kayıtta yeniden deneme veya güvenli çıkış sunun.

**Kabul:** Proje oluştur → kaydet → kapat → tekrar aç → içeriği doğrula akışı Windows'ta geçer. Mevcut `.opscriv` açılır ve demo veri kullanıcının projesini ezmez.

### Faz 3 — Doğru kayıt durumu ve hata kurtarma

- [ ] Tek kayıt sözleşmesi oluşturun: `dirty`, `saving`, `saved`, `error` (gerekirse `offline`). `lastSavedAt` yalnız IPC `{ok:true}` sonrasında güncellensin.
- [ ] Autosave ve Binder/ağaç kaydını aynı proje oturumuna bağlayın. Hata gizlenmesin; hata, tekrar dene ve kaydedilmemiş içerik görünür olsun.
- [ ] Hızlı ardışık değişiklikte eski yazmanın yeniyi ezmediğini; atomik yazma ve kapanış flush davranışını test edin.
- [ ] Status bar son başarılı kaydı ve kelime sayısını göstersin. “Kaydedildi” kalıcı diske yazılmış anlamına gelsin.
- [ ] Büyük belgede debounce/kayıt gecikmesini ölçün; yazma sırasında UI donmasın.
- [ ] Varsayılan `default` project ID'nin gerçek proje kimliğiyle eşleşmesini uçtan uca kanıtlayın.

**Kabul:** Enjekte edilmiş kayıt hatasında yanlış “Kaydedildi” görünmez; yeniden deneme veriyi kaydeder; uygulama tekrar açıldığında veri vardır.

### Faz 4 — Görsel sistem, erişilebilirlik ve pencere uyumu

- [ ] Renk, tipografi, boşluk, kenarlık, odak, gölge, katman, menü/modal boyutları için tasarım tokenları kurun ve temaları bunlara bağlayın.
- [ ] Kalıcı görünen kontrol sayısını azaltın. İkon-only düğmelere tooltip ve erişilebilir isim verin; aynı eylem aynı ad/simge kullansın.
- [ ] Uzun Türkçe etiket, panel daraltma, boş liste, büyük Binder, dar pencere ve modal taşmasını çözün.
- [ ] Klavye akışı, görünür focus, `Escape`, modal focus trap, ARIA dialog/menü semantiği ve ekran okuyucu isimlerini doğrulayın.
- [ ] WCAG 2.2 AA kontrastını tema ve durum renklerinde ölçün; kayıt/hata anlamı yalnız renkle iletilmesin.
- [ ] %100/%150/%200 Windows ölçeği, yüksek kontrast, açık/koyu tema ve reduced motion davranışını gerçek uygulamada kontrol edin.
- [ ] Önce/sonra ekran görüntülerini karşılaştırın; her temel görünüm için görsel kabul notu bırakın.

**Kabul:** 1280×800 ve 1920×1080 kullanılabilir; %200 ölçekte önemli eylem kaybolmaz; klavyeyle proje açma, yazma, kaydetme, gezinme ve export yapılır.

### Faz 5 — Özellik envanteri ve tam yığın bağlantısı

- [ ] Her kullanıcı eylemi için ekran/eylem → React handler → preload/IPC → main service → kalıcı veri → test envanteri çıkarın.
- [ ] Boş handler, sessiz catch, sadece demo state değiştiren kontrol, çalışmayan import/export, placeholder ve durum göstermeden kapanan modal'ları bulun.
- [ ] Her eylemi tamamlayıp test edin, ana akıştan kaldırın veya dürüstçe devre dışı gösterin. Görünürde başarılı ama veri üretmeyen akış bırakmayın.
- [ ] `.opscriv` checksum/manifest, Binder-belge eşlemesi, eksik/bozuk belge, Unicode/boşluklu Windows yolu, izin hatası ve büyük proje senaryolarını test edin.
- [ ] Proje oluştur/aç/kaydet/yeniden aç, belge ekle/yeniden adlandır/sil/sırala, backup/snapshot ve export entegrasyon testleri kurun.
- [ ] Dosya IPC'sinde sender doğrulama, payload şeması/boyutu, root sınırı, symlink/junction ve atomik yazmayı gözden geçirin. Sanitization isimleri sessizce çakıştırmamalı.
- [ ] Renderer IPC sonucu `ok/error` sözleşmesini izlesin; opsiyonel main process başlatma hataları uygun log ve kullanıcı geri bildirimi alsın.

**Kabul:** Her görünür eylemin çalışan backend karşılığı veya dürüst devre dışı durumu var; kritik proje akışı IPC üzerinden gerçek diskte doğrulanır.

### Faz 6 — Windows üretim paketi ve CI

- [ ] Temiz Windows runner/VM'de kilitli kurulum, build, birim/entegrasyon ve smoke çalıştırın. CI'da `npm ci` kullanın; Node/Electron sürümlerini uyumlu aralıkta sabitleyin.
- [ ] Smoke'u `shell: true` olmadan çalıştırın; pencere oluşumu, `did-finish-load`, renderer hataları ve beklenen DOM işaretini doğrulayın. Timeout'ta tanı logu alın.
- [ ] Smoke yalnız kaynak Electron'u değil, üretilmiş paketi başlatsın. AppContainer ACL sorunu temiz runner'da sürerse sebebi güvenli biçimde çözün; güvenliği geniş ve kalıcı gevşetmeyin.
- [ ] NSIS'i temiz Windows hesabına kurun; kısayolu açın, proje oluşturup belge kaydedin, kapatıp açın, export edin; uninstall/upgrade kontrolü yapın.
- [ ] Portable EXE'yi kurulum yapılmamış hesapta başlatın; veri konumu, backup, kapanış ve tekrar açma davranışını doğrulayın.
- [ ] `.opscriv` ilişkilendirme/çift tıklama ve uygulama zaten açıkken açmayı; Türkçe karakterli, boşluklu ve uzun yollu klasörlerde test edin.
- [ ] CI artifact'ına sürüm, commit SHA, build zamanı ve hash manifesti ekleyin. EXE ile kaynak build'in aynı commit olduğunu kanıtlayın; eski `release-builds` çıktısını kanıt saymayın.
- [ ] Kod imzalama/SmartScreen deneyimini araştırın. Sertifika yoksa bloklayıcıyı yazın; imzasız geliştirme EXE'sini resmi imzalı sürüm gibi tanıtmayın.

**Kabul:** Temiz Windows'ta NSIS ve portable açılır; proje create/open/save/reopen/export akışı geçer. CI paket gerçek çalışmadıkça sürümü yeşil işaretlemez.

### Faz 7 — Son kullanıcıya hazır teslim ve destek

- [ ] İlk açılışta atlanabilir kısa rehber: proje seçme, Binder, yazı alanı, doğru kayıt göstergesi ve dışa aktarma.
- [ ] Sürüm/uyumluluk, veri ve yedek konumu, logları açma ve sorun bildirme bilgilerini Yardım'a koyun.
- [ ] Destek tanılama verisi hikâye içeriğini varsayılan olarak toplamamalı; kullanıcı verisini koruyun.
- [ ] Updater varsa gerçek manifest, doğrulama, hata/geri alma ve kullanıcı kontrolünü test edin. Çalışmayan updater UI'sını yayınlamayın.
- [ ] Türkçe, temiz profil ve mevcut profil kabul senaryolarını yürütün; bilinen sorunları sürüm notuna ekleyin.

**Kabul:** Yeni kullanıcı 5 dakikada proje açıp yazmaya ve başarılı kaydı görmeye başlar; mevcut proje güvenle açılır, export edilir ve yardım bulunur.

## 5. Zorunlu son doğrulama

- [ ] `npm ci`
- [ ] `npm run build`
- [ ] `npm test` (113 dosya/910 test tabanını koru ve yeni işlev testleri ekle)
- [ ] Gerçek UI/renderer akış testi
- [ ] Electron kaynak smoke ve üretilen NSIS/portable EXE testi
- [ ] Temiz Windows profilinde create/open/save/reopen/export
- [ ] Offline başlangıç ve CDN/ağ isteği kontrolü
- [ ] 1280×800, 1920×1080 ve %100/%150/%200 görsel inceleme
- [ ] Klavye ve erişilebilirlik kontrolü
- [ ] `git diff --check`, temiz build artifacts ve kaynak/EXE commit eşleşmesi
- [ ] README, ilk açılış metni ve sürüm notları güncel

## 6. Bitti tanımı

Tüm P0 maddeler ve kabul ölçütleri sağlanınca roadmap tamamlanır. Son rapor değişen dosyaları, çözülen kullanıcı sorunlarını, ertelenen/gizlenen özellikleri, doğrulanan komut ve sonuçları, Windows runner/VM kanıtını, EXE sürüm/hash bilgisini ve bilinen sınırlamaları içermelidir. Unit testlerin geçmesi, geliştirme penceresinin açılması veya EXE'nin klasörde bulunması tek başına “Windows ready-to-go” demek değildir.
