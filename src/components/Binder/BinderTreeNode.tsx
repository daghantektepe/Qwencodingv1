import { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronDown, FileText, Folder, Trash2, Plus } from "lucide-react";
import type { BinderNode } from "./BinderTreeActions";

type BinderTreeNodeProps = {
  node: BinderNode;
  depth: number;
  selectedNodeId: string | null;
  expandedFolders: Set<string>;
  onSelect: (nodeId: string) => void;
  onToggleExpand: (nodeId: string) => void;
  onRename: (nodeId: string, newName: string) => void;
  onDelete: (nodeId: string) => void;
  onAddDocument: (folderId: string) => void;
  getChildren: (nodeId: string) => BinderNode[];
};

export function BinderTreeNode({
  node,
  depth,
  selectedNodeId,
  expandedFolders,
  onSelect,
  onToggleExpand,
  onRename,
  onDelete,
  onAddDocument,
  getChildren,
}: BinderTreeNodeProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSelected = selectedNodeId === node.id;
  const isExpanded = expandedFolders.has(node.id);
  const isFolder = node.type === "folder";
  const children = isFolder ? getChildren(node.id) : [];

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleDoubleClick = () => {
    if (!node.isTrash) {
      setIsRenaming(true);
      setRenameValue(node.name);
    }
  };

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue !== node.name) {
      onRename(node.id, renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      setIsRenaming(false);
      setRenameValue(node.name);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!node.isTrash) {
      setShowContextMenu(true);
    }
  };

  const handleAddDocument = () => {
    onAddDocument(node.id);
    setShowContextMenu(false);
  };

  const handleDelete = () => {
    onDelete(node.id);
    setShowContextMenu(false);
  };

  const Icon = isFolder ? Folder : FileText;

  return (
    <div className="binder-tree-node">
      <div
        className={`binder-tree-node-content ${isSelected ? "selected" : ""}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => {
          onSelect(node.id);
          if (isFolder) {
            onToggleExpand(node.id);
          }
        }}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      >
        {isFolder && (
          <span className="binder-tree-node-toggle">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
        {!isFolder && <span className="binder-tree-node-toggle" />}
        <Icon size={14} className="binder-tree-node-icon" />
        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleRenameKeyDown}
            className="binder-tree-node-rename-input"
          />
        ) : (
          <span className="binder-tree-node-name">{node.name}</span>
        )}
      </div>

      {showContextMenu && (
        <div
          className="binder-tree-context-menu"
          onClick={() => setShowContextMenu(false)}
        >
          {isFolder && !node.isTrash && (
            <button onClick={handleAddDocument}>
              <Plus size={12} />
              Add Document
            </button>
          )}
          {!node.isTrash && node.id !== "root" && (
            <button onClick={handleDelete}>
              <Trash2 size={12} />
              Move to Trash
            </button>
          )}
        </div>
      )}

      {isFolder && isExpanded && (
        <div className="binder-tree-node-children">
          {children.map((child) => (
            <BinderTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedNodeId={selectedNodeId}
              expandedFolders={expandedFolders}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onRename={onRename}
              onDelete={onDelete}
              onAddDocument={onAddDocument}
              getChildren={getChildren}
            />
          ))}
        </div>
      )}
    </div>
  );
}
