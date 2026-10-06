import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defaultSaveFn, saveDocument } from '../hooks/useAutosave';

describe('useAutosave', () => {
  let saveDocumentMock: ReturnType<typeof vi.fn>;
  let saveDocMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    saveDocumentMock = vi.fn().mockResolvedValue(undefined);
    saveDocMock = vi.fn().mockResolvedValue(undefined);

    // Set up window.electronAPI
    (window as any).electronAPI = {
      saveDocument: saveDocumentMock,
    };

    // Set up window.saveDoc
    (window as any).saveDoc = saveDocMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as any).electronAPI;
    delete (window as any).saveDoc;
    localStorage.clear();
  });

  describe('defaultSaveFn', () => {
    it('should call electronAPI.saveDocument with { projectId, docId, content }', async () => {
      await defaultSaveFn('doc-123', 'Hello world content');

      expect(saveDocumentMock).toHaveBeenCalledTimes(1);
      expect(saveDocumentMock).toHaveBeenCalledWith({
        projectId: 'default',
        docId: 'doc-123',
        content: 'Hello world content',
      });
    });

    it('should call electronAPI.saveDocument with custom projectId', async () => {
      await defaultSaveFn('doc-456', 'Custom content', 'my-project');

      expect(saveDocumentMock).toHaveBeenCalledWith({
        projectId: 'my-project',
        docId: 'doc-456',
        content: 'Custom content',
      });
    });

    it('should fallback to saveDoc when electronAPI is not available', async () => {
      delete (window as any).electronAPI;

      await defaultSaveFn('doc-789', 'Fallback content');

      expect(saveDocMock).toHaveBeenCalledTimes(1);
      expect(saveDocMock).toHaveBeenCalledWith('default', 'doc-789', 'Fallback content');
    });

    it('should fallback to localStorage when neither electronAPI nor saveDoc available', async () => {
      delete (window as any).electronAPI;
      delete (window as any).saveDoc;

      await defaultSaveFn('doc-local', 'Local content');

      expect(localStorage.getItem('doc:default:doc-local')).toBe('Local content');
    });
  });

  describe('saveDocument', () => {
    it('should delegate to defaultSaveFn with correct params', async () => {
      await saveDocument('doc-save', 'Save content');

      expect(saveDocumentMock).toHaveBeenCalledWith({
        projectId: 'default',
        docId: 'doc-save',
        content: 'Save content',
      });
    });

    it('should pass custom projectId through', async () => {
      await saveDocument('doc-save', 'Save content', 'custom-proj');

      expect(saveDocumentMock).toHaveBeenCalledWith({
        projectId: 'custom-proj',
        docId: 'doc-save',
        content: 'Save content',
      });
    });
  });
});
