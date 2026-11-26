import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBinderTreeActions, ROOT_ID, TRASH_ID } from "../src/components/Binder/BinderTreeActions";

describe("useBinderTreeActions", () => {
  describe("renameNode", () => {
    it("should rename a node", () => {
      const { result } = renderHook(() => useBinderTreeActions());

      act(() => {
        const { createdNode } = result.current.createDocumentInFolder(ROOT_ID, "Test Doc");
        if (createdNode) {
          result.current.renameNode(createdNode.id, "Renamed Doc");
        }
      });

      const node = result.current.getSelectedNode();
      expect(node).not.toBeNull();
      expect(node?.name).toBe("Renamed Doc");
    });
  });

  describe("deleteNode", () => {
    it("should move a node to trash", () => {
      const { result } = renderHook(() => useBinderTreeActions());

      let docId: string | null = null;
      act(() => {
        const { createdNode } = result.current.createDocumentInFolder(ROOT_ID, "To Delete");
        docId = createdNode?.id || null;
      });

      expect(docId).not.toBeNull();

      act(() => {
        if (docId) {
          result.current.deleteNode(docId);
        }
      });

      const trashChildren = result.current.getChildren(TRASH_ID);
      expect(trashChildren.length).toBe(1);
      expect(trashChildren[0].id).toBe(docId);
      expect(trashChildren[0].parentId).toBe(TRASH_ID);

      const rootChildren = result.current.getChildren(ROOT_ID);
      expect(rootChildren.find((n) => n.id === docId)).toBeUndefined();
    });

    it("should not delete root or trash nodes", () => {
      const { result } = renderHook(() => useBinderTreeActions());

      act(() => {
        result.current.deleteNode(ROOT_ID);
      });

      expect(result.current.nodes[ROOT_ID]).toBeDefined();

      act(() => {
        result.current.deleteNode(TRASH_ID);
      });

      expect(result.current.nodes[TRASH_ID]).toBeDefined();
    });
  });

  describe("createDocumentInFolder", () => {
    it("should create a document in a folder", () => {
      const { result } = renderHook(() => useBinderTreeActions());

      let createdId: string | null = null;
      act(() => {
        const { createdNode } = result.current.createDocumentInFolder(ROOT_ID, "New Doc");
        createdId = createdNode?.id || null;
      });

      expect(createdId).not.toBeNull();

      const rootChildren = result.current.getChildren(ROOT_ID);
      const doc = rootChildren.find((n) => n.id === createdId);
      expect(doc).toBeDefined();
      expect(doc?.type).toBe("document");
      expect(doc?.name).toBe("New Doc");
      expect(doc?.parentId).toBe(ROOT_ID);
    });

    it("should auto-select the created document", () => {
      const { result } = renderHook(() => useBinderTreeActions());

      let createdId: string | null = null;
      act(() => {
        const { createdNode } = result.current.createDocumentInFolder(ROOT_ID, "Auto Select");
        createdId = createdNode?.id || null;
      });

      expect(result.current.selectedNodeId).toBe(createdId);
    });
  });

  describe("restoreFromTrash", () => {
    it("should restore a node from trash to root", () => {
      const { result } = renderHook(() => useBinderTreeActions());

      let docId: string | null = null;
      act(() => {
        const { createdNode } = result.current.createDocumentInFolder(ROOT_ID, "Restore Me");
        docId = createdNode?.id || null;
      });

      act(() => {
        if (docId) {
          result.current.deleteNode(docId);
        }
      });

      expect(result.current.getChildren(TRASH_ID).length).toBe(1);

      act(() => {
        if (docId) {
          result.current.restoreFromTrash(docId);
        }
      });

      expect(result.current.getChildren(TRASH_ID).length).toBe(0);
      expect(result.current.getChildren(ROOT_ID).find((n) => n.id === docId)).toBeDefined();
    });
  });

  describe("emptyTrash", () => {
    it("should permanently delete all items in trash", () => {
      const { result } = renderHook(() => useBinderTreeActions());

      act(() => {
        result.current.createDocumentInFolder(ROOT_ID, "Doc 1");
        result.current.createDocumentInFolder(ROOT_ID, "Doc 2");
      });

      const rootChildren = result.current.getChildren(ROOT_ID);
      act(() => {
        rootChildren.forEach((node) => {
          result.current.deleteNode(node.id);
        });
      });

      expect(result.current.getChildren(TRASH_ID).length).toBe(2);

      act(() => {
        result.current.emptyTrash();
      });

      expect(result.current.getChildren(TRASH_ID).length).toBe(0);
    });
  });
});
