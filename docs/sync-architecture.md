# OpenScriv Local-First Senkronizasyon Mimarisi (Phase 35)

## 1. Genel Bakış
OpenScriv, yazarların gizliliğini ve veri egemenliğini korumak amacıyla **Local-First (Önce Yerel)** mimari prensiplerine göre çalışır. Hiçbir harici bulut sunucusuna ihtiyaç duymadan, yerel ağ veya simüle edilmiş uçtan uca kanallar üzerinden çoklu cihaz senkronizasyonu sağlar.

## 2. Temel Bileşenler

### 2.1 CRDT Engine (`src/sync/crdt-engine.ts`)
- **Veri Modeli:** Conflict-free Replicated Data Types (CRDT).
- **Vektör Saatleri (Vector Clocks):** Her istemci kendi saat sayacını artırır. Çapraz cihaz değişikliklerinde nedensellik ilişkisi tespit edilir.
- **LWW (Last-Writer-Wins):** Zaman damgası ve leksikografik sıralama ile deterministik çatışma çözümü.

### 2.2 Çatışma Çözücü (`src/sync/conflict-resolver.ts`)
- İki istemci aynı belgeyi aynı anda değiştirdiğinde veri bozulması yaşanmaz.
- En son geçerli sürüm ve vektör saati birleşimi otomatik olarak hesaplanır.

### 2.3 Eş Durumu & İmleç Takibi (`src/sync/presence-tracker.ts`)
- Aktif yazarların imleç pozisyonlarını ve çevrimiçi durumlarını izler.
- Kalp atışı (heartbeat) zaman aşımı ile ayrılan istemcileri temizler.

### 2.4 Durum Göstergesi (`src/components/SyncStatusIndicator.tsx`)
- Kullanıcıya anlık senkronizasyon durumunu gösterir:
  - **Senkronize (Yeşil):** Tüm değişiklikler eşitlendi.
  - **Senkronize ediliyor (Mavi):** İletim sürüyor.
  - **Çevrimdışı Mod (Gri):** Değişiklikler yerel kuyrukta güvenle saklanıyor.
  - **Çatışma Çözüldü (Sarı):** Eşzamanlı değişiklik otomatik çözüldü.

## 3. Güvenlik ve Gizlilik
- Veriler yalnızca yerel diskte saklanır.
- Dışa veri sızıntısı veya telemetri bulunmaz.
