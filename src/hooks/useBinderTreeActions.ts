import { useCallback, useMemo } from 'react';
import { createBinderTreeActions, BinderTreeActions, BinderNode } from '../state/binderTreeActions';

interface UseBinderTreeActionsOptions {
  tree: BinderNode[];
  setTree: (tree: BinderNode[]) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
}

export function useBinderTreeActions({
  tree,
  setTree,
  selectedNodeId,
  setSelectedNodeId,
}: UseBinderTreeActionsOptions): BinderTreeActions {
  const getTree = useCallback(() => tree, [tree]);
  const getSelectedNodeId = useCallback(() => selectedNodeId, [selectedNodeId]);

  return useMemo(
    () => createBinderTreeActions(getTree, setTree, getSelectedNodeId, setSelectedNodeId),
    [getTree, setTree, getSelectedNodeId, setSelectedNodeId]
  );
}
