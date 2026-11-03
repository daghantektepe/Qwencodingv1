import React, { useState } from 'react';
import { HelpCircle, X, Compass, Keyboard, Database, Info, ExternalLink, CheckCircle } from 'lucide-react';
import './HelpModal.css';

export interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWelcomeHub?: () => void;
}

export function HelpModal({ isOpen, onClose, onOpenWelcomeHub }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<'tour' | 'shortcuts' | 'storage' | 'about'>('tour');

  if (!isOpen) return null;

  const SHORTCUTS = [
    { key: 'Ctrl + Shift + P / F1', desc: 'Komut Paletini Aç (Tüm eylemler ve araçlar)' },
    { key: 'Ctrl + K', desc: 'Hızlı Proje İçi Arama ve Belgeye Atlama' },
    { key: 'F11 / Ctrl + Shift + F', desc: 'Odak Modu (Tam ekran Zen daktilo deneyimi)' },
    { key: 'Ctrl + Shift + N', desc: 'Hızlı Yüzen Not Defteri (Scratchpad)' },
    { key: 'Ctrl + S', desc: 'Şimdi Kaydet (Anında Atomik Flush)' },
    { key: 'Alt + S', desc: 'Mekanik Daktilo Tuş Seslerini Aç / Kapat' },
    { key: 'Ctrl + Alt + B', desc: 'Sol Panel: Binder Proje Ağacını Gizle / Göster' },
  ];

  return (
    <div className="help-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="help-modal-title">
      <div className="help-modal-card">
        {/* Header */}
        <div className="help-modal-header">
          <div className="help-header-title-group">
            <HelpCircle size={22} className="help-header-icon" />
            <div>
              <h2 id="help-modal-title" className="help-modal-title">OpenScriv Kullanıcı Rehberi & Destek</h2>
              <span className="help-modal-version">Sürüm 2.1.0 · Masaüstü Yazı Stüdyosu</span>
            </div>
          </div>
          <button type="button" className="help-modal-close" onClick={onClose} aria-label="Kapat">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="help-modal-tabs">
          <button
            type="button"
            className={`help-tab-btn ${activeTab === 'tour' ? 'active' : ''}`}
            onClick={() => setActiveTab('tour')}
          >
            <Compass size={16} /> Hızlı Başlangıç
          </button>
          <button
            type="button"
            className={`help-tab-btn ${activeTab === 'shortcuts' ? 'active' : ''}`}
            onClick={() => setActiveTab('shortcuts')}
          >
            <Keyboard size={16} /> Kısayollar
          </button>
          <button
            type="button"
            className={`help-tab-btn ${activeTab === 'storage' ? 'active' : ''}`}
            onClick={() => setActiveTab('storage')}
          >
            <Database size={16} /> Veri & Güvenlik
          </button>
          <button
            type="button"
            className={`help-tab-btn ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            <Info size={16} /> Hakkında
          </button>
        </div>

        {/* Tab Content */}
        <div className="help-modal-body">
          {/* TAB 1: TOUR */}
          {activeTab === 'tour' && (
            <div className="help-tour-content">
              <div className="tour-step-card">
                <div className="tour-step-num">1</div>
                <div className="tour-step-text">
                  <h4>Proje Yapısı & Binder</h4>
                  <p>Sol taraftaki <strong>Binder</strong> panelinde romanınızın taslağını (Bölümler ve Sahneler), karakter notlarınızı ve araştırma dosyalarınızı klasörleyin.</p>
                </div>
              </div>

              <div className="tour-step-card">
                <div className="tour-step-num">2</div>
                <div className="tour-step-text">
                  <h4>Yazım Editörü</h4>
                  <p>Orta paneldeki zengin metin editöründe dikkatiniz dağılmadan yazın. Daktilo kaydırma, canlı kelime sayacı ve mekanik tuş sesleri ile üretkenliğinizi artırın.</p>
                </div>
              </div>

              <div className="tour-step-card">
                <div className="tour-step-num">3</div>
                <div className="tour-step-text">
                  <h4>Planlama & Mantar Pano</h4>
                  <p>Üst çubuktan <strong>Planla & Araştır</strong> menüsüne tıklayarak Mantar Pano (Corkboard), Outliner tablosu, Zaman Çizelgesi ve Harita görünümlerine geçin.</p>
                </div>
              </div>

              <div className="tour-step-card">
                <div className="tour-step-num">4</div>
                <div className="tour-step-text">
                  <h4>Doğru Kayıt & Dışa Aktar</h4>
                  <p>Her kelimeniz yerel diskinize atomik olarak kaydedilir. Alt durum çubuğunda <em>Kaydedildi</em> onayını görebilirsiniz. İşiniz bittiğinde <strong>Derle</strong> ile PDF, EPUB veya Word çıktısı alın.</p>
                </div>
              </div>

              {onOpenWelcomeHub && (
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      onClose();
                      onOpenWelcomeHub();
                    }}
                  >
                    Başlangıç Ekranına (Welcome Hub) Dön
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SHORTCUTS */}
          {activeTab === 'shortcuts' && (
            <div className="help-shortcuts-table">
              {SHORTCUTS.map((s) => (
                <div key={s.key} className="shortcut-row">
                  <kbd className="shortcut-kbd">{s.key}</kbd>
                  <span className="shortcut-desc">{s.desc}</span>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: STORAGE */}
          {activeTab === 'storage' && (
            <div className="help-storage-content">
              <div className="storage-info-box">
                <h4><CheckCircle size={18} color="#2e6b3e" /> %100 Yerel ve Güvenli Veri Saklama</h4>
                <p>
                  OpenScriv, projelerinizi <code>.opscriv</code> uzantılı paket klasörlerinde saklar.
                  Tüm belgeleriniz açık formatta (Markdown ve JSON) tutulur; hiçbir bulut sunucusuna gönderilmez.
                </p>
              </div>

              <div className="storage-detail-item">
                <strong>Atomik Yazma Koruması (.tmp Rename):</strong>
                <p>Elektrik kesintisi veya ani çökme durumlarında veri kaybını önlemek için dosyalar önce geçici tampona yazılır, ardından milisaniyeler içinde atomik isim değiştirme ile kesinleştirilir.</p>
              </div>

              <div className="storage-detail-item">
                <strong>Yedekleme & Geri Yükleme (CrashGuard):</strong>
                <p>Uygulama çalışırken otomatik anlık görüntüler (Snapshots) ve yedekler alır. Üst çubuktan <em>Araçlar &gt; Yedekleme Masası</em> ile yedeklerinizi yönetebilirsiniz.</p>
              </div>
            </div>
          )}

          {/* TAB 4: ABOUT */}
          {activeTab === 'about' && (
            <div className="help-about-content">
              <h3>OpenScriv Masaüstü Yazı Stüdyosu</h3>
              <p>Yazarlar, romancılar ve senaristler için tasarlanmış bağımsız, hızlı ve açık masaüstü stüdyosu.</p>
              <div className="about-specs">
                <div><strong>Sürüm:</strong> 2.1.0 (Production Release)</div>
                <div><strong>Mimari:</strong> Electron 45, React 18, TypeScript, SQLite FTS5</div>
                <div><strong>Platform:</strong> Windows 10/11 x64</div>
                <div><strong>Lisans:</strong> MIT Açık Kaynak</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="help-modal-footer">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Anladım, Yazmaya Başla
          </button>
        </div>
      </div>
    </div>
  );
}

export default HelpModal;
