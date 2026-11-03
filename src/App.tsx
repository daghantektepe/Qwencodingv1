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
import Snapshots from './components/Snapshots.jsx';
// @ts-ignore
import WordCount from './components/WordCount.jsx';
// @ts-ignore
import TabBar from './components/TabBar.jsx';
// @ts-ignore
import SplitView from './components/SplitView.jsx';
// @ts-ignore
import StatusBar from './components/StatusBar.jsx';
// @ts-ignore
import { useAutosave, SaveStatus } from './hooks/useAutosave.js';
// @ts-ignore
import {
  useTheme,
  THEME_CARDS,
  FONT_CHOICES,
  LINE_HEIGHT_OPTIONS,
  FONT_SIZE_RANGE,
} from './theme.js';
// @ts-ignore
import { useProjectState, DEFAULT_METADATA } from './state/project.js';
// @ts-ignore
import { countWords } from './utils/count.js';
import {
  FolderPlus,
  FilePlus,
  Sliders,
  Camera,
  Target,
  Palette,
  Sun,
  Moon,
} from 'lucide-react';
// @ts-ignore
import { soundEngine } from './utils/sound.js';
import { TimelineView } from './components/Timeline/TimelineView.tsx';
import CodexManager from './components/Codex/CodexManager';
import { InteractiveMapViewer } from './components/Map/InteractiveMapViewer.tsx';
import { useTouchModeStore } from './services/platform/touchModeAdapter';
import CustomTitlebar from './components/Window/CustomTitlebar.tsx';
import { TopNavigation, ViewMode } from './components/Navigation/TopNavigation.tsx';
import { DialogHost } from './components/Navigation/DialogHost.tsx';
import { NativeProjectStore } from './services/native/nativeProjectStore';
import { RecentProjectsService } from './services/recentProjects';

// Temiz Başlangıç Şablonu (Rastgele demo metin içermeyen saf taslak - Faz 2)
function createCleanProjectTree() {
  return [
    {
      id: 'folder-manuscript',
      type: 'folder',
      title: 'Taslak (Manuscript)',
      metadata: {
        synopsis: 'Ana kitap taslağı ve bölümler.',
        status: 'Taslak',
        labels: [],
        keywords: ['taslak'],
      },
      children: [
        {
          id: `doc-${Date.now()}`,
          type: 'doc',
          title: 'Bölüm 1',
          content: '',
          metadata: {
            synopsis: '',
            status: 'Yeni',
            labels: [],
            keywords: [],
          },
        },
      ],
    },
    {
      id: 'folder-notes',
      type: 'folder',
      title: 'Araştırma & Notlar',
      metadata: {
        synopsis: 'Araştırma dokümanları ve referans notları.',
        status: 'Not',
        labels: [],
        keywords: ['araştırma'],
      },
      children: [],
    },
    {
      id: 'folder-trash',
      type: 'folder',
      title: 'Çöp Kutusu',
      metadata: {
        synopsis: 'Silinen bölümler ve notlar.',
        status: 'Çöp',
        labels: [],
        keywords: [],
      },
      children: [],
    },
  ];
}

// Üç Perdeli Roman Şablonu
function createThreeActProjectTree() {
  return [
    {
      id: 'folder-manuscript',
      type: 'folder',
      title: 'Taslak (Manuscript)',
      metadata: { synopsis: 'Üç Perdeli Roman Taslağı', status: 'Taslak', labels: [], keywords: [] },
      children: [
        {
          id: 'folder-act-1',
          type: 'folder',
          title: 'Perde I: Başlangıç & Kanca',
          metadata: { synopsis: 'Statüko ve tetikleyici olay.', status: 'Taslak', labels: [], keywords: [] },
          children: [
            { id: `doc-act1-1`, type: 'doc', title: 'Sahne 1: Normal Dünya', content: '', metadata: { synopsis: '', status: 'Yeni', labels: [], keywords: [] } },
            { id: `doc-act1-2`, type: 'doc', title: 'Sahne 2: Çağrı', content: '', metadata: { synopsis: '', status: 'Yeni', labels: [], keywords: [] } },
          ],
        },
        {
          id: 'folder-act-2',
          type: 'folder',
          title: 'Perde II: Yüzleşme & Kriz',
          metadata: { synopsis: 'Zorluklar, orta nokta ve en karanlık an.', status: 'Taslak', labels: [], keywords: [] },
          children: [
            { id: `doc-act2-1`, type: 'doc', title: 'Sahne 3: Yeni Dünyaya Geçiş', content: '', metadata: { synopsis: '', status: 'Yeni', labels: [], keywords: [] } },
          ],
        },
        {
          id: 'folder-act-3',
          type: 'folder',
          title: 'Perde III: Doruk Noktası & Çözüm',
          metadata: { synopsis: 'Nihai savaş ve dönüşüm.', status: 'Taslak', labels: [], keywords: [] },
          children: [
            { id: `doc-act3-1`, type: 'doc', title: 'Sahne 4: Doruk Noktası', content: '', metadata: { synopsis: '', status: 'Yeni', labels: [], keywords: [] } },
          ],
        },
      ],
    },
    {
      id: 'folder-notes',
      type: 'folder',
      title: 'Karakterler & Evren',
      metadata: { synopsis: 'Evren tasarımı ve karakter arkları.', status: 'Not', labels: [], keywords: [] },
      children: [],
    },
    {
      id: 'folder-trash',
      type: 'folder',
      title: 'Çöp Kutusu',
      metadata: { synopsis: 'Silinenler', status: 'Çöp', labels: [], keywords: [] },
      children: [],
    },
  ];
}

// Örnek Proje Ağacı (Demo & Keşif İçin)
const SAMPLE_PROJECT_TREE = [
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
      synopsis: 'Roman araştırması ve yan notlar.',
      status: 'Not',
      labels: ['Yesil'],
      keywords: ['arastirma'],
    },
    children: [
      {
        id: 'doc-char-protagonist',
        type: 'doc',
        title: 'Karakter: Eren',
        content: 'Yaş: 32. Meslek: Antika restoratörü. Karakter özellikleri: Gözlemci, sessiz, detaycı.',
        metadata: {
          synopsis: 'Ana karakter Eren hakkında detaylar.',
          status: 'Not',
          labels: ['Yesil'],
          keywords: ['karakter', 'protagonist'],
        },
      },
      {
        id: 'doc-world-location',
        type: 'doc',
        title: 'Dünya Notları: Saat Kulesi',
        content: 'Şehrin merkezindeki 18. yüzyıldan kalma saat kulesi ve altındaki gizli tüneller.',
        metadata: {
          synopsis: 'Mekan ve dünya inşası referans bilgisi.',
          status: 'Not',
          labels: ['Yesil'],
          keywords: ['mekan', 'harita'],
        },
      },
    ],
  },
  {
    id: 'folder-timeline',
    type: 'folder',
    title: 'Zaman Çizelgesi Olayları',
    metadata: {
      synopsis: 'Kronolojik olay sırası ve takvim eşlemeleri.',
      status: 'Taslak',
      labels: [],
      keywords: ['zaman', 'kronoloji'],
    },
    children: [
      {
        id: 'doc-event-1',
        type: 'doc',
        title: '12 Ekim: Zarfın Bulunuşu',
        content: 'Eren sabah saat 08:30 sularında atölyeye gelir ve zarfı keşfeder.',
        metadata: {
          synopsis: 'Olay başlangıcı',
          status: 'Taslak',
          labels: ['Mavi'],
          keywords: ['olay', 'sabah'],
        },
      },
    ],
  },
];

function findFirstDoc(nodes: any[]): any {
  for (const n of nodes) {
    if (n.type === 'doc') return n;
    if (n.type === 'folder' && Array.isArray(n.children)) {
      const d = findFirstDoc(n.children);
      if (d) return d;
    }
  }
  return null;
}

function findNodeInTree(nodes: any[], id: string): any {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.type === 'folder' && Array.isArray(n.children)) {
      const found = findNodeInTree(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

function flattenDocs(nodes: any[]): Array<{ id: string; title: string; content: string }> {
  const result: Array<{ id: string; title: string; content: string }> = [];
  for (const n of nodes) {
    if (n.type === 'doc') {
      result.push({ id: n.id, title: n.title, content: n.content || '' });
    }
    if (n.type === 'folder' && Array.isArray(n.children)) {
      result.push(...flattenDocs(n.children));
    }
  }
  return result;
}

export function App() {
  const { theme, setTheme, toggleTheme, typography, setTypography } = useTheme();

  // Aktif .opscriv paket dizini (boşsa yerel sanal/bellek modu)
  const [activePackagePath, setActivePackagePath] = useState<string | null>(() => {
    return localStorage.getItem('openscriv:active_package_path') || null;
  });

  // Doğru kayıt durumu sözleşmesi: 'idle' | 'dirty' | 'saving' | 'saved' | 'error'
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Panel görünürlük tercihleri (localStorage ile kalıcı)
  const [binderVisible, setBinderVisible] = useState<boolean>(() => {
    return localStorage.getItem('openscriv:binder_visible') !== 'false';
  });
  const [inspectorVisible, setInspectorVisible] = useState<boolean>(() => {
    return localStorage.getItem('openscriv:inspector_visible') !== 'false';
  });

  const handleToggleBinder = useCallback(() => {
    setBinderVisible((prev) => {
      const next = !prev;
      localStorage.setItem('openscriv:binder_visible', String(next));
      return next;
    });
  }, []);

  const handleToggleInspector = useCallback(() => {
    setInspectorVisible((prev) => {
      const next = !prev;
      localStorage.setItem('openscriv:inspector_visible', String(next));
      return next;
    });
  }, []);

  // Disk kalıcılığı callback'i (Ağaç değiştiğinde atomik olarak kaydeder)
  const handlePersist = useCallback(async (stampedProject: any) => {
    setSaveStatus('saving');
    try {
      if (activePackagePath) {
        const res = await NativeProjectStore.saveBinderAtomic(activePackagePath, stampedProject.tree);
        if (res && res.ok === false) {
          throw new Error(res.error || 'Ağaç kaydedilemedi.');
        }
      } else {
        const api = (window as any).electronAPI || (window as any).api;
        if (api && typeof api.saveProjectTree === 'function') {
          const res = await api.saveProjectTree({ projectId: stampedProject.id || 'default', tree: stampedProject.tree });
          if (res && res.ok === false) {
            throw new Error(res.error || 'Ağaç kaydedilemedi.');
          }
        }
      }
      setSaveStatus('saved');
      setLastSavedAt(new Date().toISOString());
    } catch (err: any) {
      console.error('[handlePersist] Ağaç kaydetme hatası:', err);
      setSaveStatus('error');
    }
  }, [activePackagePath]);

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
    initialTree: SAMPLE_PROJECT_TREE as any,
    projectName: 'OpenScriv Projesi',
    onPersist: handlePersist,
  });

  // Seçili düğüm
  const firstDoc = useMemo(() => findFirstDoc(tree) || tree[0] || null, [tree]);
  const [selectedId, setSelectedId] = useState<string>(() => firstDoc?.id || 'doc-chapter-1');

  // Görünüm modu: 'editor' | 'corkboard' | 'outliner' | 'timeline' | 'codex' | 'map'
  const [viewMode, setViewMode] = useState<ViewMode>('editor');

  // Inspector sekmesi: 'metadata' | 'snapshots' | 'targets'
  const [inspectorTab, setInspectorTab] = useState<'metadata' | 'snapshots' | 'targets'>('metadata');

  // Modallar ve Paneller
  const [welcomeHubOpen, setWelcomeHubOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [compileOpen, setCompileOpen] = useState(false);
  const [focusModeOpen, setFocusModeOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [themeCustomizerOpen, setThemeCustomizerOpen] = useState(false);
  const [scratchpadOpen, setScratchpadOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [soundEnabled, setSoundEnabled] = useState(() => soundEngine.isEnabled());

  // Stüdyo Araç Modalları (Faz 88 - Faz 98)
  const [healthDashboardOpen, setHealthDashboardOpen] = useState(false);
  const [batchExportOpen, setBatchExportOpen] = useState(false);
  const [backupManagerOpen, setBackupManagerOpen] = useState(false);
  const [nightFilterOpen, setNightFilterOpen] = useState(false);
  const [snippetsOpen, setSnippetsOpen] = useState(false);
  const [dictionaryOpen, setDictionaryOpen] = useState(false);
  const [betaFeedbackOpen, setBetaFeedbackOpen] = useState(false);
  const [toolsDrawerOpen, setToolsDrawerOpen] = useState(false);

  const { touchModeEnabled, toggleTouchMode } = useTouchModeStore();
  const allDocuments = useMemo(() => flattenDocs(tree), [tree]);

  const handleToggleSound = useCallback(() => {
    const next = soundEngine.toggle();
    setSoundEnabled(next);
  }, []);

  // Scratchpad notları (localStorage kalıcı)
  const [scratchpadNotes, setScratchpadNotes] = useState<any[]>(() => {
    try {
      const raw = window.localStorage.getItem('openscriv:scratchpad:v1');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      {
        id: 'note-init-1',
        text: 'Karakter fikri: Baş karakterin gizli bir dedektiflik geçmişi var.',
        color: 'yellow',
        updated: new Date().toISOString(),
      },
    ];
  });

  const handleUpdateNotes = useCallback((nextNotes: any[]) => {
    setScratchpadNotes(nextNotes);
    try {
      window.localStorage.setItem('openscriv:scratchpad:v1', JSON.stringify(nextNotes));
    } catch {}
  }, []);

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
    return tree.find((n: any) => n.type === 'folder') || { id: 'root', type: 'folder', title: 'Tüm Belgeler', children: tree };
  }, [activeNode, tree]);

  // Otomatik kaydetme kancası (True Save Contract)
  const { saveNow } = useAutosave(
    activeDoc ? { id: activeDoc.id, content: activeDoc.content, title: activeDoc.title } : null,
    {
      delay: 1500,
      projectId: project.id || 'default',
      packagePath: activePackagePath || undefined,
      onStatusChange: (status) => setSaveStatus(status),
      onSaveSuccess: ({ timestamp }) => {
        setSaveStatus('saved');
        setLastSavedAt(timestamp);
      },
      onSaveError: () => {
        setSaveStatus('error');
      },
    }
  );

  // Manuel kaydetmeyi tekrar dene
  const handleRetrySave = useCallback(async () => {
    try {
      await saveNow();
      if (activeDoc) {
        handlePersist({ ...project, tree });
      }
    } catch (e) {
      setSaveStatus('error');
    }
  }, [saveNow, activeDoc, handlePersist, project, tree]);

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

  const handleSendToDraft = useCallback((_noteId: string, text: string) => {
    if (!activeDoc) return;
    const separator = activeDoc.content ? '\n\n---\n' : '';
    const updated = (activeDoc.content || '') + separator + text;
    updateDocContent(activeDoc.id, updated);
  }, [activeDoc, updateDocContent]);

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
    document.documentElement.style.setProperty('--editor-zoom', `${newZoom / 100}`);
  }, []);

  // --- FAZ 2: PROJE YÖNETİMİ & PAKET YÜKLEME ---
  const handleOpenProjectPackage = useCallback(async (packagePath: string): Promise<boolean> => {
    try {
      const res = await NativeProjectStore.openPackage(packagePath);
      if (res.ok && res.data) {
        const { manifest, binder, documents } = res.data;
        // Doküman içeriklerini binder düğümlerine göm
        const mergedTree = binder.map(function mapNode(n: any): any {
          const docContent = n.id && documents[n.id] ? documents[n.id] : n.content || '';
          return {
            ...n,
            content: docContent,
            children: Array.isArray(n.children) ? n.children.map(mapNode) : undefined,
          };
        });

        setProject({
          name: manifest.name || 'Proje',
          tree: mergedTree,
          updatedAt: manifest.updatedAt || new Date().toISOString(),
        });
        setActivePackagePath(packagePath);
        localStorage.setItem('openscriv:active_package_path', packagePath);
        RecentProjectsService.add({ path: packagePath, name: manifest.name || 'Proje' });

        const first = findFirstDoc(mergedTree);
        if (first) {
          setSelectedId(first.id);
          setOpenTabs([{ id: first.id, title: first.title }]);
        }
        setSaveStatus('saved');
        setLastSavedAt(manifest.updatedAt || new Date().toISOString());
        return true;
      }
      return false;
    } catch (e) {
      console.error('[App] Proje paketi açma hatası:', e);
      return false;
    }
  }, [setProject]);

  const handleCreateNewProjectPackage = useCallback(async (
    name: string,
    parentDir: string,
    template: 'clean' | 'three-act'
  ): Promise<boolean> => {
    try {
      const initialTree = template === 'three-act' ? createThreeActProjectTree() : createCleanProjectTree();
      const first = findFirstDoc(initialTree);
      const initialDocs = first ? [{ id: first.id, content: first.content || '' }] : [];

      const res = await NativeProjectStore.createPackage({
        projectName: name,
        parentDir,
        initialTree,
        initialDocs,
      });

      if (res.ok && res.data) {
        const { packagePath, manifest, binder } = res.data;
        setProject({
          name: manifest.name,
          tree: binder,
          updatedAt: manifest.updatedAt,
        });
        setActivePackagePath(packagePath);
        localStorage.setItem('openscriv:active_package_path', packagePath);
        RecentProjectsService.add({ path: packagePath, name: manifest.name });

        if (first) {
          setSelectedId(first.id);
          setOpenTabs([{ id: first.id, title: first.title }]);
        }
        setSaveStatus('saved');
        setLastSavedAt(new Date().toISOString());
        return true;
      }
      return false;
    } catch (e) {
      console.error('[App] Yeni proje oluşturma hatası:', e);
      return false;
    }
  }, [setProject]);

  const handleLoadSampleProject = useCallback(() => {
    setProject({
      name: 'Örnek Roman Taslağı',
      tree: SAMPLE_PROJECT_TREE,
      updatedAt: new Date().toISOString(),
    });
    setActivePackagePath(null);
    localStorage.removeItem('openscriv:active_package_path');
    setSelectedId('doc-chapter-1');
    setOpenTabs([{ id: 'doc-chapter-1', title: 'Bölüm 1: Başlangıç' }]);
    setViewMode('editor');
    setSaveStatus('saved');
    setLastSavedAt(new Date().toISOString());
  }, [setProject]);

  // Açılışta: Son proje varsa ve dosya yolu geçerliyse otomatik yükle
  useEffect(() => {
    const savedPath = localStorage.getItem('openscriv:active_package_path');
    if (savedPath) {
      handleOpenProjectPackage(savedPath);
    }
  }, [handleOpenProjectPackage]);

  // Komut Paleti eylemleri
  const commands = useMemo(() => [
    {
      id: 'welcome-hub',
      title: 'Başlangıç Ekranı & Proje Değiştirici',
      group: 'Proje',
      shortcut: 'Ctrl+Shift+O',
      run: () => setWelcomeHubOpen(true),
    },
    {
      id: 'save-now',
      title: 'Projeyi Şimdi Kaydet (Atomik Flush)',
      group: 'Belge',
      shortcut: 'Ctrl+S',
      run: handleRetrySave,
    },
    {
      id: 'new-doc',
      title: 'Yeni Doküman Ekle',
      group: 'Belge',
      shortcut: 'Ctrl+N',
      run: () => addDoc('Yeni Bölüm', activeFolder?.id, undefined),
    },
    {
      id: 'view-editor',
      title: 'Metin Editörü Görünümüne Geç',
      group: 'Görünüm',
      shortcut: 'Alt+1',
      run: () => setViewMode('editor'),
    },
    {
      id: 'view-corkboard',
      title: 'Mantar Pano (Corkboard) Görünümüne Geç',
      group: 'Görünüm',
      shortcut: 'Alt+2',
      run: () => setViewMode('corkboard'),
    },
    {
      id: 'view-outliner',
      title: 'Outliner Tablo Görünümüne Geç',
      group: 'Görünüm',
      shortcut: 'Alt+3',
      run: () => setViewMode('outliner'),
    },
    {
      id: 'view-timeline',
      title: 'Zaman Çizelgesi (Timeline) Görünümüne Geç',
      group: 'Görünüm',
      shortcut: 'Alt+4',
      run: () => setViewMode('timeline'),
    },
    {
      id: 'view-codex',
      title: 'Codex / Karakter & Dünya Tasarımına Geç',
      group: 'Görünüm',
      shortcut: 'Alt+5',
      run: () => setViewMode('codex'),
    },
    {
      id: 'view-map',
      title: 'İnteraktif Dünya Haritası Görünümüne Geç',
      group: 'Görünüm',
      shortcut: 'Alt+6',
      run: () => setViewMode('map'),
    },
    {
      id: 'toggle-binder',
      title: 'Sol Panel: Binder Proje Ağacını Gizle / Göster',
      group: 'Görünüm',
      shortcut: 'Ctrl+Alt+B',
      run: handleToggleBinder,
    },
    {
      id: 'toggle-inspector',
      title: 'Sağ Panel: Inspector Bilgi Panelini Gizle / Göster',
      group: 'Görünüm',
      shortcut: 'Ctrl+Alt+I',
      run: handleToggleInspector,
    },
    {
      id: 'focus-mode',
      title: 'Odak Modunu Aç (Distraction-Free Zen)',
      group: 'Görünüm',
      shortcut: 'F11',
      run: () => setFocusModeOpen(true),
    },
    {
      id: 'split-view',
      title: 'Bölünmüş Ekranı Aç / Kapat (Çift Panel)',
      group: 'Görünüm',
      shortcut: 'Ctrl+\\',
      run: () => setSplitMode((prev) => (prev === 'off' ? 'vertical' : 'off')),
    },
    {
      id: 'search',
      title: 'Projeyi Ara (Tam Metin)',
      group: 'Arama',
      shortcut: 'Ctrl+K',
      run: () => setSearchOpen(true),
    },
    {
      id: 'compile',
      title: 'Projeyi Derle ve Dışa Aktar',
      group: 'Dışa Aktar',
      shortcut: 'Ctrl+E',
      run: () => setCompileOpen(true),
    },
    {
      id: 'scratchpad',
      title: 'Hızlı Not Defteri (Scratchpad)',
      group: 'Araçlar',
      shortcut: 'Ctrl+Shift+N',
      run: () => setScratchpadOpen((prev) => !prev),
    },
    {
      id: 'help-guide',
      title: 'Kullanım Rehberi & Kısayollar Kılavuzu',
      group: 'Yardım',
      shortcut: 'Shift+F1',
      run: () => setHelpModalOpen(true),
    },
    {
      id: 'customize-theme',
      title: 'Tema ve Tipografi Ayarları',
      group: 'Arayüz',
      shortcut: 'Ctrl+,',
      run: () => setThemeCustomizerOpen(true),
    },
    {
      id: 'toggle-sound',
      title: soundEnabled ? 'Daktilo Tuş Seslerini Kapat' : 'Daktilo Tuş Seslerini Aç (Web Audio)',
      group: 'Ses ve Efektler',
      shortcut: 'Alt+S',
      run: handleToggleSound,
    },
    {
      id: 'toggle-theme',
      title: 'Temayı Değiştir (Hızlı Açık / Koyu)',
      group: 'Arayüz',
      shortcut: 'Ctrl+T',
      run: () => toggleTheme(),
    },
    {
      id: 'open-health-audit',
      title: 'Proje Sağlık ve Kalite Denetimi HUD (Faz 89)',
      group: 'Stüdyo Araçları',
      shortcut: 'Ctrl+Shift+H',
      run: () => setHealthDashboardOpen(true),
    },
    {
      id: 'open-batch-export',
      title: 'Toplu Çoklu Format Dağıtım Kiti (Faz 97)',
      group: 'Dışa Aktar',
      run: () => setBatchExportOpen(true),
    },
    {
      id: 'open-backup-history',
      title: 'Yedekleme Geçmişi ve Çoklu Hedef Yedekleyici (Faz 93)',
      group: 'Stüdyo Araçları',
      run: () => setBackupManagerOpen(true),
    },
    {
      id: 'open-night-filter',
      title: 'Gece / Amber / OLED Siyah Filtre Ayarları (Faz 90)',
      group: 'Arayüz',
      run: () => setNightFilterOpen(true),
    },
    {
      id: 'open-snippets',
      title: 'Metin Genişletici & Makro Şablonlar (Faz 91)',
      group: 'Yazım Araçları',
      run: () => setSnippetsOpen(true),
    },
    {
      id: 'open-dictionary',
      title: 'Çevrimdışı Sözlük ve Etimoloji Arama (Faz 94)',
      group: 'Yazım Araçları',
      run: () => setDictionaryOpen(true),
    },
    {
      id: 'open-beta-feedback',
      title: 'Beta Okur Geri Bildirim Masası (Faz 88)',
      group: 'Yazım Araçları',
      run: () => setBetaFeedbackOpen(true),
    },
    {
      id: 'toggle-touch-mode',
      title: 'Tablet / Dokunmatik Modunu Aç / Kapat (Faz 98)',
      group: 'Arayüz',
      run: () => toggleTouchMode(),
    },
    {
      id: 'open-studio-tools',
      title: 'Tüm Stüdyo Modüllerini Listele (Faz 88-100)',
      group: 'Stüdyo Araçları',
      run: () => setToolsDrawerOpen(true),
    },
  ], [
    activeFolder?.id,
    addDoc,
    handleRetrySave,
    handleToggleBinder,
    handleToggleInspector,
    handleToggleSound,
    toggleTheme,
    toggleTouchMode,
    soundEnabled,
  ]);

  // Klavye kısayolları
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S -> Şimdi Kaydet
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        handleRetrySave();
        return;
      }
      // Ctrl+Alt+B -> Binder Toggle
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleToggleBinder();
        return;
      }
      // Ctrl+Alt+I -> Inspector Toggle
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        handleToggleInspector();
        return;
      }
      // Ctrl+Shift+P veya F1 -> Komut Paleti
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') || (e.key === 'F1' && !e.shiftKey)) {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
        return;
      }
      // Shift+F1 -> Yardım
      if (e.key === 'F1' && e.shiftKey) {
        e.preventDefault();
        setHelpModalOpen(true);
        return;
      }
      // Ctrl+K -> Arama
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
        return;
      }
      // F11 veya Ctrl+Shift+F -> Odak Modu
      if (e.key === 'F11' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f')) {
        e.preventDefault();
        setFocusModeOpen((prev) => !prev);
        return;
      }
      // Ctrl+Shift+N -> Scratchpad
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setScratchpadOpen((prev) => !prev);
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRetrySave, handleToggleBinder, handleToggleInspector]);

  return (
    <div className="desktop-app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Özel Pencere Başlık Çubuğu */}
      <CustomTitlebar
        projectName={project.name || 'OpenScriv Projesi'}
        activeDocTitle={activeDoc?.title}
      />

      <div className={`app ${theme === 'dark' ? 'dark' : ''}`} style={{ flex: 1, height: 'calc(100vh - 38px)', display: 'flex', flexDirection: 'column' }}>
        {/* Üst Navigasyon & Sadeleştirilmiş Bilgi Mimarisi (Faz 1) */}
        <TopNavigation
          projectName={project.name || 'OpenScriv Projesi'}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          binderVisible={binderVisible}
          onToggleBinder={handleToggleBinder}
          inspectorVisible={inspectorVisible}
          onToggleInspector={handleToggleInspector}
          onOpenWelcomeHub={() => setWelcomeHubOpen(true)}
          onOpenCompile={() => setCompileOpen(true)}
          onOpenFocusMode={() => setFocusModeOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
          onOpenScratchpad={() => setScratchpadOpen(true)}
          onOpenToolsDrawer={() => setToolsDrawerOpen(true)}
          onOpenThemeCustomizer={() => setThemeCustomizerOpen(true)}
          onOpenHelp={() => setHelpModalOpen(true)}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          wordCount={activeWords}
          splitMode={splitMode}
          onToggleSplit={() => setSplitMode((prev) => (prev === 'off' ? 'vertical' : 'off'))}
        />

        {/* Ana Çalışma Alanı: Binder + Merkez Görünüm + Inspector */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Sol Panel: Binder (Proje Ağacı) */}
          {binderVisible && (
            <aside className="sidebar" aria-label="Binder">
              <div className="brand">
                <div>
                  <strong>OpenScriv</strong>
                  <span>{project.name || 'OpenScriv Projesi'}</span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    className="icon-button"
                    type="button"
                    aria-label="Theme settings"
                    title="Lüks Tema & Tipografi Ayarları"
                    onClick={() => setThemeCustomizerOpen(true)}
                  >
                    <Palette size={17} />
                  </button>
                  <button
                    className="icon-button"
                    type="button"
                    aria-label="Toggle theme"
                    title="Temayı Değiştir"
                    onClick={toggleTheme}
                  >
                    {theme === 'dark' || theme === 'midnight-velvet' || theme === 'emerald-scholar' ? <Sun size={17} /> : <Moon size={17} />}
                  </button>
                </div>
              </div>

              {/* Hızlı Ekleme Butonları */}
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

              {/* Hızlı Arama Tetikleyici */}
              <input
                type="text"
                readOnly
                className="search-box"
                style={{ cursor: 'pointer', marginBottom: '12px' }}
                onClick={() => setSearchOpen(true)}
                role="button"
                tabIndex={0}
                aria-label="Arama Yap"
                value="Projeyi Ara (Ctrl+K)..."
              />

              {/* Binder Ağacı */}
              <Binder
                tree={tree}
                selectedId={selectedId as any}
                onSelectDoc={handleSelectDoc}
              />
            </aside>
          )}

          {/* Orta Panel: Editör / Corkboard / Outliner / Diğer Görünümler */}
          <main className="editor-shell" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
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

                  {viewMode === 'timeline' && (
                    <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg-panel, #faf9f5)', padding: '16px' }}>
                      <TimelineView />
                    </div>
                  )}

                  {viewMode === 'codex' && (
                    <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg-panel, #faf9f5)' }}>
                      <CodexManager />
                    </div>
                  )}

                  {viewMode === 'map' && (
                    <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg-panel, #faf9f5)' }}>
                      <InteractiveMapViewer
                        onSelectScene={handleSelectDocById}
                        documentTitleLookup={(id) => findNodeInTree(tree, id)?.title || `Sahne ${id}`}
                      />
                    </div>
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

            {/* Lüks Durum Çubuğu (True Save Contract Göstergeli - Faz 3) */}
            {/* @ts-ignore */}
            <StatusBar
              content={activeDoc?.content || ''}
              wordTarget={activeDoc?.metadata?.targetWords || 0}
              wordsToday={activeWords}
              lastSavedAt={lastSavedAt}
              saveStatus={saveStatus}
              onRetrySave={handleRetrySave}
              cursor={null}
              zoom={zoom}
              onZoomChange={handleZoomChange}
            />
          </main>

          {/* Sağ Panel: Inspector (Metadata, Snapshots, Hedefler) */}
          {inspectorVisible && (
            <aside className="inspector" style={{ display: 'flex', flexDirection: 'column' }}>
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

              {/* Inspector İçeriği */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {inspectorTab === 'metadata' && (
                  <Inspector
                    {...({
                      node: activeNode,
                      doc: activeDoc,
                      onUpdateDoc: handleContentChange,
                      onUpdateMetadata: (meta: any) => activeNode && updateMetadata(activeNode.id, meta),
                    } as any)}
                  />
                )}

                {inspectorTab === 'snapshots' && (
                  <Snapshots
                    {...({
                      document: activeDoc,
                      projectId: project.id || 'default',
                      onRestore: (docId: string, restoredText: string) => handleRestoreSnapshot(docId, restoredText),
                    } as any)}
                  />
                )}

                {inspectorTab === 'targets' && (
                  <WordCount
                    {...({
                      document: activeDoc,
                      tree: tree,
                      docTarget: activeDoc?.metadata?.targetWords || null,
                      projectTarget: 50000,
                    } as any)}
                  />
                )}
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Tüm Modalları ve Popupları Yöneten Dialog Host (Faz 1) */}
      <DialogHost
        tree={tree}
        project={project}
        activeDoc={activeDoc}
        allDocuments={allDocuments}
        commands={commands}
        theme={theme}
        typography={typography}
        scratchpadNotes={scratchpadNotes}
        touchModeEnabled={touchModeEnabled}
        themeCards={THEME_CARDS}
        fontChoices={FONT_CHOICES}
        lineHeightOptions={LINE_HEIGHT_OPTIONS}
        fontSizeRange={FONT_SIZE_RANGE}

        searchOpen={searchOpen}
        onCloseSearch={() => setSearchOpen(false)}
        onSelectDocById={handleSelectDocById}

        compileOpen={compileOpen}
        onCloseCompile={() => setCompileOpen(false)}

        focusModeOpen={focusModeOpen}
        onCloseFocusMode={() => setFocusModeOpen(false)}
        onContentChange={(content) => activeDoc && handleContentChange(activeDoc.id, content)}

        paletteOpen={paletteOpen}
        onClosePalette={() => setPaletteOpen(false)}

        themeCustomizerOpen={themeCustomizerOpen}
        onCloseThemeCustomizer={() => setThemeCustomizerOpen(false)}
        onThemeChange={(t) => setTheme(t)}
        onTypographyChange={setTypography}

        scratchpadOpen={scratchpadOpen}
        onCloseScratchpad={() => setScratchpadOpen(false)}
        onUpdateNotes={handleUpdateNotes}
        onSendToDraft={handleSendToDraft}

        toolsDrawerOpen={toolsDrawerOpen}
        onCloseToolsDrawer={() => setToolsDrawerOpen(false)}
        onOpenHealthAudit={() => { setToolsDrawerOpen(false); setHealthDashboardOpen(true); }}
        onOpenBatchExport={() => { setToolsDrawerOpen(false); setBatchExportOpen(true); }}
        onOpenBackupManager={() => { setToolsDrawerOpen(false); setBackupManagerOpen(true); }}
        onOpenNightFilter={() => { setToolsDrawerOpen(false); setNightFilterOpen(true); }}
        onOpenSnippets={() => { setToolsDrawerOpen(false); setSnippetsOpen(true); }}
        onOpenDictionary={() => { setToolsDrawerOpen(false); setDictionaryOpen(true); }}
        onOpenBetaFeedback={() => { setToolsDrawerOpen(false); setBetaFeedbackOpen(true); }}
        onToggleTouchMode={toggleTouchMode}

        healthDashboardOpen={healthDashboardOpen}
        onCloseHealthDashboard={() => setHealthDashboardOpen(false)}

        batchExportOpen={batchExportOpen}
        onCloseBatchExport={() => setBatchExportOpen(false)}

        backupManagerOpen={backupManagerOpen}
        onCloseBackupManager={() => setBackupManagerOpen(false)}
        onRestoreProject={(data) => {
          if (data?.tree) setProject((p: any) => ({ ...p, tree: data.tree }));
        }}

        nightFilterOpen={nightFilterOpen}
        onCloseNightFilter={() => setNightFilterOpen(false)}

        snippetsOpen={snippetsOpen}
        onCloseSnippets={() => setSnippetsOpen(false)}

        dictionaryOpen={dictionaryOpen}
        onCloseDictionary={() => setDictionaryOpen(false)}
        onInsertSynonym={(syn) => {
          if (activeDoc) {
            const updated = (activeDoc.content || '') + ' ' + syn;
            updateDocContent(activeDoc.id, updated);
          }
          setDictionaryOpen(false);
        }}

        betaFeedbackOpen={betaFeedbackOpen}
        onCloseBetaFeedback={() => setBetaFeedbackOpen(false)}

        welcomeHubOpen={welcomeHubOpen}
        onCloseWelcomeHub={() => setWelcomeHubOpen(false)}
        canCloseWelcomeHub={true}
        onOpenProjectPackage={handleOpenProjectPackage}
        onCreateNewProjectPackage={handleCreateNewProjectPackage}
        onLoadSampleProject={handleLoadSampleProject}

        helpModalOpen={helpModalOpen}
        onCloseHelpModal={() => setHelpModalOpen(false)}
        onOpenWelcomeHubFromHelp={() => setWelcomeHubOpen(true)}
      />
    </div>
  );
}

export default App;
