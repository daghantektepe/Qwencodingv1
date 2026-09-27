/**
 * OpenScriv - Faz 6: Proje veri modeli + metadata yonetimi
 *
 * Metadata yapisi (her dokuman/klasor icin):
 *   { synopsis: string, labels: string[], status: string, keywords: string[] }
 *
 * useProjectState hook'u agaci ve metadata'yi birlikte yonetir; her degisiklikte
 * onPersist callback'i cagrilarak diska yansitilir (save-project-tree IPC).
 */

import { useState, useCallback, useMemo } from 'react';
import {
  addNode as treeAddNode,
  removeNode as treeRemoveNode,
  renameNode as treeRenameNode,
  updateDocContent as treeUpdateDocContent,
  findNode as treeFindNode,
  serializeTree,
  deserializeTree,
} from './tree.js';

// ---------------------------------------------------------------------------
// Metadata sabitleri
// ---------------------------------------------------------------------------

export const STATUSES = [
  'Taslak',
  'Ilk Taslak',
  'Ikinci Taslak',
  'Düzeltme Bekliyor',
  'Tamamlandı',
];

export const LABELS = ['Kirmizi', 'Yesil', 'Mavi', 'Sari', 'Turuncu', 'Mor'];

export const DEFAULT_METADATA = {
  synopsis: '',
  labels: [],
  status: 'Taslak',
  keywords: [],
};

// ---------------------------------------------------------------------------
// Normalize / dogrulama
// ---------------------------------------------------------------------------

function normalizeMeta(meta) {
  return {
    synopsis: typeof meta?.synopsis === 'string' ? meta.synopsis : '',
    labels: Array.isArray(meta?.labels) ? meta.labels.filter(Boolean) : [],
    status: typeof meta?.status === 'string' && meta.status ? meta.status : 'Taslak',
    keywords: Array.isArray(meta?.keywords) ? meta.keywords.filter(Boolean) : [],
  };
}

/**
 * Agactaki her dugume eksik metadata alanlarini varsayilan degerlerle ekler.
 * Geri yukleme uyumlulugu icin kritiktir (eski projelerde metadata olmayabilir).
 */
export function ensureMetadata(nodes) {
  const walk = (list) =>
    (Array.isArray(list) ? list : []).map((n) => ({
      ...n,
      metadata: normalizeMeta(n.metadata || n),
      ...(n.type === 'folder' && Array.isArray(n.children)
        ? { children: walk(n.children) }
        : {}),
    }));
  return walk(nodes);
}

/**
 * Bir dugumun metadata nesnesini dondurur (yoksa varsayilan).
 */
export function getNodeMetadata(tree, id) {
  const node = treeFindNode(tree, id);
  if (!node) return null;
  return normalizeMeta(node.metadata);
}

// ---------------------------------------------------------------------------
// Saf metadata guncelleme (immutable)
// ---------------------------------------------------------------------------

/**
 * updateMetadata(docId, newMeta) — metadata'nin tamamini veya bir kismini
 * yeni degerle birlestirerek gunceller.
 */
export function updateMetadataInTree(tree, docId, newMeta) {
  const walk = (nodes) =>
    nodes.map((n) => {
      if (n.id === docId) {
        const merged = { ...(n.metadata || DEFAULT_METADATA), ...(newMeta || {}) };
        return { ...n, metadata: normalizeMeta(merged) };
      }
      if (n.type === 'folder' && Array.isArray(n.children)) {
        return { ...n, children: walk(n.children) };
      }
      return n;
    });
  return walk(tree);
}

/**
 * Keyword ekle/cikar yardimcilari.
 */
export function addKeywordToNode(tree, id, keyword) {
  const kw = String(keyword ?? '').trim();
  if (!kw) return tree;
  const node = treeFindNode(tree, id);
  if (!node) return tree;
  const current = normalizeMeta(node.metadata).keywords;
  if (current.includes(kw)) return tree;
  return updateMetadataInTree(tree, id, { keywords: [...current, kw] });
}

export function removeKeywordFromNode(tree, id, keyword) {
  const node = treeFindNode(tree, id);
  if (!node) return tree;
  const current = normalizeMeta(node.metadata).keywords;
  return updateMetadataInTree(tree, id, {
    keywords: current.filter((k) => k !== keyword),
  });
}

/**
 * Label ekle/cikar yardimcilari.
 */
export function toggleLabelOnNode(tree, id, label) {
  const node = treeFindNode(tree, id);
  if (!node) return tree;
  const current = normalizeMeta(node.metadata).labels;
  const next = current.includes(label)
    ? current.filter((l) => l !== label)
    : [...current, label];
  return updateMetadataInTree(tree, id, { labels: next });
}

// ---------------------------------------------------------------------------
// Proje serilestirme (disk kalıcılığı)
// ---------------------------------------------------------------------------

function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/**
 * Tam proje nesnesi olusturur. tree.json icine yazilmaya hazir JSON-safe sekil.
 */
export function createProject(name = 'Adsız Proje', tree = []) {
  return {
    schemaVersion: 2,
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tree: serializeTreeWithMeta(ensureMetadata(tree)),
  };
}

/**
 * serializeTree'e metadata alanlarini da katkar JSON-safe hale getirir.
 */
export function serializeTreeWithMeta(tree) {
  const clean = (n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    metadata: normalizeMeta(n.metadata),
    ...(n.type === 'folder' ? { children: (n.children || []).map(clean) } : {}),
    ...(n.type === 'doc' ? { content: n.content || '' } : {}),
  });
  return (tree || []).map(clean);
}

/**
 * Diskten gelen proje JSON'unu dogrular + metadata normalizasyonu uygular.
 * "Geri yukleniyor" tamamlanma kriterindeki kritik adim.
 */
export function loadProject(json) {
  const data = typeof json === 'string' ? safeParse(json) : json;
  if (!data || typeof data !== 'object') {
    return createProject('Yeniden Yüklenen Proje', []);
  }
  const tree = ensureMetadata(deserializeTree(data.tree || []));
  return {
    schemaVersion: data.schemaVersion || 2,
    name: data.name || 'Adsız Proje',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    tree,
  };
}

// ---------------------------------------------------------------------------
// React hook: proje + agac + metadata state yonetimi
// ---------------------------------------------------------------------------

/**
 * useProjectState — Faz 6'in state katmani.
 *
 * @param {Object} options
 * @param {Node[]} [options.initialTree]
 * @param {string} [options.projectName]
 * @param {(project:Object) => void} [options.onPersist] - her degisiklikte
 *        cagrilir; App.jsx bunu save-project-tree IPC'sine baglayarak diska yazar.
 * @returns {{
 *   project, tree, setProject,
 *   addDoc(title, parentId, factory), deleteNode(id), renameNode(id, title),
 *   updateDocContent(id, content),
 *   updateMetadata(docId, newMeta),
 *   getMetadata(docId),
 *   addKeyword(id, kw), removeKeyword(id, kw), toggleLabel(id, label),
 *   getSelectedNode(id)
 * }}
 */
export function useProjectState({
  initialTree = [],
  projectName = 'Adsız Proje',
  onPersist,
} = {}) {
  const [project, setProjectRaw] = useState(() =>
    createProject(projectName, ensureMetadata(initialTree))
  );

  const persistRef = useMemo(() => ({ fn: onPersist }), []);
  persistRef.fn = onPersist;

  const commit = useCallback((nextProject) => {
    const stamped = { ...nextProject, updatedAt: new Date().toISOString() };
    setProjectRaw(stamped);
    if (typeof persistRef.fn === 'function') {
      persistRef.fn(stamped);
    }
    return stamped;
  }, [persistRef]);

  // --- Tree CRUD (Faz 5'ten devralinir, metadata korunarak) ---
  const addDoc = useCallback(
    (title, parentId = null, factory) => {
      const node = typeof factory === 'function' ? factory(title) : {
        id: `doc-${Date.now()}`,
        type: 'doc',
        title: title || 'Yeni Doküman',
        content: '',
        metadata: { ...DEFAULT_METADATA },
      };
      const withMeta = ensureMetadata([node])[0];
      commit({ ...project, tree: treeAddNode(project.tree, withMeta, parentId) });
      return withMeta;
    },
    [project, commit]
  );

  const deleteNode = useCallback(
    (id) => commit({ ...project, tree: treeRemoveNode(project.tree, id) }),
    [project, commit]
  );

  const renameNode = useCallback(
    (id, newTitle) => commit({ ...project, tree: treeRenameNode(project.tree, id, newTitle) }),
    [project, commit]
  );

  const updateDocContent = useCallback(
    (id, content) =>
      commit({ ...project, tree: treeUpdateDocContent(project.tree, id, content) }),
    [project, commit]
  );

  // --- Metadata aksiyonlari (Faz 6 hedefi) ---
  const updateMetadata = useCallback(
    (docId, newMeta) =>
      commit({ ...project, tree: updateMetadataInTree(project.tree, docId, newMeta) }),
    [project, commit]
  );

  const getMetadata = useCallback(
    (docId) => getNodeMetadata(project.tree, docId),
    [project.tree]
  );

  const addKeyword = useCallback(
    (id, keyword) =>
      commit({ ...project, tree: addKeywordToNode(project.tree, id, keyword) }),
    [project, commit]
  );

  const removeKeyword = useCallback(
    (id, keyword) =>
      commit({ ...project, tree: removeKeywordFromNode(project.tree, id, keyword) }),
    [project, commit]
  );

  const toggleLabel = useCallback(
    (id, label) =>
      commit({ ...project, tree: toggleLabelOnNode(project.tree, id, label) }),
    [project, commit]
  );

  const getSelectedNode = useCallback(
    (id) => treeFindNode(project.tree, id),
    [project.tree]
  );

  return {
    project,
    tree: project.tree,
    setProject: (p) => commit(p),
    // tree CRUD
    addDoc,
    deleteNode,
    renameNode,
    updateDocContent,
    // metadata
    updateMetadata,
    getMetadata,
    addKeyword,
    removeKeyword,
    toggleLabel,
    getSelectedNode,
  };
}
