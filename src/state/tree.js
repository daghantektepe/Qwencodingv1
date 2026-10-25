/**
 * OpenScriv - Faz 5: Binder agaci durum yonetimi (CRUD + tasima yardimcilari)
 *
 * Dugum sekle:
 *   { id, type: 'folder' | 'doc', title, children?: Node[], content?: string }
 *
 * Bu modul saf (pure) fonksiyonlar ve React hook'u icerir: girdi agacini
 * mutate ETMEZ, yeni bir kopya dondurur. Boylece React state ile guvenli
 * kullanilir ve Electron IPC (save-project-tree) ile diske yazilmaya hazir.
 */

import { useState, useCallback, useMemo } from 'react';

let idCounter = 0;

/**
 * Benzersiz, siralanabilir dokuman/klasor id'si uretir.
 */
export function generateId(prefix = 'n') {
  idCounter += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${idCounter}-${rand}`;
}

/**
 * Yeni bos dokuman dugumu olusturur.
 */
export function createDoc(title = 'Yeni Doküman', content = '') {
  return {
    id: generateId('doc'),
    type: 'doc',
    title,
    content,
  };
}

/**
 * Yeni klasor dugumu olusturur.
 */
export function createFolder(title = 'Yeni Klasör', children = []) {
  return {
    id: generateId('fld'),
    type: 'folder',
    title,
    children,
  };
}

/**
 * Varsayilan baslangic agaci — yeni proje olusturulunken kullanilir.
 */
export function createDefaultTree() {
  return [
    createFolder('Manuskript', [
      createDoc('Bölüm 1', ''),
      createDoc('Bölüm 2', ''),
    ]),
    createFolder('Notlar', [
      createDoc('Fikirler', ''),
    ]),
  ];
}

// ---------------------------------------------------------------------------
// Sorgu yardimcilari
// ---------------------------------------------------------------------------

/**
 * Agac boyunca dolasarak given id'ye sahip dugumu bulur.
 */
export function findNode(nodes, id) {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.type === 'folder' && Array.isArray(n.children)) {
      const found = findNode(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Dugumun ebeveyn klasorunun id'sini bulur (kokteyse null).
 */
export function findParentId(nodes, targetId, parentId = null) {
  for (const n of nodes) {
    if (n.id === targetId) return parentId;
    if (n.type === 'folder' && Array.isArray(n.children)) {
      const res = findParentId(n.children, targetId, n.id);
      if (res !== undefined && res !== null) return res;
    }
  }
  return null;
}

/**
 * `ancestorId`, `descendantId` dugumunun atasi mi? (Dongusu tasma korumasi icin.)
 */
export function isAncestor(nodes, ancestorId, descendantId) {
  const ancestor = findNode(nodes, ancestorId);
  if (!ancestor || ancestor.type !== 'folder') return false;
  return !!findNode(ancestor.children || [], descendantId);
}

/**
 * Tum dokumanlari duz liste olarak dondurur (compile/export icin faydali).
 */
export function flattenDocs(nodes, out = []) {
  for (const n of nodes) {
    if (n.type === 'doc') out.push(n);
    if (n.type === 'folder' && Array.isArray(n.children)) {
      flattenDocs(n.children, out);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Saf CRUD islemleri (hepsi YENI agac kopyasi dondurur)
// ---------------------------------------------------------------------------

/**
 * Ekleme hedefi cozumler:
 *  - parentId verilmezse kok seviyeye eklenir.
 *  - parentId bir doc ise -> o docun ebeveynine, hemen ardina eklenir.
 *  - parentId bir folder ise -> o klasorun sonuna eklenir.
 */
function resolveInsertTarget(nodes, parentId) {
  if (!parentId) return { kind: 'root' };
  const parent = findNode(nodes, parentId);
  if (!parent) return { kind: 'root' };
  if (parent.type === 'folder') return { kind: 'folder', id: parent.id };
  const gp = findParentId(nodes, parent.id);
  return gp ? { kind: 'folder', id: gp } : { kind: 'root' };
}

/**
 * Kok veya ilgili klasorun children dizisinde immutable ekleme yapar.
 */
function insertInto(list, node, index) {
  const copy = [...list];
  const i = index == null ? copy.length : Math.max(0, Math.min(index, copy.length));
  copy.splice(i, 0, node);
  return copy;
}

/**
 * Agaca yeni dugum (doc/folder) ekler.
 * @param {Node[]} tree
 * @param {Object} node        - eklenecek dugum (createDoc/createFolder ile uretilmis)
 * @param {string|null} parentId - hedeften sonra/ici ekleme; null => kok
 * @param {number|null} index   - klasor ici siralama indeksi; null => sona
 * @returns {Node[]} yeni agac
 */
export function addNode(tree, node, parentId = null, index = null) {
  const target = resolveInsertTarget(tree, parentId);

  if (target.kind === 'root') {
    return insertInto(tree, node, index);
  }

  const walk = (nodes) =>
    nodes.map((n) => {
      if (n.id === target.id && n.type === 'folder') {
        return { ...n, children: insertInto(n.children || [], node, index) };
      }
      if (n.type === 'folder' && Array.isArray(n.children)) {
        return { ...n, children: walk(n.children) };
      }
      return n;
    });

  return walk(tree);
}

/**
 * Yeniden adlandirma: title'i degistirir. Bos/yalniz-bosluk isim reddedilir.
 */
export function renameNode(tree, id, newTitle) {
  const title = String(newTitle ?? '').trim();
  if (!title) return tree; // gecersiz isim -> degisiklik yok

  const walk = (nodes) =>
    nodes.map((n) => {
      if (n.id === id) return { ...n, title };
      if (n.type === 'folder' && Array.isArray(n.children)) {
        return { ...n, children: walk(n.children) };
      }
      return n;
    });

  return walk(tree);
}

/**
 * Dugumu (klasor ve alt ogeleriyle birlikte) siler.
 * deleteNode, removeNode ile ayni seydir — her iki ad da export edilir.
 */
export function removeNode(tree, id) {
  const walk = (nodes) => {
    const out = [];
    for (const n of nodes) {
      if (n.id === id) continue; // atla (sil)
      if (n.type === 'folder' && Array.isArray(n.children)) {
        out.push({ ...n, children: walk(n.children) });
      } else {
        out.push(n);
      }
    }
    return out;
  };
  return walk(tree);
}

/**
 * Alias: CRUD API tutarliligi icin deleteNode.
 */
export const deleteNode = removeNode;

/**
 * Dokuman icerigini gunceller (editor autosave ile senkron).
 */
// content: düz metin (sayım, arama, derleme bunu okur); contentHtml: editörün zengin metni.
// contentHtml verilmezse (snapshot, not defteri gibi düz metin yazanlar) eskisi atılır;
// editör zengin metni düz metinden yeniden kurar.
export function updateDocContent(tree, id, content, contentHtml) {
  const walk = (nodes) =>
    nodes.map((n) => {
      if (n.id === id && n.type === 'doc') {
        const { contentHtml: _stale, ...rest } = n;
        return contentHtml === undefined ? { ...rest, content } : { ...rest, content, contentHtml };
      }
      if (n.type === 'folder' && Array.isArray(n.children)) {
        return { ...n, children: walk(n.children) };
      }
      return n;
    });
  return walk(tree);
}

// ---------------------------------------------------------------------------
// Tasma / siralama (drag & drop destegi)
// ---------------------------------------------------------------------------

/**
 * Bir listeyi immutable sekilde yeniden siralar: srcIndex'teki elemani
 * destIndex'e tasir.
 */
function moveInList(list, srcIndex, destIndex) {
  const copy = [...list];
  if (srcIndex < 0 || srcIndex >= copy.length) return copy;
  const [item] = copy.splice(srcIndex, 1);
  const clamped = Math.max(0, Math.min(destIndex, copy.length));
  copy.splice(clamped, 0, item);
  return copy;
}

/**
 * Dugumu mevcut ebeveyninden cikarir (moveNode'un 1. adimi).
 */
function removeFromParent(nodes, id) {
  const filtered = nodes.filter((n) => n.id !== id);
  return filtered.map((n) =>
    n.type === 'folder' && Array.isArray(n.children)
      ? { ...n, children: removeFromParent(n.children, id) }
      : n
  );
}

/**
 * Dugumu baska bir klasore/index'e tasir (surukle-birak).
 *
 * @param {Node[]} tree
 * @param {string} dragId       - tasinan dugum
 * @param {string|null} toParentId - hedef parent folder id; null => kok seviye
 * @param {number|null} toIndex    - hedef indeks; null => sona
 * @returns {Node[]} yeni agac (gecersiz/dongusel tasma halinde ayni agac)
 */
export function moveNode(tree, dragId, toParentId = null, toIndex = null) {
  const dragged = findNode(tree, dragId);
  if (!dragged) return tree;

  // Kendini kendi icine/altina tasma yasal degil
  if (toParentId === dragId) return tree;
  // Atayi torun icine tasma (dongu) engelle
  if (toParentId && isAncestor(tree, dragId, toParentId)) return tree;

  const fromParentId = findParentId(tree, dragId);
  const fromList = fromParentId
    ? (findNode(tree, fromParentId)?.children ?? [])
    : tree;
  const fromIndex = fromList.findIndex((n) => n.id === dragId);
  if (fromIndex === -1) return tree;

  // 1) Once kaynaktan cikar
  const withoutDragged = removeFromParent(tree, dragId);
  // 2) Sonra hedefe ekle
  return addNode(withoutDragged, dragged, toParentId, toIndex);
}

/**
 * Kardesler arasinda yukari/asagi tasima (klavye/komut tabanli siralama).
 * dir: -1 yukari, +1 asagi
 */
export function reorderSibling(tree, id, dir) {
  const parentId = findParentId(tree, id);
  const list = parentId ? findNode(tree, parentId)?.children ?? [] : tree;
  const idx = list.findIndex((n) => n.id === id);
  const newIdx = idx + dir;
  if (idx === -1 || newIdx < 0 || newIdx >= list.length) return tree;

  const reordered = moveInList(list, idx, newIdx);
  if (!parentId) return reordered;
  return replaceChildren(tree, parentId, reordered);
}

/**
 * Belirli bir klasorun children dizisini immutable sekilde degistirir.
 */
export function replaceChildren(tree, folderId, newChildren) {
  const walk = (nodes) =>
    nodes.map((n) => {
      if (n.id === folderId && n.type === 'folder') {
        return { ...n, children: newChildren };
      }
      if (n.type === 'folder' && Array.isArray(n.children)) {
        return { ...n, children: walk(n.children) };
      }
      return n;
    });
  return walk(tree);
}

// ---------------------------------------------------------------------------
// Serilestirme (disk kalıcılığına hazırlık)
// ---------------------------------------------------------------------------

/**
 * Agaci JSON-safe forma cevirir (fonksiyon/tanimsiz alan temizligi).
 */
export function serializeTree(tree) {
  const clean = (n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    ...(n.type === 'folder' ? { children: (n.children || []).map(clean) } : {}),
    ...(n.type === 'doc' ? { content: n.content || '' } : {}),
  });
  return (tree || []).map(clean);
}

/**
 * Diskten gelen JSON'u dogrular ve agaca ceviri; bozuk veri => [].
 */
export function deserializeTree(json) {
  try {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// React hook: agac state'ini tutar + CRUD/tasma aksiyonlarini sarar
// ---------------------------------------------------------------------------

/**
 * useTreeState — Faz 5'in "agac yapisini (nodes) tutan state" gereksinimi.
 *
 * @param {Node[]} initialTree - baslangic agaci (varsayilan: varsayilan sablon)
 * @param {(tree:Node[]) => void} [onPersist] - her degisiklikte cagrilir
 *        (App.jsx bunu save-project-tree IPC'sine baglayarak diska yazar)
 * @returns {{
 *   tree: Node[],
 *   setTree: Function,
 *   addDoc: (title?, parentId?) => Node,
 *   addFolder: (title?, parentId?) => Node,
 *   deleteNode: (id) => void,
 *   renameNode: (id, newTitle) => void,
 *   moveNode: (dragId, toParentId, toIndex) => void,
 *   reorderSibling: (id, dir) => void,
 *   updateDocContent: (id, content) => void,
 * }}
 */
export function useTreeState(initialTree = createDefaultTree(), onPersist) {
  const [tree, setTreeRaw] = useState(initialTree);
  const persistRef = useMemo(() => ({ fn: onPersist }), []);
  persistRef.fn = onPersist;

  // Her mutation'da yeni agaci state'e yaz + diska yansitmak icin onPersist cagir
  const commit = useCallback((nextTree) => {
    setTreeRaw(nextTree);
    if (typeof persistRef.fn === 'function') {
      persistRef.fn(serializeTree(nextTree));
    }
    return nextTree;
  }, [persistRef]);

  const addDoc = useCallback(
    (title = 'Yeni Doküman', parentId = null) => {
      const node = createDoc(title);
      commit(addNode(tree, node, parentId));
      return node;
    },
    [tree, commit]
  );

  const addFolder = useCallback(
    (title = 'Yeni Klasör', parentId = null) => {
      const node = createFolder(title);
      commit(addNode(tree, node, parentId));
      return node;
    },
    [tree, commit]
  );

  const doDeleteNode = useCallback(
    (id) => commit(removeNode(tree, id)),
    [tree, commit]
  );

  const doRenameNode = useCallback(
    (id, newTitle) => commit(renameNode(tree, id, newTitle)),
    [tree, commit]
  );

  const doMoveNode = useCallback(
    (dragId, toParentId = null, toIndex = null) =>
      commit(moveNode(tree, dragId, toParentId, toIndex)),
    [tree, commit]
  );

  const doReorderSibling = useCallback(
    (id, dir) => commit(reorderSibling(tree, id, dir)),
    [tree, commit]
  );

  const doUpdateDocContent = useCallback(
    (id, content) => commit(updateDocContent(tree, id, content)),
    [tree, commit]
  );

  return {
    tree,
    setTree: (t) => commit(t),
    addDoc,
    addFolder,
    deleteNode: doDeleteNode,
    renameNode: doRenameNode,
    moveNode: doMoveNode,
    reorderSibling: doReorderSibling,
    updateDocContent: doUpdateDocContent,
  };
}
