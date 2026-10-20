import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResearchVault from '../../src/components/Research/ResearchVault';
import * as researchStoreModule from '../../src/services/researchStore';

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

// Mock FileReader
globalThis.FileReader = vi.fn().mockImplementation(() => ({
  readAsDataURL: vi.fn(function(this: { result: string; onload: ((e: { target: { result: string } }) => void) | null }) {
    this.result = 'data:image/png;base64,mockdata';
    if (this.onload) {
      this.onload({ target: { result: this.result } });
    }
  }),
  result: '',
  onload: null,
})) as any;

describe('ResearchVault Component', () => {
  beforeEach(() => {
    if (typeof researchStoreModule.resetResearchStore === 'function') {
      researchStoreModule.resetResearchStore();
    }
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the header with title', () => {
      render(<ResearchVault />);
      expect(screen.getByText('Research Vault')).toBeInTheDocument();
    });

    it('should render the Add Media button', () => {
      render(<ResearchVault />);
      expect(screen.getByText('Add Media')).toBeInTheDocument();
    });

    it('should render search input', () => {
      render(<ResearchVault />);
      expect(screen.getByPlaceholderText('Search media...')).toBeInTheDocument();
    });

    it('should render view mode buttons', () => {
      render(<ResearchVault />);
      expect(screen.getByTitle('Grid view')).toBeInTheDocument();
      expect(screen.getByTitle('List view')).toBeInTheDocument();
    });

    it('should show empty state when no media', () => {
      render(<ResearchVault />);
      expect(screen.getByText('No media yet. Add your first research material!')).toBeInTheDocument();
    });

    it('should show folders section', () => {
      render(<ResearchVault />);
      expect(screen.getByText('Folders')).toBeInTheDocument();
      expect(screen.getByText('All Media (0)')).toBeInTheDocument();
    });

    it('should show stats section', () => {
      render(<ResearchVault />);
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('Images')).toBeInTheDocument();
      expect(screen.getByText('PDFs')).toBeInTheDocument();
    });
  });

  describe('Adding Media', () => {
    it('should show form when Add Media is clicked', async () => {
      render(<ResearchVault />);
      
      fireEvent.click(screen.getByText('Add Media'));
      
      await waitFor(() => {
        expect(screen.getByText('Add New Media')).toBeInTheDocument();
      });
    });

    it('should close form on cancel', async () => {
      render(<ResearchVault />);
      
      fireEvent.click(screen.getByText('Add Media'));
      await waitFor(() => {
        expect(screen.getByText('Add New Media')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Cancel'));
      
      await waitFor(() => {
        expect(screen.queryByText('Add New Media')).not.toBeInTheDocument();
      });
    });
  });

  describe('View Modes', () => {
    it('should switch to list view', () => {
      render(<ResearchVault />);
      
      fireEvent.click(screen.getByTitle('List view'));
      
      const store = researchStoreModule.getResearchStore();
      expect(store.getState().viewMode).toBe('list');
    });

    it('should switch to grid view', () => {
      const store = researchStoreModule.getResearchStore();
      store.dispatch({ type: 'SET_VIEW_MODE', payload: 'list' });
      
      render(<ResearchVault />);
      
      fireEvent.click(screen.getByTitle('Grid view'));
      
      expect(store.getState().viewMode).toBe('grid');
    });
  });

  describe('Split View', () => {
    it('should toggle split view', () => {
      render(<ResearchVault />);
      
      const splitButton = screen.getByTitle('Toggle split view');
      fireEvent.click(splitButton);
      
      const store = researchStoreModule.getResearchStore();
      expect(store.getState().splitViewActive).toBe(true);
    });
  });

  describe('Folder Management', () => {
    it('should show folder form when folder plus is clicked', () => {
      render(<ResearchVault />);
      
      const folderButton = screen.getByTitle('New folder');
      fireEvent.click(folderButton);
      
      expect(screen.getByPlaceholderText('Folder name')).toBeInTheDocument();
    });

    it('should create a folder', async () => {
      const user = userEvent.setup();
      render(<ResearchVault />);
      
      // Open folder form
      fireEvent.click(screen.getByTitle('New folder'));
      
      // Fill in folder name
      const nameInput = screen.getByPlaceholderText('Folder name');
      await user.type(nameInput, 'Characters');
      
      // Click create
      fireEvent.click(screen.getByText('Create'));
      
      await waitFor(() => {
        expect(screen.getByText('Characters')).toBeInTheDocument();
      });
    });
  });

  describe('Filters', () => {
    beforeEach(() => {
      const store = researchStoreModule.getResearchStore();
      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'Test Image',
          description: 'A test image',
          type: 'image',
          category: 'character',
          fileData: 'data:image/png;base64,test',
          fileName: 'test.png',
          fileSize: 1024,
          mimeType: 'image/png',
          tags: ['test'],
        },
      });
      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'Test PDF',
          description: 'A test PDF',
          type: 'pdf',
          category: 'reference',
          fileData: 'data:application/pdf;base64,test',
          fileName: 'test.pdf',
          fileSize: 2048,
          mimeType: 'application/pdf',
          tags: ['document'],
        },
      });
    });

    it('should filter by type', async () => {
      render(<ResearchVault />);
      
      const typeSelect = screen.getByDisplayValue('All Types');
      fireEvent.change(typeSelect, { target: { value: 'pdf' } });
      
      await waitFor(() => {
        // Check that the filtered media count is 1
        expect(screen.getByText('1 items')).toBeInTheDocument();
        // Check that only PDF card is present
        const mediaCards = screen.getAllByTestId('media-card');
        expect(mediaCards).toHaveLength(1);
        expect(mediaCards[0]).toHaveTextContent('Test PDF');
      });
    });

    it('should filter by search', async () => {
      const user = userEvent.setup();
      render(<ResearchVault />);
      
      const searchInput = screen.getByPlaceholderText('Search media...');
      await user.type(searchInput, 'Image');
      
      await waitFor(() => {
        // Check that the filtered media count is 1
        expect(screen.getByText('1 items')).toBeInTheDocument();
        // Check that Test Image card is present
        const mediaCards = screen.getAllByTestId('media-card');
        expect(mediaCards).toHaveLength(1);
        expect(mediaCards[0]).toHaveTextContent('Test Image');
      });
    });
  });

  describe('Media Selection', () => {
    beforeEach(() => {
      const store = researchStoreModule.getResearchStore();
      store.dispatch({
        type: 'ADD_MEDIA',
        payload: {
          title: 'Selectable Media',
          description: 'A media item',
          type: 'image',
          category: 'reference',
          fileData: 'data:image/png;base64,test',
          fileName: 'test.png',
          fileSize: 1024,
          mimeType: 'image/png',
        },
      });
    });

    it('should select media when clicked', () => {
      render(<ResearchVault />);
      
      const mediaCards = screen.getAllByTestId('media-card');
      fireEvent.click(mediaCards[0]);
      
      const store = researchStoreModule.getResearchStore();
      expect(store.getState().selectedMediaId).toBeTruthy();
    });
  });
});
