import React, { useState, useMemo, useCallback, useEffect } from 'react';
// @ts-ignore
import Binder from './components/Binder.jsx';
// @ts-ignore
import Editor from './components/Editor.jsx';
// @ts-ignore
import Corkboard from './components/Corkboard.jsx';
// @ts-ignore
import Outliner from './components/Outliner.jsx';
// @ts-ignore
import Inspector from './components/Inspector.jsx';
// @ts-ignore
import Search from './components/Search.jsx';
// @ts-ignore
import CompileDialog from './components/CompileDialog.jsx';
// @ts-ignore
import Snapshots from './components/Snapshots.jsx';
// @ts-ignore
import WordCount from './components/WordCount.jsx';
// @ts-ignore
import TabBar from './components/TabBar.jsx';
// @ts-ignore
import SplitView from './components/SplitView.jsx';
// @ts-ignore
import { useTheme } from './theme.js';
// @ts-ignore
import { useProjectState, DEFAULT_METADATA } from './state/project.js';
// @ts-ignore
import { countWords } from './utils/count.js';

import {
  FileText,
  Folder,
  FolderPlus,
  FilePlus,
  Moon,
  Sun,
  Search as SearchIcon,
  Download,
  LayoutGrid,
  List,
  Edit3,
  Camera,
  Target,
  Sliders,
  Columns,
} from 'lucide-react';

const INITIAL_TREE = [
  {
    id: 'folder-manuscript',
    type: 'folder',
    title: 'Taslak (Manuscript)',
    metadata: {
      synopsis: 'Ana kitap taslağı ve bölümler.',
      status: 'Taslak',
      labels: ['Mavi'],
      keywords: ['roman', 'taslak'],
    },
    children: [
      {
        id: 'doc-chapter-1',
        type: 'doc',
        title: 'Bölüm 1: Başlangıç',
        content: 'Sisli bir sonbahar sabahıydı. Eski yazı masasının çekmecesi gıcırtıyla açıldı...',
        metadata: {
          synopsis: 'Hikayenin başlangıcı ve ana karakter tanıtımı.',
          status: 'Ilk Taslak',
          labels: ['Mavi'],
          keywords: ['giriş', 'sabah'],
        },
      },
      {
        id: 'doc-chapter-2',
        type: 'doc',
        title: 'Bölüm 2: İpucu',
        content: 'Çekmecenin gizli bölmesinde sararmış bir zarf bulundu.',
        metadata: {
          synopsis: 'İlk gizemli ipucunun bulunması.',
          status: 'Taslak',
          labels: ['Kirmizi'],
          keywords: ['ipucu'],
        },
      },
    ],
  },
  {
    id: 'folder-notes',
    type: 'folder',
    title: 'Araştırma & Notlar',
    metadata: {
      synopsis: 'Arka plan, karakter profilleri ve araştırma notları.',
      status: 'Taslak',
      labels: ['Yesil'],
      keywords: ['notlar'],
    },
    children: [
      {
        id: 'doc-char-protagonist',
        type: 'doc',
        title: 'Karakter: Eren',
        content: 'Eren, 34 yaşında meraklı bir araştırmacı yazar.',
        metadata: {
          synopsis: 'Baş karakter profili ve motivasyonları.',
          status: 'Tamamlandı',
          labels: ['Yesil'],
          keywords: ['karakter'],
        },
      },
    ],
  },
];

function findNodeInTree(nodes: any[], id: string): any | null {
  for (const n of nodes || []) {
    if (n.id === id) return n;
    if (n.type === 'folder' && Array.isArray(n.children)) {
      const found = findNodeInTree(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

function findFirstDoc(nodes: any[]): any | null {
  for (const n of nodes || []) {
    if (n.type === 'doc') return n;
    if (n.type === 'folder' && Array.isArray(n.children)) {
      const found = findFirstDoc(n.children);
      if (found) return found;
    }
  }
  return null;
}

export function App() {
  const { theme, toggleTheme } = useTheme();

  // Disk kalıcılığı callback'i
  const handlePersist = useCallback((stampedProject: any) => {
    const api = (window as any).electronAPI || (window as any).api;
    if (api && typeof api.saveProjectTree === 'function') {
      api.saveProjectTree({ projectId: 'default', tree: stampedProject.tree });
    }
  }, []);

  const {
    project,
    tree,
    setProject,
    addDoc,
    deleteNode,
    renameNode,
    updateDocContent,
    updateMetadata,
  } = useProjectState({
    initialTree: INITIAL_TREE as any,
    projectName: 'OpenScriv Projesi',
    onPersist: handlePersist,
  });

  // Seçili düğüm
  const firstDoc = useMemo(() => findFirstDoc(tree) || tree[0] || null, [tree]);
  const [selectedId, setSelectedId] = useState<string>(() => firstDoc?.id || 'doc-chapter-1');

  // Görünüm modu: 'editor' | 'corkboard' | 'outliner'
  const [viewMode, setViewMode] = useState<'editor' | 'corkboard' | 'outliner'>('editor');

  // Inspector sekmesi: 'metadata' | 'snapshots' | 'targets'
  const [inspectorTab, setInspectorTab] = useState<'metadata' | 'snapshots' | 'targets'>('metadata');

  // Modallar
  const [searchOpen, setSearchOpen] = useState(false);
  const [compileOpen, setCompileOpen] = useState(false);

  // Açık sekmeler (TabBar)
  const [openTabs, setOpenTabs] = useState<{ id: string; title: string; dirty?: boolean }[]>(() => [
    { id: 'doc-chapter-1', title: 'Bölüm 1: Başlangıç' },
  ]);

  // Bölünmüş ekran durumu (SplitView): 'off' | 'vertical' | 'horizontal'
  const [splitMode, setSplitMode] = useState<'off' | 'vertical' | 'horizontal'>('off');
  const [secondaryDocId, setSecondaryDocId] = useState<string>('doc-char-protagonist');

  // Aktif düğüm ve aktif doküman
  const activeNode = useMemo(() => findNodeInTree(tree, selectedId) || firstDoc, [tree, selectedId, firstDoc]);
  const activeDoc = useMemo(() => {
    if (activeNode?.type === 'doc') return activeNode;
    return findFirstDoc(tree) || null;
  }, [activeNode, tree]);

  // Aktif klasör (Corkboard için)
  const activeFolder = useMemo(() => {
    if (activeNode?.type === 'folder') return activeNode;
    // Doküman seçiliyse ana klasörü bul veya ilk klasörü dön
    return tree.find((n: any) => n.type === 'folder') || { id: 'root', type: 'folder', title: 'Tüm Belgeler', children: tree };
  }, [activeNode, tree]);

  // Canlı kelime sayısı
  const activeWords = useMemo(() => countWords(activeDoc?.content || ''), [activeDoc?.content]);

  // Sekme yönetimi
  const addTab = useCallback((id: string, title?: string) => {
    setOpenTabs((prev) => {
      if (prev.some((t) => t.id === id)) return prev;
      return [...prev, { id, title: title || 'Belge' }];
    });
  }, []);

  const handleSelectTab = useCallback((tabId: string) => {
    setSelectedId(tabId);
    setViewMode('editor');
  }, []);

  const handleCloseTab = useCallback((tabId: string) => {
    setOpenTabs((prev) => {
      if (prev.length <= 1) return prev;
      const nextTabs = prev.filter((t) => t.id !== tabId);
      if (selectedId === tabId) {
        const closedIdx = prev.findIndex((t) => t.id === tabId);
        const nextActive = nextTabs[Math.max(0, closedIdx - 1)] || nextTabs[0];
        if (nextActive) setSelectedId(nextActive.id);
      }
      return nextTabs;
    });
  }, [selectedId]);

  // Tab başlıklarını ağaç ile senkronize et
  const syncedTabs = useMemo(() => {
    return openTabs.map((t) => {
      const node = findNodeInTree(tree, t.id);
      return {
        ...t,
        title: node?.title || t.title,
      };
    });
  }, [openTabs, tree]);

  // Seçim işleyicileri
  const handleSelectDoc = useCallback((docNode: any) => {
    if (docNode) {
      setSelectedId(docNode.id);
      setViewMode('editor');
      addTab(docNode.id, docNode.title);
    }
  }, [addTab]);

  const handleSelectNode = useCallback((node: any) => {
    if (!node) return;
    setSelectedId(node.id);
    if (node.type === 'folder') {
      setViewMode('corkboard');
    } else {
      setViewMode('editor');
      addTab(node.id, node.title);
    }
  }, [addTab]);

  const handleSelectDocById = useCallback((docId: string) => {
    setSelectedId(docId);
    setViewMode('editor');
    const node = findNodeInTree(tree, docId);
    addTab(docId, node?.title || 'Belge');
    setSearchOpen(false);
  }, [addTab, tree]);

  const handleContentChange = useCallback((docId: string, newContent: string) => {
    updateDocContent(docId, newContent);
  }, [updateDocContent]);

  const handleUpdateSynopsis = useCallback((nodeId: string, newSynopsis: string) => {
    updateMetadata(nodeId, { synopsis: newSynopsis });
  }, [updateMetadata]);

  const handleRestoreSnapshot = useCallback((docId: string, restoredContent: string) => {
    updateDocContent(docId, restoredContent);
  }, [updateDocContent]);

  // Klavye kısayolları
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`app ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Sol Panel: Binder (Proje Ağacı) */}
      <aside className="sidebar" aria-label="Binder">
        <div className="brand">
          <div>
            <strong>OpenScriv</strong>
            <span>{project.name || 'OpenScriv Projesi'}</span>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Toggle theme"
            title="Temayı Değiştir"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Hızlı Butonlar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button
            type="button"
            className="icon-button"
            title="Yeni Doküman Ekle"
            onClick={() => addDoc('Yeni Bölüm', activeFolder?.id, undefined)}
            style={{ width: 'auto', flex: 1, padding: '0 8px', fontSize: '12px', gap: '4px' }}
          >
            <FilePlus size={15} /> + Doküman
          </button>
          <button
            type="button"
            className="icon-button"
            title="Yeni Klasör Ekle"
            onClick={() => {
              const fNode = {
                id: `folder-${Date.now()}`,
                type: 'folder',
                title: 'Yeni Klasör',
                metadata: { ...DEFAULT_METADATA },
                children: [],
              };
              setProject((p: any) => ({ ...p, tree: [...p.tree, fNode] }));
            }}
            style={{ width: 'auto', flex: 1, padding: '0 8px', fontSize: '12px', gap: '4px' }}
          >
            <FolderPlus size={15} /> + Klasör
          </button>
        </div>

        {/* Arama Butonu */}
        <div
          className="search-box"
          style={{ cursor: 'pointer', marginBottom: '12px' }}
          onClick={() => setSearchOpen(true)}
          role="button"
          tabIndex={0}
          aria-label="Arama Yap"
        >
          <SearchIcon size={16} aria-hidden="true" />
          <span style={{ fontSize: '13px', color: 'var(--text-muted, #8a7f66)' }}>
            Projeyi Ara (Ctrl+K)...
          </span>
        </div>

        {/* Binder Ağacı */}
        <Binder
          tree={tree}
          selectedId={selectedId as any}
          onSelectDoc={handleSelectDoc}
        />
      </aside>

      {/* Orta Panel: Editör / Corkboard / Outliner */}
      <section className="editor-shell" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Üst Navigasyon & Görünüm Değiştirici */}
        <header className="toolbar" style={{ borderBottom: '1px solid var(--border, #d9d4c8)', padding: '8px 16px', background: 'var(--bg-header, #efece4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className={`icon-button ${viewMode === 'editor' ? 'active' : ''}`}
              title="Metin Editörü"
              onClick={() => setViewMode('editor')}
              style={{ width: 'auto', padding: '0 12px', fontSize: '13px', gap: '6px', background: viewMode === 'editor' ? 'var(--bg-selected, #dfd8c6)' : undefined }}
            >
              <Edit3 size={15} /> Editör
            </button>
            <button
              type="button"
              className={`icon-button ${viewMode === 'corkboard' ? 'active' : ''}`}
              title="Mantar Pano (Corkboard)"
              onClick={() => setViewMode('corkboard')}
              style={{ width: 'auto', padding: '0 12px', fontSize: '13px', gap: '6px', background: viewMode === 'corkboard' ? 'var(--bg-selected, #dfd8c6)' : undefined }}
            >
              <LayoutGrid size={15} /> Mantar Pano
            </button>
            <button
              type="button"
              className={`icon-button ${viewMode === 'outliner' ? 'active' : ''}`}
              title="Tablo Görünümü (Outliner)"
              onClick={() => setViewMode('outliner')}
              style={{ width: 'auto', padding: '0 12px', fontSize: '13px', gap: '6px', background: viewMode === 'outliner' ? 'var(--bg-selected, #dfd8c6)' : undefined }}
            >
              <List size={15} /> Outliner
            </button>
          </div>

          <div className="toolbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className={`icon-button ${splitMode !== 'off' ? 'active' : ''}`}
              title={splitMode === 'off' ? 'Bölünmüş Ekranı Aç (Çift Panel)' : 'Tek Panel Görünümüne Dön'}
              onClick={() => setSplitMode((prev) => (prev === 'off' ? 'vertical' : 'off'))}
              style={{ width: 'auto', padding: '0 10px', fontSize: '13px', gap: '6px', background: splitMode !== 'off' ? 'var(--bg-selected, #dfd8c6)' : undefined }}
            >
              <Columns size={15} /> {splitMode !== 'off' ? 'Tek Panel' : 'Böl'}
            </button>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{activeWords} words</span>
            <button
              type="button"
              className="icon-button"
              title="Projeyi Derle ve Dışa Aktar"
              onClick={() => setCompileOpen(true)}
              style={{ width: 'auto', padding: '0 10px', fontSize: '13px', gap: '6px', color: 'var(--accent, #7a6c4f)' }}
            >
              <Download size={15} /> Derle
            </button>
          </div>
        </header>

        {/* Doküman Sekmeleri (TabBar) */}
        <TabBar
          tabs={syncedTabs}
          activeId={selectedId}
          onSelect={handleSelectTab}
          onClose={handleCloseTab}
        />

        {/* Görünüm İçeriği */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {splitMode === 'off' ? (
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
              {viewMode === 'editor' && (
                <Editor
                  document={activeDoc}
                  onChange={handleContentChange}
                  ariaLabel="Manuscript editor"
                />
              )}

              {viewMode === 'corkboard' && (
                <Corkboard
                  folder={activeFolder}
                  onSelectNode={handleSelectNode}
                  onUpdateSynopsis={handleUpdateSynopsis}
                />
              )}

              {viewMode === 'outliner' && (
                <Outliner
                  tree={tree}
                  selectedId={selectedId as any}
                  onSelectNode={handleSelectNode}
                />
              )}
            </div>
          ) : (
            <SplitView
              orientation={splitMode}
              onOrientationChange={(newOrient: any) => setSplitMode(newOrient)}
              primaryLabel="Birincil Görünüm"
              secondaryLabel="İkincil Panel"
              primary={
                <div style={{ height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                  {viewMode === 'editor' && (
                    <Editor
                      document={activeDoc}
                      onChange={handleContentChange}
                      ariaLabel="Manuscript editor"
                    />
                  )}
                  {viewMode === 'corkboard' && (
                    <Corkboard
                      folder={activeFolder}
                      onSelectNode={handleSelectNode}
                      onUpdateSynopsis={handleUpdateSynopsis}
                    />
                  )}
                  {viewMode === 'outliner' && (
                    <Outliner
                      tree={tree}
                      selectedId={selectedId as any}
                      onSelectNode={handleSelectNode}
                    />
                  )}
                </div>
              }
              secondary={
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-editor, #faf8f5)' }}>
                  <div style={{ padding: '6px 12px', background: 'var(--bg-header, #efece4)', borderBottom: '1px solid var(--border, #d9d4c8)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--accent, #7a6c4f)' }}>İkincil Panel (Referans Not)</span>
                    <select
                      value={secondaryDocId}
                      onChange={(e) => setSecondaryDocId(e.target.value)}
                      style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border, #d9d4c8)', background: 'var(--bg-card, #fff)', color: 'var(--text, #2c2518)' }}
                    >
                      <option value="doc-char-protagonist">Karakter: Eren</option>
                      <option value="doc-chapter-1">Bölüm 1: Başlangıç</option>
                      <option value="doc-chapter-2">Bölüm 2: İpucu</option>
                    </select>
                  </div>
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <Editor
                      document={findNodeInTree(tree, secondaryDocId) || activeDoc}
                      onChange={handleContentChange}
                      ariaLabel="Secondary editor"
                    />
                  </div>
                </div>
              }
            />
          )}
        </div>
      </section>

      {/* Sağ Panel: Inspector (Metadata, Snapshots, Hedefler) */}
      <aside className="inspector" aria-label="Inspector Paneli" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Inspector Sekme Butonları */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', borderBottom: '1px solid var(--border, #d9d4c8)', paddingBottom: '8px' }}>
          <button
            type="button"
            className="icon-button"
            onClick={() => setInspectorTab('metadata')}
            title="Metadata ve Notlar"
            style={{ flex: 1, fontSize: '12px', background: inspectorTab === 'metadata' ? 'var(--bg-selected, #dfd8c6)' : undefined }}
          >
            <Sliders size={14} /> Bilgi
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => setInspectorTab('snapshots')}
            title="Anlık Görüntüler (Snapshots)"
            style={{ flex: 1, fontSize: '12px', background: inspectorTab === 'snapshots' ? 'var(--bg-selected, #dfd8c6)' : undefined }}
          >
            <Camera size={14} /> Sürüm
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => setInspectorTab('targets')}
            title="Kelime ve Hedef Takibi"
            style={{ flex: 1, fontSize: '12px', background: inspectorTab === 'targets' ? 'var(--bg-selected, #dfd8c6)' : undefined }}
          >
            <Target size={14} /> Hedef
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {inspectorTab === 'metadata' && (
            <Inspector
              node={activeNode}
              onUpdateMetadata={updateMetadata}
              ariaLabel="Inspector"
            />
          )}

          {inspectorTab === 'snapshots' && (
            <Snapshots
              document={activeDoc}
              projectId="default"
              onRestore={handleRestoreSnapshot}
            />
          )}

          {inspectorTab === 'targets' && (
            <WordCount
              document={activeDoc}
              tree={tree}
            />
          )}
        </div>
      </aside>

      {/* Arama Diyaloğu (Modal) */}
      <Search
        tree={tree}
        projectId="default"
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectDoc={handleSelectDocById}
      />

      {/* Derleme Diyaloğu (Modal) */}
      <CompileDialog
        open={compileOpen}
        tree={tree}
        projectId="default"
        projectName={project.name || 'OpenScriv Projesi'}
        onClose={() => setCompileOpen(false)}
      />
    </div>
  );
}

export default App;
