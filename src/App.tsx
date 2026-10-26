import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
import FocusMode from './components/FocusMode.jsx';
// @ts-ignore
import CommandPalette from './components/CommandPalette.jsx';
// @ts-ignore
import ThemeCustomizer from './components/ThemeCustomizer.jsx';
// @ts-ignore
import StatusBar from './components/StatusBar.jsx';
// @ts-ignore
import Scratchpad from './components/Scratchpad.jsx';
// @ts-ignore
import { useAutosave } from './hooks/useAutosave.js';
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
import { Palette, StickyNote, FolderOpen } from 'lucide-react';

import {
  FolderPlus,
  FilePlus,
  Moon,
  Sun,
  Search as SearchIcon,
  Download,
  LayoutGrid,
  List,
  Edit3,
  Columns,
  Command,
  Maximize2,
  Volume2,
  VolumeX,
  Clock,
  BookOpen,
  Map,
  Activity,
  PackageCheck,
  ShieldCheck,
  Zap,
  Book,
  Users,
  Tablet,
  Wrench,
  X,
} from 'lucide-react';
// @ts-ignore
import { soundEngine } from './utils/sound.js';
import { TimelineView } from './components/Timeline/TimelineView.tsx';
import CodexManager from './components/Codex/CodexManager';
import { InteractiveMapViewer } from './components/Map/InteractiveMapViewer.tsx';
import { ProjectHealthDashboard } from './components/Audit/ProjectHealthDashboard.tsx';
import { BatchExportModal } from './components/Publish/BatchExportModal.tsx';
import { BackupHistoryManager } from './components/Backup/BackupHistoryManager.tsx';
import { NightFilterSettings } from './components/Theme/NightFilterSettings.tsx';
import { SnippetManagerModal } from './components/Snippets/SnippetManagerModal.tsx';
import { DictionaryLookupPopover } from './components/Dictionary/DictionaryLookupPopover.tsx';
import { BetaReaderFeedbackView } from './components/Feedback/BetaReaderFeedbackView.tsx';
import { useTouchModeStore } from './services/platform/touchModeAdapter';
import CustomTitlebar from './components/Window/CustomTitlebar.tsx';
import WelcomeScreen, { type RecentProject } from './components/Project/WelcomeScreen.tsx';
// @ts-ignore
import { loadRecent, rememberProject, forgetProject } from './state/recentProjects.js';

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

const VIEW_TABS = [
  { id: 'editor', label: 'Editör', title: 'Metin editörü', icon: Edit3 },
  { id: 'corkboard', label: 'Pano', title: 'Mantar pano', icon: LayoutGrid },
  { id: 'outliner', label: 'Ana Hat', title: 'Ana hat (tablo görünümü)', icon: List },
  { id: 'timeline', label: 'Zaman', title: 'Zaman çizelgesi', icon: Clock },
  { id: 'codex', label: 'Evren', title: 'Karakterler ve evren', icon: BookOpen },
  { id: 'map', label: 'Harita', title: 'Etkileşimli harita', icon: Map },
] as const;

const DARK_THEMES = ['dark', 'midnight-velvet', 'emerald-scholar'];

const PROJECT_ID = 'default';
const WEB_TREE_KEY = `openscriv:tree:${PROJECT_ID}`;

// Masaüstünde preload köprüsü; tarayıcıda (vite dev, testler) localStorage.
function desktopBridge(): any {
  return (window as any).electronAPI;
}

// Masaüstü: her proje bir .opscriv paketi. Tarayıcı: tek proje, localStorage.
function packageMode(): boolean {
  return Boolean(desktopBridge()?.readPackage);
}

function readWebTree(): any[] | null {
  if (packageMode()) return null;
  try {
    const tree = JSON.parse(window.localStorage.getItem(WEB_TREE_KEY) || 'null');
    return Array.isArray(tree) && tree.length ? tree : null;
  } catch {
    return null;
  }
}

type SavePayload = { packagePath: string | null; name: string; tree: any[] };

// packagePath kayıt zamanlandığında yakalanır: proje değişse bile eski kayıt yeni pakete yazılmaz.
async function saveProject({ packagePath, name, tree }: SavePayload) {
  if (packageMode()) {
    if (!packagePath) return { ok: false, error: 'Açık proje yok.' };
    return desktopBridge().savePackage({ packagePath, name, tree });
  }
  window.localStorage.setItem(WEB_TREE_KEY, JSON.stringify(tree));
  return { ok: true };
}

function starterTree() {
  const t = Date.now();
  return [
    {
      id: `folder-${t}`,
      type: 'folder',
      title: 'Taslak',
      metadata: { ...DEFAULT_METADATA },
      children: [{ id: `doc-${t}`, type: 'doc', title: 'Bölüm 1', content: '', metadata: { ...DEFAULT_METADATA } }],
    },
    { id: `folder-${t + 1}`, type: 'folder', title: 'Araştırma & Notlar', metadata: { ...DEFAULT_METADATA }, children: [] },
  ];
}

function flattenDocs(nodes: any[]): { id: string; title: string; content?: string }[] {
  const result: { id: string; title: string; content?: string }[] = [];
  for (const n of nodes || []) {
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
  const isDarkTheme = DARK_THEMES.includes(theme);

  // Disk kalıcılığı: ad + ağaç (içerik dahil) debounce ile açık pakete yazılır.
  const {
    state: saveState,
    lastSavedAt,
    schedule: scheduleSave,
    flush: flushSave,
    isDirty,
  } = useAutosave(saveProject);

  // Bir proje yüklenene kadar kayıt kapalı; yoksa örnek ağaç gerçek bir projenin üzerine yazılır.
  const loadedRef = useRef(!packageMode());
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'welcome'>(
    loadedRef.current ? 'ready' : 'loading'
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const projectPathRef = useRef<string | null>(null);
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [projectId, setProjectId] = useState(PROJECT_ID);
  const [recent, setRecent] = useState<RecentProject[]>(() => loadRecent());
  const [defaultDir, setDefaultDir] = useState('');
  const [legacyTree, setLegacyTree] = useState<any[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingName, setEditingName] = useState(false);

  const handlePersist = useCallback((stampedProject: any) => {
    if (loadedRef.current) {
      scheduleSave({ packagePath: projectPathRef.current, name: stampedProject.name, tree: stampedProject.tree });
    }
  }, [scheduleSave]);

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
    initialTree: (readWebTree() || INITIAL_TREE) as any,
    projectName: 'OpenScriv Projesi',
    onPersist: handlePersist,
  });

  // Seçili düğüm
  const firstDoc = useMemo(() => findFirstDoc(tree) || tree[0] || null, [tree]);
  const [selectedId, setSelectedId] = useState<string>(() => firstDoc?.id || 'doc-chapter-1');

  // Görünüm modu: 'editor' | 'corkboard' | 'outliner' | 'timeline' | 'codex' | 'map'
  const [viewMode, setViewMode] = useState<'editor' | 'corkboard' | 'outliner' | 'timeline' | 'codex' | 'map'>('editor');

  // Inspector sekmesi: 'metadata' | 'snapshots' | 'targets'
  const [inspectorTab, setInspectorTab] = useState<'metadata' | 'snapshots' | 'targets'>('metadata');

  // Modallar ve Paneller
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
      {
        id: 'note-init-2',
        text: 'Bölüm 2 için araştırma: 1920\'ler tren saatleri ve istasyon mimarisi.',
        color: 'ivory',
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
    // Doküman seçiliyse ana klasörü bul veya ilk klasörü dön
    return tree.find((n: any) => n.type === 'folder') || { id: 'root', type: 'folder', title: 'Tüm Belgeler', children: tree };
  }, [activeNode, tree]);

  // --- Projeler (.opscriv paketleri) ---

  const showWelcome = useCallback((error: string | null = null) => {
    loadedRef.current = false; // karşılama ekranındayken hiçbir şey kaydedilmez
    setLoadError(error);
    setRecent(loadRecent());
    setLoadState('welcome');
  }, []);

  const openProject = useCallback(async (packagePath: string) => {
    setBusy(true);
    try {
      await flushSave(); // önceki projenin bekleyen kaydı, kendi paketine
      const res = await desktopBridge().readPackage({ packagePath });
      if (!res?.ok) {
        showWelcome(`Proje açılamadı: ${packagePath}\n${res?.error || ''}`);
        return;
      }
      loadedRef.current = false;
      projectPathRef.current = res.packagePath;
      setProjectPath(res.packagePath);
      setProjectId(res.manifest.id || PROJECT_ID);
      setProject((p: any) => ({ ...p, name: res.manifest.name, tree: res.tree }));
      const first = findFirstDoc(res.tree);
      setSelectedId(first?.id || '');
      setOpenTabs(first ? [{ id: first.id, title: first.title }] : []);
      setSecondaryDocId(first?.id || '');
      setViewMode('editor');
      setRecent(rememberProject(res.packagePath, res.manifest.name));
      loadedRef.current = true;
      setLoadError(null);
      setLoadState('ready');
    } finally {
      setBusy(false);
    }
  }, [flushSave, setProject, showWelcome]);

  const createProject = useCallback(async ({ name, parentDir, importLegacy }: { name: string; parentDir: string; importLegacy: boolean }) => {
    setBusy(true);
    let res: any;
    try {
      res = await desktopBridge().createPackage({
        parentDir,
        projectName: name,
        initialTree: importLegacy && legacyTree ? legacyTree : starterTree(),
      });
    } finally {
      setBusy(false);
    }
    if (!res?.ok) {
      setLoadError(res?.error || 'Proje oluşturulamadı.');
      return;
    }
    // Diskten geri okuyarak aç: yazılanın gerçekten okunabildiğini de doğrular.
    await openProject(res.packagePath);
  }, [legacyTree, openProject]);

  const pickDir = useCallback(async (title: string, buttonLabel: string) => {
    const res = await desktopBridge().pickDirectory({ title, buttonLabel });
    return res && !res.canceled && res.path ? (res.path as string) : null;
  }, []);

  const openOtherProject = useCallback(async () => {
    const picked = await pickDir('Proje aç: .opscriv klasörünü seçin', 'Aç');
    if (picked) await openProject(picked);
  }, [pickDir, openProject]);

  // Proje değiştir: önce bekleyen kaydı yaz; yazılamadıysa sor.
  const switchProject = useCallback(async () => {
    await flushSave();
    if (isDirty() && !window.confirm('Son değişiklikler kaydedilemedi. Yine de proje değiştirilsin mi?')) return;
    showWelcome();
  }, [flushSave, isDirty, showWelcome]);

  // Açılış: en son projeyi aç; yoksa karşılama ekranı.
  useEffect(() => {
    if (!packageMode()) return;
    const last = loadRecent()[0];
    if (last) openProject(last.path);
    else showWelcome();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Karşılama ekranı verileri: varsayılan konum ve eski tek-proje çalışması (tree.json)
  useEffect(() => {
    if (loadState !== 'welcome') return;
    const api = desktopBridge();
    api.defaultProjectDir?.().then((dir: string) => setDefaultDir(dir));
    api.loadProjectTree?.({ projectId: PROJECT_ID }).then((res: any) => {
      setLegacyTree(res?.ok && Array.isArray(res.tree) && res.tree.length ? res.tree : null);
    });
  }, [loadState]);

  // Yerel Dosya menüsü (Ctrl+N / Ctrl+O / Ctrl+S kısayolları sayfaya ulaşmadan menüde yakalanır)
  useEffect(() => {
    const api = desktopBridge();
    if (!api?.on) return undefined;
    return api.on('menu:action', (_e: unknown, msg: { action?: string }) => {
      switch (msg?.action) {
        case 'file:new-project':
          switchProject();
          break;
        case 'file:open-project':
          openOtherProject();
          break;
        case 'file:save':
          flushSave();
          break;
        case 'file:compile':
          setCompileOpen(true);
          break;
        case 'file:batch-export':
          setBatchExportOpen(true);
          break;
        default:
          break;
      }
    });
  }, [switchProject, openOtherProject, flushSave]);

  // Kapanışta bekleyen kaydı yaz; yazılamazsa kullanıcıya sor.
  useEffect(() => {
    let closing = false;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (closing || !isDirty()) return;
      e.preventDefault();
      e.returnValue = false as any;
      flushSave().then(() => {
        if (!isDirty() || window.confirm('Son değişiklikler kaydedilemedi. Yine de kapatılsın mı?')) {
          closing = true;
          window.close();
        }
      });
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [flushSave, isDirty]);

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

  const handleContentChange = useCallback((docId: string, newContent: string, html?: string) => {
    updateDocContent(docId, newContent, html);
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

  // Komut Paleti eylemleri
  const commands = useMemo(() => [
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
      title: 'Mantar Pano Görünümüne Geç',
      group: 'Görünüm',
      shortcut: 'Alt+2',
      run: () => setViewMode('corkboard'),
    },
    {
      id: 'view-outliner',
      title: 'Ana Hat Görünümüne Geç',
      group: 'Görünüm',
      shortcut: 'Alt+3',
      run: () => setViewMode('outliner'),
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
      id: 'customize-theme',
      title: 'Tema ve Tipografi Ayarları (Oxford, Midnight, vb.)',
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
      id: 'inspector-meta',
      title: 'Bilgi Paneli: Doküman Bilgisi ve Özet',
      group: 'Bilgi Paneli',
      run: () => setInspectorTab('metadata'),
    },
    {
      id: 'inspector-snapshots',
      title: 'Bilgi Paneli: Sürümler',
      group: 'Bilgi Paneli',
      run: () => setInspectorTab('snapshots'),
    },
    {
      id: 'inspector-targets',
      title: 'Bilgi Paneli: Kelime ve Hedef Takibi',
      group: 'Bilgi Paneli',
      run: () => setInspectorTab('targets'),
    },
    {
      id: 'view-timeline',
      title: 'Zaman Çizelgesi Görünümüne Geç',
      group: 'Görünüm',
      shortcut: 'Alt+4',
      run: () => setViewMode('timeline'),
    },
    {
      id: 'view-codex',
      title: 'Karakterler ve Evren Görünümüne Geç',
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
      id: 'open-health-audit',
      title: 'Proje Sağlık ve Kalite Denetimi HUD',
      group: 'Stüdyo Araçları',
      shortcut: 'Ctrl+Shift+H',
      run: () => setHealthDashboardOpen(true),
    },
    {
      id: 'open-batch-export',
      title: 'Toplu Çoklu Format Dağıtım Kiti',
      group: 'Dışa Aktar',
      run: () => setBatchExportOpen(true),
    },
    {
      id: 'open-backup-history',
      title: 'Yedekleme Geçmişi ve Çoklu Hedef Yedekleyici',
      group: 'Stüdyo Araçları',
      run: () => setBackupManagerOpen(true),
    },
    {
      id: 'open-night-filter',
      title: 'Gece / Amber / OLED Siyah Filtre Ayarları',
      group: 'Arayüz',
      run: () => setNightFilterOpen(true),
    },
    {
      id: 'open-snippets',
      title: 'Metin Genişletici & Makro Şablonlar',
      group: 'Yazım Araçları',
      run: () => setSnippetsOpen(true),
    },
    {
      id: 'open-dictionary',
      title: 'Çevrimdışı Sözlük ve Etimoloji Arama',
      group: 'Yazım Araçları',
      run: () => setDictionaryOpen(true),
    },
    {
      id: 'open-beta-feedback',
      title: 'Beta Okur Geri Bildirim Masası',
      group: 'Yazım Araçları',
      run: () => setBetaFeedbackOpen(true),
    },
    {
      id: 'toggle-touch-mode',
      title: 'Tablet / Dokunmatik Modunu Aç / Kapat',
      group: 'Arayüz',
      run: () => toggleTouchMode(),
    },
    {
      id: 'open-studio-tools',
      title: 'Tüm Stüdyo Modüllerini Listele',
      group: 'Stüdyo Araçları',
      run: () => setToolsDrawerOpen(true),
    },
  ], [activeFolder?.id, addDoc, toggleTheme, toggleTouchMode]);

  // Klavye kısayolları
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+P veya F1 -> Komut Paleti
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') || e.key === 'F1') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === 'F11' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f')) {
        e.preventDefault();
        setFocusModeOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setScratchpadOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        flushSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flushSave]);

  if (loadState === 'loading') {
    return (
      <div
        className="desktop-app-container"
        role="status"
        style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
      >
        Proje yükleniyor…
      </div>
    );
  }

  if (loadState === 'welcome') {
    return (
      <div className="desktop-app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <CustomTitlebar projectName="OpenScriv" />
        <WelcomeScreen
          recent={recent}
          defaultDir={defaultDir}
          legacyDocCount={legacyTree ? flattenDocs(legacyTree).length : 0}
          busy={busy}
          error={loadError}
          onCreate={createProject}
          onPickDir={() => pickDir('Projenin oluşturulacağı klasörü seçin', 'Seç')}
          onOpenRecent={openProject}
          onOpenOther={openOtherProject}
          onForget={(path) => setRecent(forgetProject(path))}
          onCancel={
            projectPath
              ? () => {
                  loadedRef.current = true;
                  setLoadError(null);
                  setLoadState('ready');
                }
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="desktop-app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <CustomTitlebar
        projectName={project.name || 'OpenScriv Projesi'}
        activeDocTitle={activeDoc?.title}
      />
      <div className="app" style={{ flex: 1, height: 'calc(100vh - 38px)' }}>
        {/* Sol Panel: Proje Ağacı */}
      <aside className="sidebar" aria-label="Proje ağacı">
        <div className="brand">
          <div className="brand__name">
            {editingName ? (
              <input
                className="brand__input"
                defaultValue={project.name}
                autoFocus
                aria-label="Proje adı"
                onFocus={(e) => e.currentTarget.select()}
                onBlur={(e) => {
                  const next = e.currentTarget.value.trim();
                  setEditingName(false);
                  if (next && next !== project.name) setProject((p: any) => ({ ...p, name: next }));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                  if (e.key === 'Escape') setEditingName(false);
                }}
              />
            ) : (
              <strong title="Yeniden adlandırmak için çift tıklayın" onDoubleClick={() => setEditingName(true)}>
                {project.name || 'OpenScriv Projesi'}
              </strong>
            )}
            <span>OpenScriv</span>
          </div>
          <div className="toolbar__group">
            {projectPath && (
              <button
                className="btn btn--ghost btn--icon"
                type="button"
                aria-label="Projeler"
                title="Proje aç veya yeni proje oluştur"
                onClick={switchProject}
              >
                <FolderOpen size={16} />
              </button>
            )}
            <button
              className="btn btn--ghost btn--icon"
              type="button"
              aria-label="Tema ve yazı tipi ayarları"
              title="Tema ve yazı tipi ayarları"
              onClick={() => setThemeCustomizerOpen(true)}
            >
              <Palette size={16} />
            </button>
            <button
              className="btn btn--ghost btn--icon"
              type="button"
              aria-label={isDarkTheme ? 'Açık temaya geç' : 'Koyu temaya geç'}
              title={isDarkTheme ? 'Açık temaya geç' : 'Koyu temaya geç'}
              onClick={toggleTheme}
            >
              {isDarkTheme ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        {/* Hızlı Butonlar */}
        <div className="sidebar__actions">
          <button
            type="button"
            className="btn"
            title="Yeni doküman ekle"
            onClick={() => addDoc('Yeni Bölüm', activeFolder?.id, undefined)}
          >
            <FilePlus size={15} /> Doküman
          </button>
          <button
            type="button"
            className="btn"
            title="Yeni klasör ekle"
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
          >
            <FolderPlus size={15} /> Klasör
          </button>
        </div>

        {/* Arama */}
        <button type="button" className="search-box" aria-label="Projede ara" onClick={() => setSearchOpen(true)}>
          <SearchIcon size={14} /> Projede ara <kbd>Ctrl+K</kbd>
        </button>

        {/* Proje Ağacı */}
        <Binder
          tree={tree}
          selectedId={selectedId as any}
          onSelectDoc={handleSelectDoc}
        />
      </aside>

      {/* Orta Panel: Editör / Corkboard / Outliner */}
      <main className="editor-shell">
        {/* Üst araç çubuğu: görünüm seçici + eylemler */}
        <header className="toolbar">
          <nav className="segmented" aria-label="Görünüm">
            {VIEW_TABS.map(({ id, label, title, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`btn${viewMode === id ? ' is-active' : ''}`}
                title={title}
                aria-label={title}
                aria-pressed={viewMode === id}
                onClick={() => setViewMode(id)}
              >
                <Icon size={15} />
                <span className="btn__label">{label}</span>
              </button>
            ))}
          </nav>

          <div className="toolbar__group">
            <button
              type="button"
              className="btn btn--ghost btn--icon"
              title="Stüdyo araçları"
              aria-label="Stüdyo araçları"
              onClick={() => setToolsDrawerOpen(true)}
            >
              <Wrench size={16} />
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--icon"
              title="Komut paleti (Ctrl+Shift+P)"
              aria-label="Komut paleti"
              onClick={() => setPaletteOpen(true)}
            >
              <Command size={16} />
            </button>
            <span className="toolbar__divider" aria-hidden="true" />
            <button
              type="button"
              className="btn btn--ghost btn--icon"
              title={soundEnabled ? 'Daktilo seslerini kapat' : 'Daktilo seslerini aç'}
              aria-label="Daktilo sesleri"
              aria-pressed={soundEnabled}
              onClick={handleToggleSound}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--icon"
              title="Not defteri (Ctrl+Shift+N)"
              aria-label="Not defteri"
              aria-pressed={scratchpadOpen}
              onClick={() => setScratchpadOpen((prev) => !prev)}
            >
              <StickyNote size={16} />
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--icon"
              title={splitMode === 'off' ? 'Ekranı ikiye böl' : 'Tek panele dön'}
              aria-label="Bölünmüş ekran"
              aria-pressed={splitMode !== 'off'}
              onClick={() => setSplitMode((prev) => (prev === 'off' ? 'vertical' : 'off'))}
            >
              <Columns size={16} />
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--icon"
              title="Odak modu (F11)"
              aria-label="Odak modu"
              onClick={() => setFocusModeOpen(true)}
            >
              <Maximize2 size={16} />
            </button>
            <button
              type="button"
              className="btn btn--primary"
              title="Projeyi derle ve dışa aktar"
              onClick={() => setCompileOpen(true)}
            >
              <Download size={15} />
              <span className="btn__label">Derle</span>
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
                  onRename={renameNode}
                  saveState={saveState}
                  lastSavedAt={lastSavedAt}
                  ariaLabel="Metin editörü"
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
                      onRename={renameNode}
                      saveState={saveState}
                      lastSavedAt={lastSavedAt}
                      ariaLabel="Metin editörü"
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
                      {allDocuments.map((d) => (
                        <option key={d.id} value={d.id}>{d.title}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <Editor
                      document={findNodeInTree(tree, secondaryDocId) || activeDoc}
                      onChange={handleContentChange}
                      onRename={renameNode}
                      ariaLabel="İkincil editör"
                    />
                  </div>
                </div>
              }
            />
          )}
        </div>

        {/* Lüks Durum Çubuğu */}
        {/* @ts-ignore */}
        <StatusBar
          content={activeDoc?.content || ''}
          wordTarget={activeDoc?.metadata?.targetWords || 0}
          wordsToday={activeWords}
          lastSavedAt={lastSavedAt}
          cursor={null}
          zoom={zoom}
          onZoomChange={handleZoomChange}
        />
      </main>

      {/* Sağ Panel: Bilgi Paneli (Bilgi, Sürümler, Hedef) */}
      <aside className="inspector" aria-label="Bilgi paneli">
        <nav className="segmented segmented--fill" aria-label="Bilgi paneli sekmeleri">
          <button
            type="button"
            className={`btn${inspectorTab === 'metadata' ? ' is-active' : ''}`}
            aria-pressed={inspectorTab === 'metadata'}
            onClick={() => setInspectorTab('metadata')}
            title="Doküman bilgisi ve özet"
          >
            Bilgi
          </button>
          <button
            type="button"
            className={`btn${inspectorTab === 'snapshots' ? ' is-active' : ''}`}
            aria-pressed={inspectorTab === 'snapshots'}
            onClick={() => setInspectorTab('snapshots')}
            title="Sürümler (anlık görüntüler)"
          >
            Sürümler
          </button>
          <button
            type="button"
            className={`btn${inspectorTab === 'targets' ? ' is-active' : ''}`}
            aria-pressed={inspectorTab === 'targets'}
            onClick={() => setInspectorTab('targets')}
            title="Kelime ve hedef takibi"
          >
            Hedef
          </button>
        </nav>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {inspectorTab === 'metadata' && (
            <Inspector
              node={activeNode}
              onUpdateMetadata={updateMetadata}
              ariaLabel=""
            />
          )}

          {inspectorTab === 'snapshots' && (
            <Snapshots
              document={activeDoc}
              projectId={projectId}
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
        projectId={projectId}
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectDoc={handleSelectDocById}
      />

      {/* Derleme Diyaloğu (Modal) */}
      <CompileDialog
        open={compileOpen}
        tree={tree}
        projectId={projectId}
        projectName={project.name || 'OpenScriv Projesi'}
        onClose={() => setCompileOpen(false)}
      />

      {/* Odak Modu (Zen & Daktilo) */}
      {/* @ts-ignore */}
      <FocusMode
        open={focusModeOpen}
        onClose={() => setFocusModeOpen(false)}
        doc={activeDoc}
        onChange={handleContentChange}
        saveState={saveState}
      />

      {/* Hızlı Komut Paleti */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={commands as any}
      />

      {/* Lüks Tema & Tipografi Özelleştirme */}
      {/* @ts-ignore */}
      <ThemeCustomizer
        open={themeCustomizerOpen}
        onClose={() => setThemeCustomizerOpen(false)}
        themeName={theme}
        themes={THEME_CARDS}
        onThemeChange={(newTheme: string) => setTheme(newTheme)}
        typography={typography}
        fontChoices={FONT_CHOICES}
        lineHeightOptions={LINE_HEIGHT_OPTIONS}
        fontSizeRange={FONT_SIZE_RANGE}
        onTypographyChange={setTypography}
      />

      {/* Yüzen Not Defteri / Karalama Alanı */}
      {/* @ts-ignore */}
      <Scratchpad
        open={scratchpadOpen}
        onClose={() => setScratchpadOpen(false)}
        notes={scratchpadNotes}
        onChangeNotes={handleUpdateNotes}
        activeDocId={activeDoc?.id || null}
        activeDocTitle={activeDoc?.title || null}
        onSendToDraft={handleSendToDraft}
      />

      {/* Stüdyo Modülleri & Araçlar Merkezi (Faz 88-100) */}
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
                onClick={() => setToolsDrawerOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            
            <div style={{ padding: '20px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '14px' }}>
              <div
                onClick={() => { setToolsDrawerOpen(false); setHealthDashboardOpen(true); }}
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
                onClick={() => { setToolsDrawerOpen(false); setBatchExportOpen(true); }}
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
                onClick={() => { setToolsDrawerOpen(false); setBackupManagerOpen(true); }}
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
                onClick={() => { setToolsDrawerOpen(false); setNightFilterOpen(true); }}
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
                onClick={() => { setToolsDrawerOpen(false); setSnippetsOpen(true); }}
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
                onClick={() => { setToolsDrawerOpen(false); setDictionaryOpen(true); }}
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
                onClick={() => { setToolsDrawerOpen(false); setBetaFeedbackOpen(true); }}
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
                onClick={() => { toggleTouchMode(); }}
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

      {/* Proje Sağlık Denetimi HUD Modal (Faz 89) */}
      {healthDashboardOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'var(--bg-panel, #faf9f5)', width: '100%', maxWidth: '960px', maxHeight: '90vh', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)' }}>
            <ProjectHealthDashboard
              documents={allDocuments}
              onNavigateToDocument={(docId) => {
                handleSelectDocById(docId);
                setHealthDashboardOpen(false);
              }}
              onClose={() => setHealthDashboardOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Toplu Çoklu Format Dağıtım Kiti Modal (Faz 97) */}
      {batchExportOpen && (
        <BatchExportModal
          documents={allDocuments}
          projectName={project.name || 'OpenScriv Projesi'}
          authorName="Yazar"
          onClose={() => setBatchExportOpen(false)}
        />
      )}

      {/* Yedekleme Geçmişi & Çoklu Hedef Yedekleyici Modal (Faz 93) */}
      {backupManagerOpen && (
        <BackupHistoryManager
          projectName={project.name || 'OpenScriv Projesi'}
          getCurrentProjectData={() => ({ documents: allDocuments, tree })}
          onRestoreProject={(data) => {
            if (data?.tree) setProject((p: any) => ({ ...p, tree: data.tree }));
          }}
          onClose={() => setBackupManagerOpen(false)}
        />
      )}

      {/* Gece / Amber / OLED Siyah Filtre Ayarları Modal (Faz 90) */}
      {nightFilterOpen && (
        <NightFilterSettings onClose={() => setNightFilterOpen(false)} />
      )}

      {/* Metin Genişletici & Makro Şablonlar Modal (Faz 91) */}
      {snippetsOpen && (
        <SnippetManagerModal
          currentDocTitle={activeDoc?.title || 'Bölüm'}
          onClose={() => setSnippetsOpen(false)}
        />
      )}

      {/* Çevrimdışı Sözlük & Etimoloji Arama Popover (Faz 94) */}
      {dictionaryOpen && (
        <DictionaryLookupPopover
          initialWord="kurgu"
          onClose={() => setDictionaryOpen(false)}
          onSelectSynonym={(syn) => {
            if (activeDoc) {
              const updated = (activeDoc.content || '') + ' ' + syn;
              updateDocContent(activeDoc.id, updated);
            }
            setDictionaryOpen(false);
          }}
        />
      )}

      {/* Beta Okur Geri Bildirim Masası Modal (Faz 88) */}
      {betaFeedbackOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'var(--bg-panel, #faf9f5)', width: '100%', maxWidth: '960px', maxHeight: '90vh', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)', position: 'relative' }}>
            <div style={{ padding: '12px 16px', background: 'var(--bg-header, #ece8dd)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Beta Okur Geri Bildirim Masası</span>
              <button className="icon-button" style={{ width: '28px', height: '28px' }} onClick={() => setBetaFeedbackOpen(false)}>✕</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
              <BetaReaderFeedbackView
                currentDocumentId={activeDoc?.id}
                onSelectDocument={(docId) => {
                  handleSelectDocById(docId);
                  setBetaFeedbackOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default App;
