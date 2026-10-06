import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defaultSaveFn, saveDocument as saveDocumentExported } from '../src/hooks/useAutosave';

describe('useAutosave - defaultSaveFn', () => {
  let saveDocument: ReturnType<typeof vi.fn>;
  let saveDoc: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    saveDocument = vi.fn().mockResolvedValue(undefined);
    saveDoc = vi.fn().mockResolvedValue(undefined);

    // Set up window.electronAPI.saveDocument
    (window as any).electronAPI = {
      saveDocument: saveDocument,
    };

    // Set up window.saveDoc
    (window as any).saveDoc = saveDoc;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as any).electronAPI;
    delete (window as any).saveDoc;
    localStorage.clear();
  });

  it('should call electronAPI.saveDocument with { projectId: "default", docId, content }', async () => {
    await defaultSaveFn('doc-1', 'Draft text');

    expect(saveDocument).toHaveBeenCalledTimes(1);
    expect(saveDocument).toHaveBeenCalledWith({
      projectId: 'default',
      docId: 'doc-1',
      content: 'Draft text',
    });
  });

  it('should call electronAPI.saveDocument with custom projectId', async () => {
    await defaultSaveFn('doc-2', 'Custom draft', 'my-project');

    expect(saveDocument).toHaveBeenCalledWith({
      projectId: 'my-project',
      docId: 'doc-2',
      content: 'Custom draft',
    });
  });

  it('should fallback to window.saveDoc when electronAPI is not available', async () => {
    delete (window as any).electronAPI;

    await defaultSaveFn('doc-3', 'Fallback draft');

    expect(saveDoc).toHaveBeenCalledTimes(1);
    expect(saveDoc).toHaveBeenCalledWith('default', 'doc-3', 'Fallback draft');
  });

  it('should fallback to localStorage when neither electronAPI nor saveDoc available', async () => {
    delete (window as any).electronAPI;
    delete (window as any).saveDoc;

    await defaultSaveFn('doc-4', 'Local draft');

    expect(localStorage.getItem('doc:default:doc-4')).toBe('Local draft');
  });
});

describe('useAutosave - saveDocument', () => {
  let saveDocument: ReturnType<typeof vi.fn>;
  let saveDoc: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    saveDocument = vi.fn().mockResolvedValue(undefined);
    saveDoc = vi.fn().mockResolvedValue(undefined);

    (window as any).electronAPI = {
      saveDocument: saveDocument,
    };

    (window as any).saveDoc = saveDoc;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as any).electronAPI;
    delete (window as any).saveDoc;
    localStorage.clear();
  });

  it('should delegate to defaultSaveFn with correct params', async () => {
    await saveDocumentExported('doc-5', 'Save draft');

    expect(saveDocument).toHaveBeenCalledWith({
      projectId: 'default',
      docId: 'doc-5',
      content: 'Save draft',
    });
  });

  it('should pass custom projectId through', async () => {
    await saveDocumentExported('doc-6', 'Custom save', 'custom-proj');

    expect(saveDocument).toHaveBeenCalledWith({
      projectId: 'custom-proj',
      docId: 'doc-6',
      content: 'Custom save',
    });
  });
});
