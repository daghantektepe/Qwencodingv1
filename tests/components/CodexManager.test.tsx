/**
 * Component tests for CodexManager
 * 
 * These tests require a test runner (vitest) with React Testing Library.
 * To run: npx vitest run tests/components/CodexManager.test.tsx
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CodexManager from '../../src/components/Codex/CodexManager';
import * as codexStoreModule from '../../src/services/codexStore';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Mock confirm dialog
globalThis.confirm = vi.fn(() => true);

describe('CodexManager Component', () => {
  beforeEach(() => {
    // Ensure the functions exist before calling them
    if (typeof codexStoreModule.resetCodexStore === 'function') {
      codexStoreModule.resetCodexStore();
    }
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the header with title', () => {
      render(<CodexManager />);
      expect(screen.getByText('Character Codex')).toBeInTheDocument();
    });

    it('should render the Add Character button', () => {
      render(<CodexManager />);
      expect(screen.getByTestId('add-character-button')).toBeInTheDocument();
    });

    it('should render search input', () => {
      render(<CodexManager />);
      expect(screen.getByPlaceholderText('Search characters...')).toBeInTheDocument();
    });

    it('should render view mode buttons', () => {
      render(<CodexManager />);
      // Grid, List, Graph buttons should be present (they have title attributes)
      expect(screen.getByTitle('Grid view')).toBeInTheDocument();
      expect(screen.getByTitle('List view')).toBeInTheDocument();
      expect(screen.getByTitle('Graph view')).toBeInTheDocument();
    });

    it('should show empty state when no characters', () => {
      render(<CodexManager />);
      expect(screen.getByText('No characters yet. Create your first character!')).toBeInTheDocument();
    });

    it('should show character count badge', () => {
      const store = codexStoreModule.getCodexStore();
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Test', role: 'npc', description: '' },
      });

      render(<CodexManager />);
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('Adding Characters', () => {
    it('should show form when Add Character is clicked', async () => {
      render(<CodexManager />);
      
      fireEvent.click(screen.getByTestId('add-character-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('form-title')).toHaveTextContent('New Character');
      });
    });

    it('should create a character with name', async () => {
      const user = userEvent.setup();
      render(<CodexManager />);
      
      fireEvent.click(screen.getByTestId('add-character-button'));
      
      const nameInput = screen.getByPlaceholderText('Character name');
      await user.type(nameInput, 'Aragorn');
      
      fireEvent.click(screen.getByText('Create'));
      
      await waitFor(() => {
        expect(screen.getByText('Aragorn')).toBeInTheDocument();
      });
    });

    it('should not create character without name', async () => {
      render(<CodexManager />);
      
      fireEvent.click(screen.getByTestId('add-character-button'));
      
      const createBtn = screen.getByText('Create');
      expect(createBtn).toBeDisabled();
    });

    it('should close form on cancel', async () => {
      render(<CodexManager />);
      
      fireEvent.click(screen.getByTestId('add-character-button'));
      await waitFor(() => {
        expect(screen.getByTestId('form-title')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Cancel'));
      
      await waitFor(() => {
        expect(screen.queryByTestId('form-title')).not.toBeInTheDocument();
      });
    });
  });

  describe('Search and Filter', () => {
    beforeEach(() => {
      const store = codexStoreModule.getCodexStore();
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Frodo', role: 'protagonist', description: 'Hobbit' },
      });
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Sauron', role: 'antagonist', description: 'Dark lord' },
      });
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Gandalf', role: 'supporting', description: 'Wizard' },
      });
    });

    it('should filter characters by search query', async () => {
      const user = userEvent.setup();
      render(<CodexManager />);
      
      const searchInput = screen.getByPlaceholderText('Search characters...');
      await user.type(searchInput, 'Frodo');
      
      await waitFor(() => {
        expect(screen.getByText('Frodo')).toBeInTheDocument();
        expect(screen.queryByText('Sauron')).not.toBeInTheDocument();
      });
    });

    it('should filter by role', async () => {
      render(<CodexManager />);
      
      const roleSelect = screen.getByDisplayValue('All Roles');
      fireEvent.change(roleSelect, { target: { value: 'antagonist' } });
      
      await waitFor(() => {
        expect(screen.getByText('Sauron')).toBeInTheDocument();
        expect(screen.queryByText('Frodo')).not.toBeInTheDocument();
        expect(screen.queryByText('Gandalf')).not.toBeInTheDocument();
      });
    });

    it('should show no results message', async () => {
      const user = userEvent.setup();
      render(<CodexManager />);
      
      const searchInput = screen.getByPlaceholderText('Search characters...');
      await user.type(searchInput, 'nonexistent');
      
      await waitFor(() => {
        expect(screen.getByText('No characters match your filters')).toBeInTheDocument();
      });
    });
  });

  describe('View Modes', () => {
    beforeEach(() => {
      const store = codexStoreModule.getCodexStore();
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'TestChar', role: 'supporting', description: 'Test' },
      });
      store.dispatch({ type: 'SELECT_CHARACTER', payload: null });
    });

    it('should switch to list view', () => {
      render(<CodexManager />);
      
      fireEvent.click(screen.getByTitle('List view'));
      
      // In list view, character name should still be visible
      expect(screen.getByText('TestChar')).toBeInTheDocument();
    });

    it('should switch to graph view', () => {
      render(<CodexManager />);
      
      fireEvent.click(screen.getByTitle('Graph view'));
      
      // Graph view should show canvas info
      expect(screen.getByText('1 characters · 0 relationships')).toBeInTheDocument();
    });
  });

  describe('Character Selection', () => {
    it('should show details sidebar when character is selected', async () => {
      const store = codexStoreModule.getCodexStore();
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Selected', role: 'protagonist', description: 'A hero' },
      });
      store.dispatch({ type: 'SELECT_CHARACTER', payload: null });

      render(<CodexManager />);
      
      // Click on the character card
      fireEvent.click(screen.getByText('Selected'));
      
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
    });
  });

  describe('Character Deletion', () => {
    it('should delete character after confirmation', async () => {
      const store = codexStoreModule.getCodexStore();
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'ToDelete', role: 'npc', description: '' },
      });

      render(<CodexManager />);
      
      // Find and click delete button (Trash2 icon button)
      const deleteButtons = screen.getAllByTitle('Delete character');
      fireEvent.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(screen.queryByText('ToDelete')).not.toBeInTheDocument();
      });
    });
  });
});
