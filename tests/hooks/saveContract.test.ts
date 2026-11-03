import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutosave, defaultSaveFn } from '../../src/hooks/useAutosave';

describe('True Save Contract (Faz 3)', () => {
  let saveDocMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    saveDocMock = vi.fn().mockResolvedValue(undefined);
    (window as any).saveDoc = saveDocMock;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete (window as any).electronAPI;
    delete (window as any).saveDoc;
    localStorage.clear();
  });

  it('initial state should be idle and lastSavedAt null', () => {
    const { result } = renderHook(() =>
      useAutosave({ docId: 'doc-1', content: 'Metin 1' })
    );

    expect(result.current.saveStatus).toBe('idle');
    expect(result.current.lastSavedAt).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should transition to dirty and then saved after debounce delay', async () => {
    const statusChanges: string[] = [];
    let currentDoc = { docId: 'doc-1', content: 'İlk metin' };

    const { result, rerender } = renderHook(
      ({ doc }) =>
        useAutosave(doc, {
          delay: 500,
          onStatusChange: (s) => statusChanges.push(s),
        }),
      { initialProps: { doc: currentDoc } }
    );

    // İçerik değişiyor
    currentDoc = { docId: 'doc-1', content: 'İkinci değişen metin' };
    rerender({ doc: currentDoc });

    expect(result.current.saveStatus).toBe('dirty');
    expect(statusChanges).toContain('dirty');

    // Debounce zamanlayıcısını çalıştır
    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });

    expect(result.current.saveStatus).toBe('saved');
    expect(result.current.lastSavedAt).toBeTruthy();
    expect(result.current.error).toBeNull();
    expect(saveDocMock).toHaveBeenCalledTimes(1);
  });

  it('should transition to error if save fails and surface the error message', async () => {
    saveDocMock.mockRejectedValueOnce(new Error('Disk dolu veya izin reddedildi'));

    let currentDoc = { docId: 'doc-err', content: 'Başlangıç' };
    const { result, rerender } = renderHook(
      ({ doc }) =>
        useAutosave(doc, {
          delay: 300,
        }),
      { initialProps: { doc: currentDoc } }
    );

    currentDoc = { docId: 'doc-err', content: 'Hatalı değişiklik' };
    rerender({ doc: currentDoc });

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(result.current.saveStatus).toBe('error');
    expect(result.current.error).toContain('Disk dolu');
  });

  it('saveNow should trigger immediate save and clear timers', async () => {
    const { result } = renderHook(() =>
      useAutosave({ docId: 'doc-manual', content: 'Manuel metin' }, { delay: 5000 })
    );

    await act(async () => {
      await result.current.saveNow();
    });

    expect(saveDocMock).toHaveBeenCalledWith('default', 'doc-manual', 'Manuel metin');
    expect(result.current.saveStatus).toBe('saved');
  });
});
