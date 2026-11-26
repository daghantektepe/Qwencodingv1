import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useBinderTreeActions,
  ROOT_ID,
  TRASH_ID,
} from '../../src/components/Binder/BinderTreeActions';

describe('BinderTreeActions Hook', () => {
  beforeEach(() => {
    // No global state to reset; each test creates a fresh hook instance.
  });

  it('selects a node via selectNode', () => {
    const { result } = renderHook(() => useBinderTreeActions());

    act(() => {
      result.current.selectNode('some-id');
    });

    expect(result.current.selectedNodeId).toBe('some-id');
  });

  it('returns error when parent folder does not exist', () => {
    const { result } = renderHook(() => useBinderTreeActions());

    let response: { error: string | null; createdNode: any } | undefined;

    act(() => {
      response = result.current.createDocumentInFolder(
        'nonexistent-folder',
        'Orphan Doc'
      );
    });

    // The hook should return a structured error object.
    expect(response).toBeDefined();
    expect(response!.error).toBe('Parent folder not found');
    expect(response!.createdNode).toBeNull();
  });
});
