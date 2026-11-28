// Faz 128 - Belge Dışa Aktarma Sırası & Öncelik Motoru (Compile Order & Priority Engine)
//
// Saf (pure) ve deterministik servis: bir belge ağacını (Binder ağacı) ve kullanıcı
// tercihlerini alır; dışa aktarılacak belgelerin TAM sıralı listesini ve her belge için
// dahil/hariç gerekçesini döndürür.
//
// Özellikler:
// - Strateji: "manual" | "alphabetical" | "priority" | "status"
// - Öncelik 1-5 (küçük = daha önce), eşitlikte manuel sıra (stable sort) korunur.
// - `includeInCompile: false` işaretli alt ağaç tamamen hariç tutulur.
// - Durum filtresi (statusFilter: string[] | undefined) aktifse yalnızca o durumlar dahil.
// - Döngüsel ebeveyn referansı güvenli biçimde kırılır (cycle detection).
// - Tüm girdi dizileri mutasyona uğratılmaz; yeni diziler döndürülür.

export type CompileSortStrategy =
  | "manual"
  | "alphabetical"
  | "priority"
  | "status";

export type CompileDocumentStatus =
  | "draft"
  | "revised"
  | "final"
  | "done"
  | string;

export interface CompileDocumentNode {
  id: string;
  title: string;
  /** Aynı ebeveyn altındaki manuel sıra (küçük = daha önce). */
  order: number;
  /** 1 (en yüksek) - 5 (en düşük). Tanımsız ise 3 varsayılır. */
  priority?: number;
  status?: CompileDocumentStatus;
  /** false ise bu düğüm ve tüm alt ağacı dışa aktarmadan çıkarılır. */
  includeInCompile?: boolean;
  /** Klasör (container) düğümleri için alt öğeler. */
  children?: CompileDocumentNode[];
}

export interface CompilePreferences {
  strategy: CompileSortStrategy;
  /** Yalnızca bu durum kodlarındaki belgeleri dahil et. Boş/undefined = hepsi. */
  statusFilter?: CompileDocumentStatus[];
  /** Öncelik aralığı (dahil). Örn. [1,3] -> önceliği 1,2,3 olanlar. */
  priorityRange?: [number, number];
  /** "priority" stratejisinde önceliğe göre artan mı azalan mı sıralansın. */
  priorityDirection?: "asc" | "desc";
  /** "alphabetical" stratejisinde büyük/küçük harf duyarsız sıralama. */
  caseInsensitive?: boolean;
}

export type CompileExclusionReason =
  | "include-flag-false"
  | "status-filter"
  | "priority-filter";

export interface CompileExcludedDocument {
  id: string;
  title: string;
  reason: CompileExclusionReason;
}

export interface CompileOrderEntry {
  id: string;
  title: string;
  /** Ağaçtaki kök-içi pozisyon (kardeşler arası sıra). */
  siblingIndex: number;
  /** Ağaçtaki derinlik (kök = 0). */
  depth: number;
  priority: number;
  status: CompileDocumentStatus;
}

export interface CompileOrderResult {
  included: CompileOrderEntry[];
  excluded: CompileExcludedDocument[];
  cycles: string[][];
  summary: {
    totalInput: number;
    includedCount: number;
    excludedCount: number;
    cycleCount: number;
  };
}

const DEFAULT_PRIORITY = 3;
const MIN_PRIORITY = 1;
const MAX_PRIORITY = 5;

function clampPriority(p: unknown): number {
  if (typeof p !== "number" || !Number.isFinite(p)) return DEFAULT_PRIORITY;
  if (p < MIN_PRIORITY) return MIN_PRIORITY;
  if (p > MAX_PRIORITY) return MAX_PRIORITY;
  return Math.floor(p);
}

function normalizeStatus(s: unknown): CompileDocumentStatus {
  if (typeof s !== "string" || s.length === 0) return "draft";
  return s;
}

/**
 * Ağaçtaki toplam düğüm sayısını sayar (döngü koruması ile).
 */
function countNodes(nodes: CompileDocumentNode[] | undefined): number {
  if (!Array.isArray(nodes) || nodes.length === 0) return 0;
  const seen = new Set<CompileDocumentNode>();
  let count = 0;
  const stack: CompileDocumentNode[] = [...nodes];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (!node || seen.has(node)) continue;
    seen.add(node);
    count += 1;
    if (Array.isArray(node.children)) {
      for (const child of node.children) stack.push(child);
    }
  }
  return count;
}

/**
 * Ağaçta paylaşılan referansları (aynı node objesinin birden fazla ebeveyn altında
 * görünmesi) tespit eder ve döngü olarak raporlar.
 */
function detectCycles(nodes: CompileDocumentNode[] | undefined): string[][] {
  if (!Array.isArray(nodes) || nodes.length === 0) return [];
  const cycles: string[][] = [];
  const inStack = new Set<CompileDocumentNode>();
  const visited = new Set<CompileDocumentNode>();

  const walk = (node: CompileDocumentNode, path: string[]): void => {
    if (!node) return;
    if (inStack.has(node)) {
      const startIdx = path.indexOf(node.id);
      if (startIdx >= 0) {
        cycles.push(path.slice(startIdx).concat(node.id));
      } else {
        cycles.push([...path, node.id]);
      }
      return;
    }
    if (visited.has(node)) return;
    inStack.add(node);
    visited.add(node);
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        walk(child, [...path, node.id]);
      }
    }
    inStack.delete(node);
  };

  for (const root of nodes) walk(root, []);
  return cycles;
}

function isStatusAllowed(
  status: CompileDocumentStatus,
  filter: CompileDocumentStatus[] | undefined
): boolean {
  if (!filter || filter.length === 0) return true;
  return filter.includes(status);
}

function isPriorityAllowed(
  priority: number,
  range: [number, number] | undefined
): boolean {
  if (!range) return true;
  const [lo, hi] = range;
  return priority >= lo && priority <= hi;
}

function comparatorFor(
  strategy: CompileSortStrategy,
  prefs: CompilePreferences
): (
  a: { node: CompileDocumentNode; priority: number; status: CompileDocumentStatus },
  b: { node: CompileDocumentNode; priority: number; status: CompileDocumentStatus }
) => number {
  if (strategy === "alphabetical") {
    const ci = prefs.caseInsensitive !== false;
    return (a, b) => {
      const at = ci ? a.node.title.toLowerCase() : a.node.title;
      const bt = ci ? b.node.title.toLowerCase() : b.node.title;
      if (at < bt) return -1;
      if (at > bt) return 1;
      return a.node.order - b.node.order;
    };
  }
  if (strategy === "priority") {
    const dir = prefs.priorityDirection === "desc" ? -1 : 1;
    return (a, b) => {
      const diff = (a.priority - b.priority) * dir;
      if (diff !== 0) return diff;
      return a.node.order - b.node.order;
    };
  }
  if (strategy === "status") {
    return (a, b) => {
      if (a.status < b.status) return -1;
      if (a.status > b.status) return 1;
      return a.node.order - b.node.order;
    };
  }
  // "manual"
  return (a, b) => a.node.order - b.node.order;
}

/**
 * Belge ağacını verilen tercihlere göre dışa aktarma sırasına çözer.
 */
export function resolveCompileOrder(
  roots: CompileDocumentNode[] | undefined,
  prefs: CompilePreferences
): CompileOrderResult {
  const safeRoots = Array.isArray(roots) ? roots : [];
  const totalInput = countNodes(safeRoots);
  const cycles = detectCycles(safeRoots);

  const included: CompileOrderEntry[] = [];
  const excluded: CompileExcludedDocument[] = [];
  const seen = new Set<CompileDocumentNode>();

  const cmp = comparatorFor(prefs.strategy, prefs);

  const walkLevel = (nodes: CompileDocumentNode[], depth: number): void => {
    if (!Array.isArray(nodes) || nodes.length === 0) return;

    // Aynı düğüm birden fazla kez görünürse yalnızca ilk sefer işle.
    const freshNodes: CompileDocumentNode[] = [];
    for (const n of nodes) {
      if (!n || seen.has(n)) continue;
      seen.add(n);
      freshNodes.push(n);
    }

    const withMeta = freshNodes.map((node) => ({
      node,
      priority: clampPriority(node.priority),
      status: normalizeStatus(node.status),
    }));

    const sorted = [...withMeta].sort(cmp);

    sorted.forEach((entry, siblingIndex) => {
      const { node, priority, status } = entry;

      if (node.includeInCompile === false) {
        excluded.push({
          id: node.id,
          title: node.title,
          reason: "include-flag-false",
        });
        // Alt ağaç da hariç sayılır, ama "seen" işaretlenerek döngü korunur.
        if (Array.isArray(node.children)) {
          for (const child of node.children) {
            if (child) seen.add(child);
          }
        }
        return;
      }

      if (!isStatusAllowed(status, prefs.statusFilter)) {
        excluded.push({
          id: node.id,
          title: node.title,
          reason: "status-filter",
        });
        if (Array.isArray(node.children)) {
          for (const child of node.children) {
            if (child) seen.add(child);
          }
        }
        return;
      }

      if (!isPriorityAllowed(priority, prefs.priorityRange)) {
        excluded.push({
          id: node.id,
          title: node.title,
          reason: "priority-filter",
        });
        if (Array.isArray(node.children)) {
          for (const child of node.children) {
            if (child) seen.add(child);
          }
        }
        return;
      }

      included.push({
        id: node.id,
        title: node.title,
        siblingIndex,
        depth,
        priority,
        status,
      });

      if (Array.isArray(node.children) && node.children.length > 0) {
        walkLevel(node.children, depth + 1);
      }
    });
  };

  walkLevel(safeRoots, 0);

  return {
    included,
    excluded,
    cycles,
    summary: {
      totalInput,
      includedCount: included.length,
      excludedCount: excluded.length,
      cycleCount: cycles.length,
    },
  };
}
