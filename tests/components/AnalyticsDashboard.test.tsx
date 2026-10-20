import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AnalyticsDashboard from '../../src/components/Analytics/AnalyticsDashboard';
import { resetAnalyticsStore, getAnalyticsStore } from '../../src/services/analyticsStore';

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

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    resetAnalyticsStore();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the dashboard header', () => {
      render(<AnalyticsDashboard />);
      expect(screen.getByText('Writing Analytics')).toBeInTheDocument();
    });

    it('should render tab buttons', () => {
      render(<AnalyticsDashboard />);
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Readability')).toBeInTheDocument();
      expect(screen.getByText('Word Analysis')).toBeInTheDocument();
    });

    it('should render stats cards', () => {
      render(<AnalyticsDashboard />);
      expect(screen.getByText('Total Words')).toBeInTheDocument();
      expect(screen.getByText('Writing Time')).toBeInTheDocument();
      expect(screen.getByText('Avg WPM')).toBeInTheDocument();
      expect(screen.getByText('Sessions')).toBeInTheDocument();
    });

    it('should show heatmap section', () => {
      render(<AnalyticsDashboard />);
      expect(screen.getByText('Writing Activity')).toBeInTheDocument();
    });

    it('should show WPM chart', () => {
      render(<AnalyticsDashboard />);
      expect(screen.getByText('Writing Speed (WPM)')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to readability tab', () => {
      render(<AnalyticsDashboard />);
      
      fireEvent.click(screen.getByText('Readability'));
      
      expect(screen.getByText('Readability Analysis')).toBeInTheDocument();
    });

    it('should switch to word analysis tab', () => {
      render(<AnalyticsDashboard />);
      
      fireEvent.click(screen.getByText('Word Analysis'));
      
      expect(screen.getByText('Word Frequency')).toBeInTheDocument();
    });

    it('should switch back to overview tab', () => {
      render(<AnalyticsDashboard />);
      
      fireEvent.click(screen.getByText('Readability'));
      fireEvent.click(screen.getByText('Overview'));
      
      expect(screen.getByText('Writing Activity')).toBeInTheDocument();
    });
  });

  describe('Date Range', () => {
    it('should have date range inputs', () => {
      render(<AnalyticsDashboard />);
      
      const dateInputs = screen.getAllByRole('textbox');
      expect(dateInputs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Empty State', () => {
    it('should show empty state for WPM chart when no sessions', () => {
      render(<AnalyticsDashboard />);
      expect(screen.getByText('No writing sessions yet')).toBeInTheDocument();
    });

    it('should show empty state for readability when no text', () => {
      render(<AnalyticsDashboard />);
      fireEvent.click(screen.getByText('Readability'));
      expect(screen.getByText('No text to analyze')).toBeInTheDocument();
    });

    it('should show empty state for word frequency when no text', () => {
      render(<AnalyticsDashboard />);
      fireEvent.click(screen.getByText('Word Analysis'));
      expect(screen.getByText('No text to analyze')).toBeInTheDocument();
    });
  });

  describe('With Data', () => {
    beforeEach(() => {
      const store = getAnalyticsStore();
      store.dispatch({
        type: 'SET_CURRENT_TEXT',
        payload: 'The quick brown fox jumps over the lazy dog. This is a simple sentence for testing readability.',
      });
      store.dispatch({
        type: 'ADD_SESSION',
        payload: {
          startTime: '2024-01-15T10:00:00.000Z',
          endTime: '2024-01-15T10:30:00.000Z',
          duration: 1800,
          wordsWritten: 500,
          wordsDeleted: 50,
          netWords: 450,
          wpm: 15,
          documentId: 'doc-1',
        },
      });
    });

    it('should display readability metrics when text is set', () => {
      render(<AnalyticsDashboard />);
      fireEvent.click(screen.getByText('Readability'));
      
      expect(screen.getByText('Flesch Reading Ease')).toBeInTheDocument();
      expect(screen.getByText('Gunning Fog Index')).toBeInTheDocument();
    });

    it('should display word frequency when text is set', () => {
      render(<AnalyticsDashboard />);
      fireEvent.click(screen.getByText('Word Analysis'));
      
      expect(screen.getByText(/unique words/)).toBeInTheDocument();
    });
  });
});
