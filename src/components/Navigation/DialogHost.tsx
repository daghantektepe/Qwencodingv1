import React from 'react';
import { Wrench, X, Activity, PackageCheck, ShieldCheck, Moon, Zap, Book, Users, Tablet } from 'lucide-react';
// @ts-ignore
import Search from '../Search.jsx';
// @ts-ignore
import CompileDialog from '../CompileDialog.jsx';
// @ts-ignore
import FocusMode from '../FocusMode.jsx';
// @ts-ignore
import CommandPalette from '../CommandPalette.jsx';
// @ts-ignore
import ThemeCustomizer from '../ThemeCustomizer.jsx';
// @ts-ignore
import Scratchpad from '../Scratchpad.jsx';
import { ProjectHealthDashboard } from '../Audit/ProjectHealthDashboard.tsx';
import { BatchExportModal } from '../Publish/BatchExportModal.tsx';
import { BackupHistoryManager } from '../Backup/BackupHistoryManager.tsx';
import { NightFilterSettings } from '../Theme/NightFilterSettings.tsx';
import { SnippetManagerModal } from '../Snippets/SnippetManagerModal.tsx';
import { DictionaryLookupPopover } from '../Dictionary/DictionaryLookupPopover.tsx';
import { BetaReaderFeedbackView } from '../Feedback/BetaReaderFeedbackView.tsx';
import { WelcomeHub } from '../Project/WelcomeHub.tsx';
import { HelpModal } from '../Help/HelpModal.tsx';

export interface DialogHostProps {
  tree: any[];
  project: any;
  activeDoc: any;
  allDocuments: any[];
  commands: any[];
  theme: string;
  typography: any;
  scratchpadNotes: any[];
  touchModeEnabled: boolean;
  themeCards: any[];
  fontChoices: any[];
  lineHeightOptions: any[];
  fontSizeRange: any;
  
  // Modal visibility states
  searchOpen: boolean;
  onCloseSearch: () => void;
  onSelectDocById: (docId: string) => void;

  compileOpen: boolean;
  onCloseCompile: () => void;

  focusModeOpen: boolean;
  onCloseFocusMode: () => void;
  onContentChange: (content: string) => void;

  paletteOpen: boolean;
  onClosePalette: () => void;

  themeCustomizerOpen: boolean;
  onCloseThemeCustomizer: () => void;
  onThemeChange: (theme: string) => void;
  onTypographyChange: (typography: any) => void;

  scratchpadOpen: boolean;
  onCloseScratchpad: () => void;
  onUpdateNotes: (notes: any[]) => void;
  onSendToDraft: (noteId: string, content: string) => void;

  toolsDrawerOpen: boolean;
  onCloseToolsDrawer: () => void;
  onOpenHealthAudit: () => void;
  onOpenBatchExport: () => void;
  onOpenBackupManager: () => void;
  onOpenNightFilter: () => void;
  onOpenSnippets: () => void;
  onOpenDictionary: () => void;
  onOpenBetaFeedback: () => void;
  onToggleTouchMode: () => void;

  healthDashboardOpen: boolean;
  onCloseHealthDashboard: () => void;

  batchExportOpen: boolean;
  onCloseBatchExport: () => void;

  backupManagerOpen: boolean;
  onCloseBackupManager: () => void;
  onRestoreProject: (data: any) => void;

  nightFilterOpen: boolean;
  onCloseNightFilter: () => void;

  snippetsOpen: boolean;
  onCloseSnippets: () => void;

  dictionaryOpen: boolean;
  onCloseDictionary: () => void;
  onInsertSynonym: (syn: string) => void;

  betaFeedbackOpen: boolean;
  onCloseBetaFeedback: () => void;

  welcomeHubOpen: boolean;
  onCloseWelcomeHub: () => void;
  canCloseWelcomeHub: boolean;
  onOpenProjectPackage: (packagePath: string) => Promise<boolean>;
  onCreateNewProjectPackage: (name: string, parentDir: string, template: 'clean' | 'three-act') => Promise<boolean>;
  onLoadSampleProject: () => void;

  helpModalOpen: boolean;
  onCloseHelpModal: () => void;
  onOpenWelcomeHubFromHelp: () => void;
}

export function DialogHost({
  tree,
  project,
  activeDoc,
  allDocuments,
  commands,
  theme,
  typography,
  scratchpadNotes,
  touchModeEnabled,
  themeCards,
  fontChoices,
  lineHeightOptions,
  fontSizeRange,

  searchOpen,
  onCloseSearch,
  onSelectDocById,

  compileOpen,
  onCloseCompile,

  focusModeOpen,
  onCloseFocusMode,
  onContentChange,

  paletteOpen,
  onClosePalette,

  themeCustomizerOpen,
  onCloseThemeCustomizer,
  onThemeChange,
  onTypographyChange,

  scratchpadOpen,
  onCloseScratchpad,
  onUpdateNotes,
  onSendToDraft,

  toolsDrawerOpen,
  onCloseToolsDrawer,
  onOpenHealthAudit,
  onOpenBatchExport,
  onOpenBackupManager,
  onOpenNightFilter,
  onOpenSnippets,
  onOpenDictionary,
  onOpenBetaFeedback,
  onToggleTouchMode,

  healthDashboardOpen,
  onCloseHealthDashboard,

  batchExportOpen,
  onCloseBatchExport,

  backupManagerOpen,
  onCloseBackupManager,
  onRestoreProject,

  nightFilterOpen,
  onCloseNightFilter,

  snippetsOpen,
  onCloseSnippets,

  dictionaryOpen,
  onCloseDictionary,
  onInsertSynonym,

  betaFeedbackOpen,
  onCloseBetaFeedback,

  welcomeHubOpen,
  onCloseWelcomeHub,
  canCloseWelcomeHub,
  onOpenProjectPackage,
  onCreateNewProjectPackage,
  onLoadSampleProject,

  helpModalOpen,
  onCloseHelpModal,
  onOpenWelcomeHubFromHelp,
}: DialogHostProps) {
  return (
    <>
      {/* 1) Welcome Hub Onboarding Modal (Faz 2) */}
      <WelcomeHub
        isOpen={welcomeHubOpen}
        onClose={onCloseWelcomeHub}
        canClose={canCloseWelcomeHub}
        onOpenProject={onOpenProjectPackage}
        onCreateProject={onCreateNewProjectPackage}
        onLoadSampleProject={onLoadSampleProject}
        currentProjectName={project?.name}
      />

      {/* 2) Help & Quick Tour Modal (Faz 7) */}
      <HelpModal
        isOpen={helpModalOpen}
        onClose={onCloseHelpModal}
        onOpenWelcomeHub={onOpenWelcomeHubFromHelp}
      />

      {/* 3) Arama Diyaloğu */}
      {/* @ts-ignore */}
      <Search
        tree={tree as any}
        projectId={project?.id || 'default'}
        open={searchOpen}
        onClose={onCloseSearch}
        onSelectDoc={onSelectDocById}
      />

      {/* 4) Derleme Diyaloğu */}
      {/* @ts-ignore */}
      <CompileDialog
        open={compileOpen}
        tree={tree}
        projectId={project?.id || 'default'}
        projectName={project.name || 'OpenScriv Projesi'}
        onClose={onCloseCompile}
      />

      {/* 5) Odak Modu */}
      {/* @ts-ignore */}
      <FocusMode
        open={focusModeOpen}
        onClose={onCloseFocusMode}
        doc={activeDoc}
        onChange={onContentChange}
        onSaveNow={() => onContentChange(activeDoc?.content || '')}
      />

      {/* 6) Hızlı Komut Paleti */}
      <CommandPalette
        open={paletteOpen}
        onClose={onClosePalette}
        commands={commands}
      />

      {/* 7) Lüks Tema & Tipografi Özelleştirme */}
      <ThemeCustomizer
        open={themeCustomizerOpen}
        onClose={onCloseThemeCustomizer}
        themeName={theme}
        themes={themeCards}
        onThemeChange={onThemeChange}
        typography={typography}
        fontChoices={fontChoices}
        lineHeightOptions={lineHeightOptions}
        fontSizeRange={fontSizeRange}
        onTypographyChange={onTypographyChange}
      />

      {/* 8) Yüzen Not Defteri */}
      <Scratchpad
        open={scratchpadOpen}
        onClose={onCloseScratchpad}
        notes={scratchpadNotes}
        onChangeNotes={onUpdateNotes}
        activeDocId={activeDoc?.id || null}
        activeDocTitle={activeDoc?.title || null}
        onSendToDraft={onSendToDraft}
      />

      {/* 9) Stüdyo Araçları Çekmecesi */}
      {toolsDrawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-panel, #faf9f5)', width: '100%', maxWidth: '820px', maxHeight: '85vh', borderRadius: '12px', border: '1px solid var(--border, #d9d4c8)', boxShadow: 'var(--shadow-xl, 0 20px 40px rgba(0,0,0,0.25))', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', background: 'var(--bg-header, #ece8dd)', borderBottom: '1px solid var(--border, #d9d4c8)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wrench size={18} color="var(--accent, #7a6c4f)" />
                <strong style={{ fontSize: '16px' }}>OpenScriv Stüdyo Araçları & Modülleri</strong>
              </div>
              <button
                type="button"
                className="icon-button"
                style={{ width: '30px', height: '30px' }}
                onClick={onCloseToolsDrawer}
                aria-label="Kapat"
              >
                <X size={16} />
              </button>
            </div>
            
            <div style={{ padding: '20px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '14px' }}>
              <div
                onClick={onOpenHealthAudit}
                style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border, #d9d4c8)', background: 'var(--bg-elevated, #fff)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent, #7a6c4f)', fontWeight: 600 }}>
                  <Activity size={18} /> Sağlık Denetimi
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary, #6b6455)' }}>
                  Edilgen çatı, tempo dalgalanmaları, aşırı sıfat ve kopukluk denetimi.
                </p>
              </div>

              <div
                onClick={onOpenBatchExport}
                style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border, #d9d4c8)', background: 'var(--bg-elevated, #fff)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent, #7a6c4f)', fontWeight: 600 }}>
                  <PackageCheck size={18} /> Toplu Dağıtım Kiti
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary, #6b6455)' }}>
                  EPUB 3, PDF, DOCX, Markdown formatlarında tek tıkla toplu yayın arşivi.
                </p>
              </div>

              <div
                onClick={onOpenBackupManager}
                style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border, #d9d4c8)', background: 'var(--bg-elevated, #fff)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent, #7a6c4f)', fontWeight: 600 }}>
                  <ShieldCheck size={18} /> Yedekleme Geçmişi
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary, #6b6455)' }}>
                  Çoklu hedefe anlık şifreli proje yedekleme ve kurtarma yöneticisi.
                </p>
              </div>

              <div
                onClick={onOpenNightFilter}
                style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border, #d9d4c8)', background: 'var(--bg-elevated, #fff)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent, #7a6c4f)', fontWeight: 600 }}>
                  <Moon size={18} /> Gece & OLED Filtresi
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary, #6b6455)' }}>
                  Sirkadiyen amber, %100 saf OLED siyah ve mavi ışık filtreleri.
                </p>
              </div>

              <div
                onClick={onOpenSnippets}
                style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border, #d9d4c8)', background: 'var(--bg-elevated, #fff)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent, #7a6c4f)', fontWeight: 600 }}>
                  <Zap size={18} /> Metin Genişletici
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary, #6b6455)' }}>
                  Klavye makro kısayolları ve dinamik değişken genişleticiler.
                </p>
              </div>

              <div
                onClick={onOpenDictionary}
                style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border, #d9d4c8)', background: 'var(--bg-elevated, #fff)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent, #7a6c4f)', fontWeight: 600 }}>
                  <Book size={18} /> Çevrimdışı Sözlük
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary, #6b6455)' }}>
                  Türkçe/İngilizce eşanlamlılar, zıt anlamlılar ve kelime kökenleri.
                </p>
              </div>

              <div
                onClick={onOpenBetaFeedback}
                style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border, #d9d4c8)', background: 'var(--bg-elevated, #fff)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent, #7a6c4f)', fontWeight: 600 }}>
                  <Users size={18} /> Beta Okur Masası
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary, #6b6455)' }}>
                  Okur notları içe aktarma, split-diff ve satır içi onay/ret sistemi.
                </p>
              </div>

              <div
                onClick={onToggleTouchMode}
                style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border, #d9d4c8)', background: 'var(--bg-elevated, #fff)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent, #7a6c4f)', fontWeight: 600 }}>
                  <Tablet size={18} /> Tablet & Dokunmatik Modu
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary, #6b6455)' }}>
                  Geniş butonlar ve dokunmatik ekran optimizasyonu ({touchModeEnabled ? 'Şu an Aktif' : 'Şu an Pasif'}).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10) Proje Sağlık Denetimi Modal */}
      {healthDashboardOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'var(--bg-panel, #faf9f5)', width: '100%', maxWidth: '960px', maxHeight: '90vh', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)' }}>
            <ProjectHealthDashboard
              documents={allDocuments}
              onNavigateToDocument={(docId) => {
                onSelectDocById(docId);
                onCloseHealthDashboard();
              }}
              onClose={onCloseHealthDashboard}
            />
          </div>
        </div>
      )}

      {/* 11) Toplu Dağıtım Kiti Modal */}
      {batchExportOpen && (
        <BatchExportModal
          documents={allDocuments}
          projectName={project?.name || 'OpenScriv Projesi'}
          authorName="Yazar"
          onClose={onCloseBatchExport}
        />
      )}

      {/* 12) Yedekleme Geçmişi Modal */}
      {backupManagerOpen && (
        <BackupHistoryManager
          projectName={project?.name || 'OpenScriv Projesi'}
          getCurrentProjectData={() => ({ documents: allDocuments, tree })}
          onRestoreProject={onRestoreProject}
          onClose={onCloseBackupManager}
        />
      )}

      {/* 13) Gece / Amber / OLED Siyah Filtre Ayarları */}
      {nightFilterOpen && (
        <NightFilterSettings onClose={onCloseNightFilter} />
      )}

      {/* 14) Metin Genişletici Modal */}
      {snippetsOpen && (
        <SnippetManagerModal
          currentDocTitle={activeDoc?.title || 'Bölüm'}
          onClose={onCloseSnippets}
        />
      )}

      {/* 15) Çevrimdışı Sözlük Popover */}
      {dictionaryOpen && (
        <DictionaryLookupPopover
          initialWord="kurgu"
          onClose={onCloseDictionary}
          onSelectSynonym={onInsertSynonym}
        />
      )}

      {/* 16) Beta Okur Geri Bildirim Masası */}
      {betaFeedbackOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'var(--bg-panel, #faf9f5)', width: '100%', maxWidth: '960px', maxHeight: '90vh', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)', position: 'relative' }}>
            <div style={{ padding: '12px 16px', background: 'var(--bg-header, #ece8dd)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Beta Okur Geri Bildirim Masası (Faz 88)</span>
              <button
                type="button"
                className="icon-button"
                style={{ width: '28px', height: '28px' }}
                onClick={onCloseBetaFeedback}
              >
                ✕
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
              <BetaReaderFeedbackView
                currentDocumentId={activeDoc?.id}
                onSelectDocument={(docId) => {
                  onSelectDocById(docId);
                  onCloseBetaFeedback();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DialogHost;
