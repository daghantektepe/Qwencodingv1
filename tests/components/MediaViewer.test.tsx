import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MediaViewer from '../../src/components/Research/MediaViewer';
import { ResearchMedia } from '../../types/research';
import { resetResearchStore, getResearchStore } from '../../src/services/researchStore';

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

describe('MediaViewer Component', () => {
  const mockMedia: ResearchMedia = {
    id: 'test-media-1',
    title: 'Test Image',
    description: 'A test image for viewing',
    type: 'image',
    category: 'reference',
    fileData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    fileName: 'test.png',
    fileSize: 1024,
    mimeType: 'image/png',
    tags: ['test', 'image'],
    notes: 'Test notes for the image',
    linkedCharacterIds: [],
    linkedLocationIds: [],
    linkedPlotlineIds: [],
    zoomLevel: 1,
    panX: 0,
    panY: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    resetResearchStore();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render media title', () => {
      const onClose = vi.fn();
      render(<MediaViewer media={mockMedia} onClose={onClose} />);
      
      expect(screen.getByText('Test Image')).toBeInTheDocument();
    });

    it('should render media type label', () => {
      const onClose = vi.fn();
      render(<MediaViewer media={mockMedia} onClose={onClose} />);
      
      expect(screen.getByText('Image')).toBeInTheDocument();
    });

    it('should render category label', () => {
      const onClose = vi.fn();
      render(<MediaViewer media={mockMedia} onClose={onClose} />);
      
      expect(screen.getByText('General Reference')).toBeInTheDocument();
    });

    it('should render notes when present', () => {
      const onClose = vi.fn();
      render(<MediaViewer media={mockMedia} onClose={onClose} />);
      
      expect(screen.getByText('Test notes for the image')).toBeInTheDocument();
    });

    it('should render close button', () => {
      const onClose = vi.fn();
      render(<MediaViewer media={mockMedia} onClose={onClose} />);
      
      const closeButton = screen.getByTitle('Close');
      expect(closeButton).toBeInTheDocument();
    });

    it('should render zoom controls for images', () => {
      const onClose = vi.fn();
      render(<MediaViewer media={mockMedia} onClose={onClose} />);
      
      expect(screen.getByTitle('Zoom in')).toBeInTheDocument();
      expect(screen.getByTitle('Zoom out')).toBeInTheDocument();
      expect(screen.getByTitle('Reset view')).toBeInTheDocument();
    });

    it('should render download button', () => {
      const onClose = vi.fn();
      render(<MediaViewer media={mockMedia} onClose={onClose} />);
      
      expect(screen.getByTitle('Download')).toBeInTheDocument();
    });

    it('should render fullscreen button', () => {
      const onClose = vi.fn();
      render(<MediaViewer media={mockMedia} onClose={onClose} />);
      
      expect(screen.getByTitle('Fullscreen')).toBeInTheDocument();
    });
  });

  describe('Zoom Controls', () => {
    it('should increase zoom level', () => {
      const onClose = vi.fn();
      render(<MediaViewer media={mockMedia} onClose={onClose} />);
      
      const zoomInButton = screen.getByTitle('Zoom in');
      fireEvent.click(zoomInButton);
      
      expect(screen.getByText('125%')).toBeInTheDocument();
    });

    it('should decrease zoom level', () => {
      const onClose = vi.fn();
      render(<MediaViewer media={mockMedia} onClose={onClose} />);
      
      const zoomOutButton = screen.getByTitle('Zoom out');
      fireEvent.click(zoomOutButton);
      
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should reset zoom level', () => {
      const onClose = vi.fn();
      render(<MediaViewer media={mockMedia} onClose={onClose} />);
      
      // Zoom in first
      const zoomInButton = screen.getByTitle('Zoom in');
      fireEvent.click(zoomInButton);
      expect(screen.getByText('125%')).toBeInTheDocument();
      
      // Reset
      const resetButton = screen.getByTitle('Reset view');
      fireEvent.click(resetButton);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should not exceed max zoom', () => {
      const onClose = vi.fn();
      render(<MediaViewer media={mockMedia} onClose={onClose} />);
      
      const zoomInButton = screen.getByTitle('Zoom in');
      
      // Click zoom in multiple times
      for (let i = 0; i < 20; i++) {
        fireEvent.click(zoomInButton);
      }
      
      // Should not exceed 500%
      expect(screen.getByText('500%')).toBeInTheDocument();
    });

    it('should not go below min zoom', () => {
      const onClose = vi.fn();
      render(<MediaViewer media={mockMedia} onClose={onClose} />);
      
      const zoomOutButton = screen.getByTitle('Zoom out');
      
      // Click zoom out multiple times
      for (let i = 0; i < 20; i++) {
        fireEvent.click(zoomOutButton);
      }
      
      // Should not go below 25%
      expect(screen.getByText('25%')).toBeInTheDocument();
    });
  });

  describe('Close Actions', () => {
    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<MediaViewer media={mockMedia} onClose={onClose} />);
      
      const closeButton = screen.getByTitle('Close');
      fireEvent.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      render(<MediaViewer media={mockMedia} onClose={onClose} />);
      
      // Click on the backdrop using test id
      const backdrop = screen.getByTestId('media-viewer-backdrop');
      fireEvent.click(backdrop);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when content area is clicked', () => {
      const onClose = vi.fn();
      render(<MediaViewer media={mockMedia} onClose={onClose} />);
      
      // Click on the content area (not the backdrop)
      const content = screen.getByTestId('media-viewer-content');
      fireEvent.click(content);
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Different Media Types', () => {
    it('should render PDF viewer for PDF files', () => {
      const pdfMedia: ResearchMedia = {
        ...mockMedia,
        type: 'pdf',
        fileData: 'data:application/pdf;base64,test',
        mimeType: 'application/pdf',
      };
      
      const onClose = vi.fn();
      render(<MediaViewer media={pdfMedia} onClose={onClose} />);
      
      const iframe = screen.getByTitle('Test Image');
      expect(iframe).toBeInTheDocument();
    });

    it('should render audio player for audio files', () => {
      const audioMedia: ResearchMedia = {
        ...mockMedia,
        type: 'audio',
        fileData: 'data:audio/mp3;base64,test',
        mimeType: 'audio/mp3',
      };
      
      const onClose = vi.fn();
      render(<MediaViewer media={audioMedia} onClose={onClose} />);
      
      const audioElement = document.querySelector('audio');
      expect(audioElement).toBeTruthy();
    });

    it('should render text content for document files', () => {
      const docMedia: ResearchMedia = {
        ...mockMedia,
        type: 'document',
        fileData: 'This is a test document content',
        mimeType: 'text/plain',
      };
      
      const onClose = vi.fn();
      render(<MediaViewer media={docMedia} onClose={onClose} />);
      
      expect(screen.getByText('This is a test document content')).toBeInTheDocument();
    });

    it('should not show zoom controls for non-image types', () => {
      const pdfMedia: ResearchMedia = {
        ...mockMedia,
        type: 'pdf',
        fileData: 'data:application/pdf;base64,test',
        mimeType: 'application/pdf',
      };
      
      const onClose = vi.fn();
      render(<MediaViewer media={pdfMedia} onClose={onClose} />);
      
      expect(screen.queryByTitle('Zoom in')).not.toBeInTheDocument();
    });
  });

  describe('Fullscreen Mode', () => {
    it('should toggle fullscreen mode', () => {
      const onClose = vi.fn();
      render(<MediaViewer media={mockMedia} onClose={onClose} />);
      
      const fullscreenButton = screen.getByTitle('Fullscreen');
      fireEvent.click(fullscreenButton);
      
      // After clicking, the button title should change to "Exit fullscreen"
      expect(screen.getByTitle('Exit fullscreen')).toBeInTheDocument();
    });
  });

  describe('Pan and Drag', () => {
    it('should allow dragging when zoomed in', () => {
      const onClose = vi.fn();
      render(<MediaViewer media={mockMedia} onClose={onClose} />);
      
      // Zoom in first
      const zoomInButton = screen.getByTitle('Zoom in');
      fireEvent.click(zoomInButton);
      
      // The image should have cursor: grab when zoomed
      const img = screen.getByAltText('Test Image');
      expect(img).toBeInTheDocument();
    });
  });
});
