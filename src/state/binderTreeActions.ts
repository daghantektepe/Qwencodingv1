import { v4 as uuidv4 } from 'uuid';

export interface BinderNode {
  id: string;
  title: string;
  type: 'folder' | 'document';
  children: BinderNode[];
  parentId: string | null;
}

export interface CreateFolderResult {
  createdNode: BinderNode | null;
  error: string | null;
}

export interface CreateDocumentResult {
  createdNode: BinderNode | null;
  error: string | null;
}

export interface DeleteNodeResult {
  deletedNode: BinderNode | null;
  error: string | null;
}

export interface MoveNodeResult {
  movedNode: BinderNode | null;
  error: string | null;
}

export interface RenameNodeResult {
  renamedNode: BinderNode | null;
  error: string | null;
}

export interface SelectNodeResult {
  selectedNode: BinderNode | null;
  error: string | null;
}

export interface BinderTreeActions {
  createFolder: (parentId: string, title: string) => CreateFolderResult;
  createDocument: (parentId: string, title: string) => CreateDocumentResult;
  deleteNode: (nodeId: string) => DeleteNodeResult;
  moveNode: (nodeId: string, newParentId: string) => MoveNodeResult;
  renameNode: (nodeId: string, newTitle: string) => RenameNodeResult;
  selectNode: (nodeId: string) => SelectNodeResult;
}

export function createBinderTreeActions(
  getTree: () => BinderNode[],
  setTree: (tree: BinderNode[]) => void,
  getSelectedNodeId: () => string | null,
  setSelectedNodeId: (id: string | null) => void
): BinderTreeActions {
  const findNode = (nodes: BinderNode[], id: string): BinderNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = findNode(node.children, id);
      if (found) return found;
    }
    return null;
  };

  const removeNode = (nodes: BinderNode[], id: string): BinderNode[] => {
    return nodes
      .filter((node) => node.id !== id)
      .map((node) => ({
        ...node,
        children: removeNode(node.children, id),
      }));
  };

  const insertNode = (nodes: BinderNode[], parentId: string, newNode: BinderNode): BinderNode[] => {
    return nodes.map((node) => {
      if (node.id === parentId) {
        return {
          ...node,
          children: [...node.children, newNode],
        };
      }
      return {
        ...node,
        children: insertNode(node.children, parentId, newNode),
      };
    });
  };

  const updateNode = (nodes: BinderNode[], id: string, updater: (node: BinderNode) => BinderNode): BinderNode[] => {
    return nodes.map((node) => {
      if (node.id === id) {
        return updater(node);
      }
      return {
        ...node,
        children: updateNode(node.children, id, updater),
      };
    });
  };

  return {
    createFolder: (parentId: string, title: string): CreateFolderResult => {
      const tree = getTree();
      const parent = findNode(tree, parentId);
      if (!parent) {
        return { createdNode: null, error: 'Parent node not found' };
      }
      const newNode: BinderNode = {
        id: uuidv4(),
        title,
        type: 'folder',
        children: [],
        parentId,
      };
      const newTree = insertNode(tree, parentId, newNode);
      setTree(newTree);
      return { createdNode: newNode, error: null };
    },

    createDocument: (parentId: string, title: string): CreateDocumentResult => {
      const tree = getTree();
      const parent = findNode(tree, parentId);
      if (!parent) {
        return { createdNode: null, error: 'Parent node not found' };
      }
      const newNode: BinderNode = {
        id: uuidv4(),
        title,
        type: 'document',
        children: [],
        parentId,
      };
      const newTree = insertNode(tree, parentId, newNode);
      setTree(newTree);
      return { createdNode: newNode, error: null };
    },

    deleteNode: (nodeId: string): DeleteNodeResult => {
      const tree = getTree();
      const node = findNode(tree, nodeId);
      if (!node) {
        return { deletedNode: null, error: 'Node not found' };
      }
      const newTree = removeNode(tree, nodeId);
      setTree(newTree);
      if (getSelectedNodeId() === nodeId) {
        setSelectedNodeId(null);
      }
      return { deletedNode: node, error: null };
    },

    moveNode: (nodeId: string, newParentId: string): MoveNodeResult => {
      const tree = getTree();
      const node = findNode(tree, nodeId);
      const newParent = findNode(tree, newParentId);
      if (!node || !newParent) {
        return { movedNode: null, error: 'Node or parent not found' };
      }
      if (nodeId === newParentId) {
        return { movedNode: null, error: 'Cannot move node to itself' };
      }
      const newTree = removeNode(tree, nodeId);
      const updatedNode = { ...node, parentId: newParentId };
      const finalTree = insertNode(newTree, newParentId, updatedNode);
      setTree(finalTree);
      return { movedNode: updatedNode, error: null };
    },

    renameNode: (nodeId: string, newTitle: string): RenameNodeResult => {
      const tree = getTree();
      const node = findNode(tree, nodeId);
      if (!node) {
        return { renamedNode: null, error: 'Node not found' };
      }
      const newTree = updateNode(tree, nodeId, (n) => ({ ...n, title: newTitle }));
      setTree(newTree);
      return { renamedNode: { ...node, title: newTitle }, error: null };
    },

    selectNode: (nodeId: string): SelectNodeResult => {
      const tree = getTree();
      const node = findNode(tree, nodeId);
      if (!node) {
        return { selectedNode: null, error: 'Node not found' };
      }
      setSelectedNodeId(nodeId);
      return { selectedNode: node, error: null };
    },
  };
}
