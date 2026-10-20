import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CodexMentionExtension, { highlightText, MentionMarker, Mention } from '../../src/components/Codex/CodexMentionExtension';

describe('CodexMentionExtension', () => {
  const mockMentions: Mention[] = [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
  ];

  describe('Rendering', () => {
    it('renders text correctly', () => {
      render(<CodexMentionExtension text="Hello World" mentions={[]} />);
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('highlights mentioned names', () => {
      render(<CodexMentionExtension text="Hi Alice and Bob" mentions={mockMentions} />);
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.querySelector('.codex-mention-highlight')).toBeInTheDocument();
    });

    it('supports compact mode', () => {
      const longText = 'This is a very long text that should be truncated in compact mode when collapsed.';
      render(<CodexMentionExtension text={longText} mentions={[]} compact={true} />);
      expect(screen.getByText(/This is a very long text that.../)).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('calls onMentionClick when a highlighted mention is clicked', async () => {
      const handleMentionClick = jest.fn();
      render(
        <CodexMentionExtension 
          text="Talk to Alice" 
          mentions={mockMentions} 
          onMentionClick={handleMentionClick} 
        />
      );
      
      await userEvent.click(screen.getByText('Alice'));
      expect(handleMentionClick).toHaveBeenCalledWith({ id: '1', name: 'Alice' });
    });

    it('toggles expansion in compact mode', async () => {
      const longText = 'Short start but this part is hidden initially in compact mode.';
      render(<CodexMentionExtension text={longText} mentions={[]} compact={true} />);
      
      const toggleButton = screen.getByText('Expand');
      await userEvent.click(toggleButton);
      
      expect(screen.getByText(longText)).toBeInTheDocument();
      expect(screen.getByText('Collapse')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty text', () => {
      render(<CodexMentionExtension text="" mentions={mockMentions} />);
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    });

    it('handles special characters in names safely', () => {
      const specialMentions: Mention[] = [{ id: '3', name: 'A.B*C' }];
      render(<CodexMentionExtension text="User A.B*C logged in" mentions={specialMentions} />);
      expect(screen.getByText('A.B*C')).toBeInTheDocument();
    });

    it('respects word boundaries', () => {
      render(<CodexMentionExtension text="Alphabetical order" mentions={[{ id: '4', name: 'Alpha' }]} />);
      expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    });
  });

  describe('Utility Functions', () => {
    it('highlightText returns array with spans for matches', () => {
      const result = highlightText("Hi Bob", mockMentions);
      expect(Array.isArray(result)).toBe(true);
      // Should contain a span element for Bob
      const hasSpan = result.some(item => React.isValidElement(item) && item.type === 'span');
      expect(hasSpan).toBe(true);
    });

    it('MentionMarker renders @name', () => {
      render(<MentionMarker mention={{ id: '5', name: 'Charlie' }} />);
      expect(screen.getByText('@Charlie')).toBeInTheDocument();
    });
  });
});
