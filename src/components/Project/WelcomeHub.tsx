import React, { useState, useEffect } from 'react';
import { Folder, FolderPlus, Play, BookOpen, Clock, X, Check, AlertCircle, FileText } from 'lucide-react';
import { NativeProjectStore } from '../../services/native/nativeProjectStore';
import { RecentProjectsService, RecentProject } from '../../services/recentProjects';
import './WelcomeHub.css';

export interface WelcomeHubProps {
  isOpen: boolean;
  onClose: () => void;
  canClose: boolean; // if false, cannot close without opening or creating a project
  onOpenProject: (packagePath: string) => Promise<boolean>;
  onCreateProject: (name: string, parentDir: string, template: 'clean' | 'three-act') => Promise<boolean>;
  onLoadSampleProject: () => void;
  currentProjectName?: string;
}

export function WelcomeHub({
  isOpen,
  onClose,
  canClose,
  onOpenProject,
  onCreateProject,
  onLoadSampleProject,
  currentProjectName,
}: WelcomeHubProps) {
  const [recentList, setRecentList] = useState<RecentProject[]>([]);
  const [activeTab, setActiveTab] = useState<'recent' | 'new' | 'open'>('recent');
  
  // New Project Form State
  const [newProjectName, setNewProjectName] = useState('Yeni Romanım');
  const [selectedParentDir, setSelectedParentDir] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<'clean' | 'three-act'>('clean');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const recents = RecentProjectsService.getRecent();
      setRecentList(recents);
      setErrorMessage(null);
      // If there are no recent projects, default to 'new' tab
      if (recents.length === 0) {
        setActiveTab('new');
      } else {
        setActiveTab('recent');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const latestProject = recentList[0] || null;

  const handlePickDirectory = async () => {
    try {
      const picked = await NativeProjectStore.pickDirectory({
        title: 'Yeni Projenin Kaydedileceği Üst Klasörü Seçin',
        buttonLabel: 'Bu Klasöre Kaydet',
      });
      if (picked) {
        setSelectedParentDir(picked);
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Dizin seçilemedi');
    }
  };

  const handleBrowseAndOpenPackage = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const picked = await NativeProjectStore.pickDirectory({
        title: 'OpenScriv Proje Paketini (.opscriv) Seçin',
        buttonLabel: 'Projeyi Aç',
      });
      if (picked) {
        const ok = await onOpenProject(picked);
        if (ok) {
          RecentProjectsService.add({ path: picked, name: picked.split(/[\\/]/).pop()?.replace(/\.opscriv$/, '') || 'Proje' });
          onClose();
        } else {
          setErrorMessage('Seçilen proje paketi açılamadı. Lütfen geçerli bir .opscriv dizini olduğundan emin olun.');
        }
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Proje açma hatası');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNewProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      setErrorMessage('Lütfen proje adı girin.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const parentDir = selectedParentDir || 'C:/Users/Default/Documents/OpenScrivProjects';
      const ok = await onCreateProject(newProjectName.trim(), parentDir, selectedTemplate);
      if (ok) {
        onClose();
      } else {
        setErrorMessage('Yeni proje oluşturulamadı.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Proje oluşturma sırasında hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenRecent = async (proj: RecentProject) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const ok = await onOpenProject(proj.path);
      if (ok) {
        RecentProjectsService.add(proj);
        onClose();
      } else {
        setErrorMessage(`"${proj.name}" projesi bulunamadı veya taşınmış. Listeden kaldırabilirsiniz.`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Proje açılırken hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveRecent = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    const updated = RecentProjectsService.remove(path);
    setRecentList(updated);
  };

  return (
    <div className="welcome-hub-overlay" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="welcome-hub-card">
        {/* Header */}
        <div className="welcome-hub-header">
          <div className="welcome-hub-brand">
            <div className="welcome-hub-icon">
              <FileText size={28} />
            </div>
            <div>
              <h2 id="welcome-title" className="welcome-hub-title">OpenScriv</h2>
              <p className="welcome-hub-subtitle">Masaüstü Roman & Uzun Metin Yazı Stüdyosu v2.1.0</p>
            </div>
          </div>
          {canClose && (
            <button
              type="button"
              className="welcome-hub-close"
              onClick={onClose}
              aria-label="Kapat"
              title="Mevcut Çalışmaya Dön"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="welcome-hub-alert" role="alert">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="welcome-hub-tabs">
          <button
            type="button"
            className={`welcome-hub-tab ${activeTab === 'recent' ? 'active' : ''}`}
            onClick={() => setActiveTab('recent')}
          >
            <Clock size={16} /> Son Projeler
          </button>
          <button
            type="button"
            className={`welcome-hub-tab ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => setActiveTab('new')}
          >
            <FolderPlus size={16} /> Yeni Proje
          </button>
          <button
            type="button"
            className={`welcome-hub-tab ${activeTab === 'open' ? 'active' : ''}`}
            onClick={() => setActiveTab('open')}
          >
            <Folder size={16} /> Proje Aç (.opscriv)
          </button>
        </div>

        {/* Tab Content */}
        <div className="welcome-hub-body">
          {/* TAB 1: RECENT PROJECTS */}
          {activeTab === 'recent' && (
            <div className="welcome-hub-section">
              {latestProject && (
                <div className="welcome-hub-hero-card" onClick={() => handleOpenRecent(latestProject)}>
                  <div className="hero-card-badge">Son Çalışılan Proje</div>
                  <h3 className="hero-card-title">{latestProject.name}</h3>
                  <div className="hero-card-path">{latestProject.path}</div>
                  <button
                    type="button"
                    className="hero-card-action-btn"
                    disabled={isSubmitting}
                  >
                    <Play size={16} fill="currentColor" /> Projeye Devam Et
                  </button>
                </div>
              )}

              <div className="recent-projects-container">
                <h4 className="section-label">Geçmiş Projeler</h4>
                {recentList.length === 0 ? (
                  <div className="recent-empty-state">
                    Henüz kayıtlı proje bulunmuyor. Yeni bir proje oluşturun veya var olan bir .opscriv dosyasını açın.
                  </div>
                ) : (
                  <ul className="recent-projects-list">
                    {recentList.map((proj) => (
                      <li
                        key={proj.path}
                        className="recent-project-item"
                        onClick={() => handleOpenRecent(proj)}
                      >
                        <div className="recent-item-icon">
                          <Folder size={18} />
                        </div>
                        <div className="recent-item-info">
                          <div className="recent-item-name">{proj.name}</div>
                          <div className="recent-item-path" title={proj.path}>{proj.path}</div>
                        </div>
                        <button
                          type="button"
                          className="recent-item-remove"
                          title="Listeden Kaldır"
                          onClick={(e) => handleRemoveRecent(e, proj.path)}
                        >
                          <X size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: NEW PROJECT */}
          {activeTab === 'new' && (
            <form className="welcome-hub-form" onSubmit={handleCreateNewProject}>
              <div className="form-group">
                <label htmlFor="new-proj-name" className="form-label">Proje Adı</label>
                <input
                  id="new-proj-name"
                  type="text"
                  className="form-input"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Örn: Kuzey Masalı"
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-proj-dir" className="form-label">Kaydedileceği Dizin</label>
                <div className="input-group">
                  <input
                    id="new-proj-dir"
                    type="text"
                    className="form-input"
                    value={selectedParentDir || 'Varsayılan Belgeler Klasörü'}
                    readOnly
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handlePickDirectory}
                  >
                    Gözat...
                  </button>
                </div>
                <small className="form-hint">
                  {newProjectName.trim() ? `${newProjectName.trim()}.opscriv paketi bu klasörde oluşturulacak.` : ''}
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Başlangıç Şablonu</label>
                <div className="template-options">
                  <label className={`template-card ${selectedTemplate === 'clean' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="template"
                      value="clean"
                      checked={selectedTemplate === 'clean'}
                      onChange={() => setSelectedTemplate('clean')}
                    />
                    <div>
                      <strong>Temiz Taslak (Tavsiye Edilen)</strong>
                      <p>Rastgele demo metinler içermez; sadece Taslak klasörü, Bölüm 1 ve Notlar içerir.</p>
                    </div>
                  </label>
                  <label className={`template-card ${selectedTemplate === 'three-act' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="template"
                      value="three-act"
                      checked={selectedTemplate === 'three-act'}
                      onChange={() => setSelectedTemplate('three-act')}
                    />
                    <div>
                      <strong>Üç Perdeli Roman Yapısı</strong>
                      <p>Giriş, Gelişme ve Sonuç perdeleri klasörlenmiş hazır roman omurgası.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || !newProjectName.trim()}
                >
                  <FolderPlus size={16} /> Projeyi Oluştur ve Başla
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: OPEN EXISTING / DEMO */}
          {activeTab === 'open' && (
            <div className="welcome-hub-open-pane">
              <div className="open-choice-card">
                <div className="choice-icon">
                  <Folder size={24} />
                </div>
                <div>
                  <h4>Yerel .opscriv Projesi Aç</h4>
                  <p>Bilgisayarınızda kayıtlı mevcut bir OpenScriv proje paketini seçin.</p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleBrowseAndOpenPackage}
                  disabled={isSubmitting}
                >
                  Paket Klasörü Seç...
                </button>
              </div>

              <div className="open-choice-card sample-choice">
                <div className="choice-icon sample-icon">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h4>Örnek Roman Taslağını Keşfet</h4>
                  <p>Uygulamanın mantar panosunu, zaman çizelgesini ve özelliklerini tanımak için demo taslağı inceleyin.</p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    onLoadSampleProject();
                    onClose();
                  }}
                >
                  Örnek Projeyi Yükle
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="welcome-hub-footer">
          <span>Tüm verileriniz yerel bilgisayarınızda atomik olarak korunur. Bulut zorunluluğu yoktur.</span>
        </div>
      </div>
    </div>
  );
}

export default WelcomeHub;
