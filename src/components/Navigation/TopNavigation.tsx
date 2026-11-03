import React, { useState, useRef, useEffect } from 'react';
import {
  Edit3,
  LayoutGrid,
  List,
  Clock,
  BookOpen,
  Map,
  ChevronDown,
  Download,
  Maximize2,
  Command,
  Volume2,
  VolumeX,
  StickyNote,
  Columns,
  Wrench,
  HelpCircle,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Palette,
} from 'lucide-react';
import './TopNavigation.css';

export type ViewMode = 'editor' | 'corkboard' | 'outliner' | 'timeline' | 'codex' | 'map';

export interface TopNavigationProps {
  projectName: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  binderVisible: boolean;
  onToggleBinder: () => void;
  inspectorVisible: boolean;
  onToggleInspector: () => void;
  onOpenWelcomeHub: () => void;
  onOpenCompile: () => void;
  onOpenFocusMode: () => void;
  onOpenPalette: () => void;
  onOpenScratchpad: () => void;
  onOpenToolsDrawer: () => void;
  onOpenThemeCustomizer: () => void;
  onOpenHelp: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  wordCount: number;
  splitMode: 'off' | 'horizontal' | 'vertical';
  onToggleSplit: () => void;
}

const PLAN_MODES: Array<{ id: ViewMode; label: string; icon: any }> = [
  { id: 'corkboard', label: 'Mantar Pano (Corkboard)', icon: LayoutGrid },
  { id: 'outliner', label: 'Genel Bakış (Outliner)', icon: List },
  { id: 'timeline', label: 'Zaman Çizelgesi (Timeline)', icon: Clock },
  { id: 'codex', label: 'Karakterler & Dünya (Codex)', icon: BookOpen },
  { id: 'map', label: 'İnteraktif Harita (Map)', icon: Map },
];

export function TopNavigation({
  projectName,
  viewMode,
  onViewModeChange,
  binderVisible,
  onToggleBinder,
  inspectorVisible,
  onToggleInspector,
  onOpenWelcomeHub,
  onOpenCompile,
  onOpenFocusMode,
  onOpenPalette,
  onOpenScratchpad,
  onOpenToolsDrawer,
  onOpenThemeCustomizer,
  onOpenHelp,
  soundEnabled,
  onToggleSound,
  wordCount,
  splitMode,
  onToggleSplit,
}: TopNavigationProps) {
  const [planMenuOpen, setPlanMenuOpen] = useState(false);
  const planMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (planMenuRef.current && !planMenuRef.current.contains(e.target as Node)) {
        setPlanMenuOpen(false);
      }
    }
    if (planMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [planMenuOpen]);

  const isPlanModeActive = viewMode !== 'editor';
  const currentPlanLabel = PLAN_MODES.find((m) => m.id === viewMode)?.label.split(' (')[0] || 'Planla & Araştır';

  return (
    <header className="top-navigation" role="toolbar" aria-label="Ana Çalışma Alanı Gezintisi">
      {/* Sol Grup: Binder Toggle & Proje Seçici */}
      <div className="top-nav-left">
        <button
          type="button"
          className="top-nav-btn icon-only"
          onClick={onToggleBinder}
          title={binderVisible ? 'Sol Paneli Gizle (Ctrl+Alt+B)' : 'Sol Paneli Göster (Ctrl+Alt+B)'}
          aria-label={binderVisible ? 'Binder Gizle' : 'Binder Göster'}
        >
          {binderVisible ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
        </button>

        <button
          type="button"
          className="top-nav-btn project-selector-btn"
          onClick={onOpenWelcomeHub}
          title="Başlangıç Ekranı / Projeyi Değiştir"
        >
          <FolderOpen size={15} />
          <span className="project-name-text">{projectName || 'OpenScriv Projesi'}</span>
          <ChevronDown size={13} style={{ opacity: 0.6 }} />
        </button>
      </div>

      {/* Orta Grup: Temel Çalışma Alanları (Editör | Mantar Pano | Outliner | Daha Fazla | Derle) */}
      <nav className="top-nav-center" aria-label="Temel Görünüm Modları">
        {/* 1) YAZ (Editör) */}
        <button
          type="button"
          className={`top-nav-tab ${viewMode === 'editor' ? 'active' : ''}`}
          onClick={() => onViewModeChange('editor')}
          title="Metin Editörü"
        >
          <Edit3 size={15} />
          <span>Editör</span>
        </button>

        {/* 2) MANTAR PANO */}
        <button
          type="button"
          className={`top-nav-tab ${viewMode === 'corkboard' ? 'active' : ''}`}
          onClick={() => onViewModeChange('corkboard')}
          title="Mantar Pano (Corkboard)"
        >
          <LayoutGrid size={15} />
          <span>Mantar Pano</span>
        </button>

        {/* 3) OUTLINER */}
        <button
          type="button"
          className={`top-nav-tab ${viewMode === 'outliner' ? 'active' : ''}`}
          onClick={() => onViewModeChange('outliner')}
          title="Tablo Görünümü (Outliner)"
        >
          <List size={15} />
          <span>Outliner</span>
        </button>

        {/* 4) DİĞER PLANLAMA MODLARI (Timeline, Codex, Map) */}
        <div className="plan-dropdown-container" ref={planMenuRef}>
          <button
            type="button"
            className={`top-nav-tab ${['timeline', 'codex', 'map'].includes(viewMode) ? 'active' : ''}`}
            onClick={() => setPlanMenuOpen((prev) => !prev)}
            aria-expanded={planMenuOpen}
            aria-haspopup="true"
            title="Diğer Planlama ve Evren Araçları (Timeline, Codex, Harita)"
          >
            <BookOpen size={15} />
            <span>{['timeline', 'codex', 'map'].includes(viewMode) ? currentPlanLabel : 'Evren & Plan'}</span>
            <ChevronDown size={13} />
          </button>

          {planMenuOpen && (
            <div className="plan-dropdown-menu" role="menu">
              {PLAN_MODES.filter((m) => ['timeline', 'codex', 'map'].includes(m.id)).map((item) => {
                const IconComponent = item.icon;
                const isSelected = viewMode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    className={`plan-menu-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      onViewModeChange(item.id);
                      setPlanMenuOpen(false);
                    }}
                  >
                    <IconComponent size={15} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 5) DERLE & DIŞA AKTAR */}
        <button
          type="button"
          className="top-nav-tab export-tab"
          onClick={onOpenCompile}
          title="Projeyi Derle ve Dışa Aktar"
          aria-label="Toggle Compile Window"
        >
          <Download size={15} />
          <span>Derle</span>
        </button>
      </nav>

      {/* Sağ Grup: Hızlı Araçlar, Yardım & Inspector Toggle */}
      <div className="top-nav-right">
        <span className="live-word-count" title="Aktif Bölüm Kelime Sayısı">
          {wordCount} words
        </span>

        <button
          type="button"
          className={`top-nav-btn ${splitMode !== 'off' ? 'active' : ''}`}
          onClick={onToggleSplit}
          title={splitMode === 'off' ? 'Çift Panel / Bölünmüş Ekran' : 'Tek Panele Dön'}
        >
          <Columns size={15} />
        </button>

        <button
          type="button"
          className="top-nav-btn"
          onClick={onOpenFocusMode}
          title="Odak Modu (F11 / Zen Modu)"
        >
          <Maximize2 size={15} />
        </button>

        <button
          type="button"
          className="top-nav-btn"
          onClick={onOpenPalette}
          title="Komut Paleti (Ctrl+Shift+P)"
        >
          <Command size={15} />
        </button>

        <button
          type="button"
          className="top-nav-btn"
          onClick={onOpenScratchpad}
          title="Hızlı Not Defteri (Ctrl+Shift+N)"
        >
          <StickyNote size={15} />
        </button>

        <button
          type="button"
          className={`top-nav-btn ${soundEnabled ? 'active' : ''}`}
          onClick={onToggleSound}
          title={soundEnabled ? 'Daktilo Tuş Seslerini Kapat (Alt+S)' : 'Daktilo Tuş Seslerini Aç (Alt+S)'}
        >
          {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>

        <button
          type="button"
          className="top-nav-btn tools-btn"
          onClick={onOpenToolsDrawer}
          title="Tüm Stüdyo Modülleri ve Araçlar"
        >
          <Wrench size={15} />
          <span className="tools-label">Araçlar</span>
        </button>

        <button
          type="button"
          className="top-nav-btn icon-only"
          onClick={onOpenThemeCustomizer}
          title="Tema ve Tipografi Ayarları"
        >
          <Palette size={15} />
        </button>

        <button
          type="button"
          className="top-nav-btn icon-only"
          onClick={onOpenHelp}
          title="Yardım, Kısayollar ve Başlangıç Kılavuzu"
        >
          <HelpCircle size={15} />
        </button>

        <button
          type="button"
          className="top-nav-btn icon-only"
          onClick={onToggleInspector}
          title={inspectorVisible ? 'Sağ Paneli Gizle' : 'Sağ Paneli Göster'}
          aria-label={inspectorVisible ? 'Sağ Paneli Gizle' : 'Sağ Paneli Göster'}
        >
          {inspectorVisible ? <PanelRightClose size={17} /> : <PanelRightOpen size={17} />}
        </button>
      </div>
    </header>
  );
}

export default TopNavigation;
