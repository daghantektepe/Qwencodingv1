import { useState } from "react";
import { useBinderTreeActions, ROOT_ID, TRASH_ID } from "./BinderTreeActions";
import { BinderTreeNode } from "./BinderTreeNode";
import "./Binder.css";

type BinderProps = {
  onDocumentOpen?: (documentId: string) => void;
};

export function Binder({ onDocumentOpen }: BinderProps) {
  const {
    nodes,
    selectedNodeId,
    renameNode,
    deleteNode,
    createDocumentInFolder,
    selectNode,
    getChildren,
  } = useBinderTreeActions();

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set([ROOT_ID])
  );

  const handleSelect = (nodeId: string) => {
    selectNode(nodeId);
    const node = nodes[nodeId];
    if (node && node.type === "document" && onDocumentOpen) {
      onDocumentOpen(nodeId);
    }
  };

  const handleToggleExpand = (nodeId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleAddDocument = (folderId: string) => {
    const result = createDocumentInFolder(folderId);
    if (result.createdNode) {
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        next.add(folderId);
        return next;
      });
      if (onDocumentOpen) {
        onDocumentOpen(result.createdNode.id);
      }
    }
  };

  const rootChildren = getChildren(ROOT_ID);
  const trashNode = nodes[TRASH_ID];

  return (
    <div className="binder">
      <div className="binder-header">
        <h3>Binder</h3>
      </div>
      <div className="binder-tree">
        {rootChildren.map((node) => (
          <BinderTreeNode
            key={node.id}
            node={node}
            depth={0}
            selectedNodeId={selectedNodeId}
            expandedFolders={expandedFolders}
            onSelect={handleSelect}
            onToggleExpand={handleToggleExpand}
            onRename={renameNode}
            onDelete={deleteNode}
            onAddDocument={handleAddDocument}
            getChildren={getChildren}
          />
        ))}
        {trashNode && (
          <BinderTreeNode
            node={trashNode}
            depth={0}
            selectedNodeId={selectedNodeId}
            expandedFolders={expandedFolders}
            onSelect={handleSelect}
            onToggleExpand={handleToggleExpand}
            onRename={renameNode}
            onDelete={deleteNode}
            onAddDocument={handleAddDocument}
            getChildren={getChildren}
          />
        )}
      </div>
    </div>
  );
}
