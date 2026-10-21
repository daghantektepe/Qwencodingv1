# OpenScriv v1.0.0 — Kullanıcı El Kitabı (User Manual)

Hoş geldiniz! **OpenScriv**, romancılar, senaristler, akademisyenler ve araştırmacılar için sıfır-veri-kaybı, yerel-öncelikli (local-first) ve askeri düzeyde şifrelenebilir profesyonel bir yazım stüdyosudur.

---

## 1. Çalışma Alanı ve Gezinme (The Binder)
- **Hiyerarşik Proje Ağacı:** Taslaklar, bölümler, sahneler ve araştırma materyalleri sürükle-bırak destekli hiyerarşik bir ağaç yapısında düzenlenir.
- **Sanal Ağaç (Virtual Binder Tree):** 1.000+ bölümlük devasa projelerde dahi 60 FPS akıcılıkta çalışır.
- **Akıllı Koleksiyonlar (Smart Collections):** Kelime sayısı, etiketler veya revizyon durumuna göre dinamik olarak güncellenen filtre klasörleri.

---

## 2. Ana Editör ve Tipografi
- **Daktilo Kaydırma (Typewriter Scrolling):** İmleç daima ekranın dikey merkezinde sabit kalır.
- **Odak Modu (Zen Focus Mode):** Yan panelleri gizler, dikkati dağıtmayan tam ekran yazım alanı sunar.
- **Canlı Metrikler:** Kelime sayısı, tahmini okuma süresi ve daktilo tuş ses efektleri.

---

## 3. Planlama ve Görselleştirme
- **Mantar Pano (Corkboard):** Her sahne için özet (synopsis) kartları, raptiyeler ve durum etiketleri.
- **Outliner (Çizelge):** Tablo görünümünde kelime hedefleri, karakter bakış açıları (POV) ve durum takibi.
- **Zaman Çizelgesi (Timeline):** Çoklu hikaye kurguları (plotlines), karakter aksiyonları ve kronolojik olay dizilimi.
- **Codex (Karakter & Mekan Bankası):** Karakter profilleri, mekan bilgileri ve editörde `@` ile etiketleme.

---

## 4. Araştırma ve Medya Kasası
- **Multi-Asset Binder:** PDF referansları, araştırma fotoğrafları ve ses kayıtları proje içinde saklanır.
- **Bölünmüş Ekran (Split Screen):** Bir tarafta yazarken diğer tarafta araştırma belgesi görüntülenebilir.

---

## 5. İnceleme, Revizyon ve İşbirliği
- **Görsel Metin Farkı (Document Diff):** Geçmiş snapshot'lar ile anlık metin arasındaki farkları satır içi ve yan yana inceleme, tek tıkla geri alma (selective rollback).
- **Yorumlar & Dipnotlar (Marginalia):** Editör kenarında yorum kartları, dipnotlar (footnotes) ve sonnotlar (endnotes).

---

## 6. Sıfır-Bilgi Güvenlik Kasası (AES-256 Vault)
- **Yerel Şifreleme:** Proje dosyaları AES-256-GCM ve PBKDF2 anahtar türetme ile şifrelenir.
- **Hareketsizlik Kilidi (Inactivity Auto-Lock):** Belirlenen süre boyunca işlem yapılmadığında ekran otomatik kilitlenir.

---

## 7. Genişletilebilirlik: Eklentiler & Özel Temalar
- **Plugin API:** Güvenli sandbox içinde çalışan eklenti mimarisi.
- **Özel Tema SDK:** `.osctheme` JSON dosyaları içe aktarılabilir ve anında uygulanabilir.

---

## 8. Derleme ve Dışa Aktarım (Compile Engine)
- Tek tıkla PDF, DOCX, Markdown, Düz Metin ve EPUB çıktıları oluşturulabilir.
- Ön kapak, içindekiler ve dipnotlar otomatik biçimlendirilir.
