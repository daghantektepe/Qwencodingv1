import { describe, expect, it, vi } from 'vitest';
import { defaultSaveFn } from '../src/hooks/useAutosave';

describe('defaultSaveFn', () => {
  it('sends the structured payload expected by the Electron IPC bridge', async () => {
    const saveDocument = vi.fn().mockResolvedValue({ ok: true });
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      value: { saveDocument },
    });

    await defaultSaveFn('doc-1', 'Draft text');

    expect(saveDocument).toHaveBeenCalledWith({
      projectId: 'default',
      docId: 'doc-1',
      content: 'Draft text',
    });
  });
});
