import { useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const ROOT_ID = 'root';
export const TRASH_ID = 'trash';

export interface BinderNode {
  id: string;
  name: string;
  type: 'folder' | 'document';
  parentId: string | null;
  children: string[];
  content?: string;
  createdAt: number;
  updatedAt: number;
}

export interface BinderTreeActions {
  nodes: Record<string, BinderNode>;
  selectedNodeId: string | null;
  selectNode: (id: string | null) => void;
  createDocumentInFolder: (
    parentId: string,
    name: string
  ) => { error: string | null; createdNode: BinderNode | null };
  createFolderInFolder: (
    parentId: string,
    name: string
  ) => { error: string | null; createdNode: BinderNode | null };
  deleteNode: (id: string) => void;
  restoreFromTrash: (id: string) => void;
  moveNode: (id: string, newParentId: string) => void;
  renameNode: (id: string, newName: string) => void;
  updateDocumentContent: (id: string, content: string) => void;
  getChildren: (id: string) => BinderNode[];
  getSelectedNode: () => BinderNode | null;
  emptyTrash: () => void;
}

export function useBinderTreeActions(): BinderTreeActions {
  const [nodes, setNodes] = useState<Record<string, BinderNode>>(() => {
    const root: BinderNode = {
      id: ROOT_ID,
      name: 'Root',
      type: 'folder',
      parentId: null,
      children: [TRASH_ID],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const trash: BinderNode = {
      id: TRASH_ID,
      name: 'Trash',
      type: 'folder',
      parentId: ROOT_ID,
      children: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return { [ROOT_ID]: root, [TRASH_ID]: trash };
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectNode = useCallback((id: string | null) => {
    setSelectedNodeId(id);
  }, []);

  const createDocumentInFolder = useCallback(
    (
      parentId: string,
      name: string
    ): { error: string | null; createdNode: BinderNode | null } => {
      if (!nodes[parentId]) {
        return { error: 'Parent folder not found', createdNode: null };
      }
      const newId = uuidv4();
      const now = Date.now();
      const newNode: BinderNode = {
        id: newId,
        name,
        type: 'document',
        parentId,
        children: [],
        content: '',
        createdAt: now,
        updatedAt: now,
      };
      setNodes((prev) => {
        const parent = prev[parentId];
        if (!parent) return prev;
        return {
          ...prev,
          [newId]: newNode,
          [parentId]: {
            ...parent,
            children: [...parent.children, newId],
            updatedAt: now,
          },
        };
      });
      // Auto-select the newly created document
      setSelectedNodeId(newId);
      return { error: null, createdNode: newNode };
    },
    [nodes]
  );

  const createFolderInFolder = useCallback(
    (
      parentId: string,
      name: string
    ): { error: string | null; createdNode: BinderNode | null } => {
      if (!nodes[parentId]) {
        return { error: 'Parent folder not found', createdNode: null };
      }
      const newId = uuidv4();
      const now = Date.now();
      const newNode: BinderNode = {
        id: newId,
        name,
        type: 'folder',
        parentId,
        children: [],
        createdAt: now,
        updatedAt: now,
      };
      setNodes((prev) => {
        const parent = prev[parentId];
        if (!parent) return prev;
        return {
          ...prev,
          [newId]: newNode,
          [parentId]: {
            ...parent,
            children: [...parent.children, newId],
            updatedAt: now,
          },
        };
      });
      return { error: null, createdNode: newNode };
    },
    [nodes]
  );

  const deleteNode = useCallback(
    (id: string) => {
      if (id === ROOT_ID || id === TRASH_ID) return;
      setNodes((prev) => {
        const node = prev[id];
        if (!node) return prev;
        const newNodes = { ...prev };
        // Remove from parent
        if (node.parentId && newNodes[node.parentId]) {
          newNodes[node.parentId] = {
            ...newNodes[node.parentId],
            children: newNodes[node.parentId].children.filter(
              (childId) => childId !== id
            ),
            updatedAt: Date.now(),
          };
        }
        // Move to trash
        newNodes[TRASH_ID] = {
          ...newNodes[TRASH_ID],
          children: [...newNodes[TRASH_ID].children, id],
          updatedAt: Date.now(),
        };
        newNodes[id] = {
          ...node,
          parentId: TRASH_ID,
          updatedAt: Date.now(),
        };
        return newNodes;
      });
      if (selectedNodeId === id) {
        setSelectedNodeId(null);
      }
    },
    [selectedNodeId]
  );

  const restoreFromTrash = useCallback(
    (id: string) => {
      setNodes((prev) => {
        const node = prev[id];
        if (!node || node.parentId !== TRASH_ID) return prev;
        const newNodes = { ...prev };
        // Remove from trash
        newNodes[TRASH_ID] = {
          ...newNodes[TRASH_ID],
          children: newNodes[TRASH_ID].children.filter(
            (childId) => childId !== id
          ),
          updatedAt: Date.now(),
        };
        // Restore to root
        newNodes[ROOT_ID] = {
          ...newNodes[ROOT_ID],
          children: [...newNodes[ROOT_ID].children, id],
          updatedAt: Date.now(),
        };
        newNodes[id] = {
          ...node,
          parentId: ROOT_ID,
          updatedAt: Date.now(),
        };
        return newNodes;
      });
    },
    []
  );

  const moveNode = useCallback(
    (id: string, newParentId: string) => {
      if (id === ROOT_ID || id === TRASH_ID) return;
      if (!nodes[newParentId]) return;
      setNodes((prev) => {
        const node = prev[id];
        if (!node) return prev;
        const newNodes = { ...prev };
        // Remove from old parent
        if (node.parentId && newNodes[node.parentId]) {
          newNodes[node.parentId] = {
            ...newNodes[node.parentId],
            children: newNodes[node.parentId].children.filter(
              (childId) => childId !== id
            ),
            updatedAt: Date.now(),
          };
        }
        // Add to new parent
        newNodes[newParentId] = {
          ...newNodes[newParentId],
          children: [...newNodes[newParentId].children, id],
          updatedAt: Date.now(),
        };
        newNodes[id] = {
          ...node,
          parentId: newParentId,
          updatedAt: Date.now(),
        };
        return newNodes;
      });
    },
    [nodes]
  );

  const renameNode = useCallback(
    (id: string, newName: string) => {
      setNodes((prev) => {
        const node = prev[id];
        if (!node) return prev;
        return {
          ...prev,
          [id]: {
            ...node,
            name: newName,
            updatedAt: Date.now(),
          },
        };
      });
      // Ensure the renamed node is selected
      setSelectedNodeId(id);
    },
    []
  );

  const updateDocumentContent = useCallback(
    (id: string, content: string) => {
      setNodes((prev) => {
        const node = prev[id];
        if (!node || node.type !== 'document') return prev;
        return {
          ...prev,
          [id]: {
            ...node,
            content,
            updatedAt: Date.now(),
          },
        };
      });
    },
    []
  );

  const getChildren = useCallback(
    (id: string): BinderNode[] => {
      const node = nodes[id];
      if (!node) return [];
      return node.children
        .map((childId) => nodes[childId])
        .filter((child): child is BinderNode => child !== undefined);
    },
    [nodes]
  );

  const getSelectedNode = useCallback((): BinderNode | null => {
    if (!selectedNodeId) return null;
    return nodes[selectedNodeId] || null;
  }, [selectedNodeId, nodes]);

  const emptyTrash = useCallback(() => {
    setNodes((prev) => {
      const trash = prev[TRASH_ID];
      if (!trash) return prev;
      const newNodes = { ...prev };
      // Remove all children from trash
      trash.children.forEach((childId) => {
        delete newNodes[childId];
      });
      newNodes[TRASH_ID] = {
        ...trash,
        children: [],
        updatedAt: Date.now(),
      };
      return newNodes;
    });
  }, []);

  return useMemo(
    () => ({
      nodes,
      selectedNodeId,
      selectNode,
      createDocumentInFolder,
      createFolderInFolder,
      deleteNode,
      restoreFromTrash,
      moveNode,
      renameNode,
      updateDocumentContent,
      getChildren,
      getSelectedNode,
      emptyTrash,
    }),
    [
      nodes,
      selectedNodeId,
      selectNode,
      createDocumentInFolder,
      createFolderInFolder,
      deleteNode,
      restoreFromTrash,
      moveNode,
      renameNode,
      updateDocumentContent,
      getChildren,
      getSelectedNode,
      emptyTrash,
    ]
  );
}
