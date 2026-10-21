import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScreenplayEditor from '../../src/components/Screenplay/ScreenplayEditor';

describe('ScreenplayEditor Component', () => {
  const sampleText = `Title: Test Script
Author: Test Author

INT. OFFICE - DAY

JOHN
Hello world.

FADE OUT.`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render editor with default text', () => {
      render(<ScreenplayEditor initialText={sampleText} />);

      expect(screen.getByText('Screenplay Editor')).toBeInTheDocument();
      expect(screen.getByText('Fountain')).toBeInTheDocument();
    });

    it('should render toolbar buttons', () => {
      render(<ScreenplayEditor />);

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Preview')).toBeInTheDocument();
      expect(screen.getByText('Split')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('should render textarea in edit mode', () => {
      render(<ScreenplayEditor initialText={sampleText} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveValue(sampleText);
    });

    it('should show word count in status bar', () => {
      render(<ScreenplayEditor initialText={sampleText} />);

      expect(screen.getByText(/\d+ words/)).toBeInTheDocument();
    });

    it('should show element count in status bar', () => {
      render(<ScreenplayEditor initialText={sampleText} />);

      expect(screen.getByText(/\d+ elements/)).toBeInTheDocument();
    });
  });

  describe('View Modes', () => {
    it('should switch to preview mode', async () => {
      render(<ScreenplayEditor initialText={sampleText} />);

      const previewButton = screen.getByText('Preview');
      fireEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText('Test Script')).toBeInTheDocument();
        expect(screen.getByText(/by Test Author/)).toBeInTheDocument();
      });
    });

    it('should switch to split view', () => {
      render(<ScreenplayEditor initialText={sampleText} />);

      const splitButton = screen.getByText('Split');
      fireEvent.click(splitButton);

      // In split view, both textarea and preview should be visible
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should switch back to edit mode', async () => {
      render(<ScreenplayEditor initialText={sampleText} />);

      // Switch to preview
      fireEvent.click(screen.getByText('Preview'));
      await waitFor(() => {
        expect(screen.getByText('Test Script')).toBeInTheDocument();
      });

      // Switch back to edit
      fireEvent.click(screen.getByText('Edit'));
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
    });
  });

  describe('Text Editing', () => {
    it('should update text when typing', async () => {
      const user = userEvent.setup();
      render(<ScreenplayEditor />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'INT. OFFICE - DAY');

      expect(textarea).toHaveValue('INT. OFFICE - DAY');
    });

    it('should show modified indicator after editing', async () => {
      const user = userEvent.setup();
      render(<ScreenplayEditor initialText={sampleText} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'New text');

      await waitFor(() => {
        expect(screen.getByText('Modified')).toBeInTheDocument();
      });
    });

    it('should update word count after editing', async () => {
      const user = userEvent.setup();
      render(<ScreenplayEditor />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello world test');

      await waitFor(() => {
        expect(screen.getByText(/3 words/)).toBeInTheDocument();
      });
    });
  });

  describe('Save Functionality', () => {
    it('should call onSave when save button is clicked', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      render(<ScreenplayEditor initialText={sampleText} onSave={onSave} />);

      // Make a change to enable save button
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, ' ');

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith(expect.stringContaining(sampleText));
    });

    it('should disable save button when not modified', () => {
      render(<ScreenplayEditor initialText={sampleText} />);

      const saveButton = screen.getByText('Save');
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button after modification', async () => {
      const user = userEvent.setup();
      render(<ScreenplayEditor initialText={sampleText} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, ' ');

      const saveButton = screen.getByText('Save');
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('Export Functionality', () => {
    it('should show export dropdown on hover', async () => {
      const user = userEvent.setup();
      render(<ScreenplayEditor initialText={sampleText} />);

      const exportButton = screen.getByText('Export');
      await user.hover(exportButton);

      await waitFor(() => {
        expect(screen.getByText('Fountain (.fountain)')).toBeInTheDocument();
        expect(screen.getByText('HTML (.html)')).toBeInTheDocument();
        expect(screen.getByText('PDF (.pdf)')).toBeInTheDocument();
      });
    });

    it('should call onExport when export option is clicked', async () => {
      const user = userEvent.setup();
      const onExport = vi.fn();
      render(<ScreenplayEditor initialText={sampleText} onExport={onExport} />);

      const exportButton = screen.getByText('Export');
      await user.hover(exportButton);

      const fountainOption = await screen.findByText('Fountain (.fountain)');
      fireEvent.click(fountainOption);

      expect(onExport).toHaveBeenCalledWith('fountain');
    });
  });

  describe('Preview Mode', () => {
    it('should render scene headings in preview', async () => {
      render(<ScreenplayEditor initialText={sampleText} />);

      fireEvent.click(screen.getByText('Preview'));

      await waitFor(() => {
        expect(screen.getByText('INT. OFFICE - DAY')).toBeInTheDocument();
      });
    });

    it('should render character names in preview', async () => {
      render(<ScreenplayEditor initialText={sampleText} />);

      fireEvent.click(screen.getByText('Preview'));

      await waitFor(() => {
        expect(screen.getByText('JOHN')).toBeInTheDocument();
      });
    });

    it('should render transitions in preview', async () => {
      render(<ScreenplayEditor initialText={sampleText} />);

      fireEvent.click(screen.getByText('Preview'));

      await waitFor(() => {
        expect(screen.getByText('FADE OUT.')).toBeInTheDocument();
      });
    });

    it('should render title page in preview', async () => {
      render(<ScreenplayEditor initialText={sampleText} />);

      fireEvent.click(screen.getByText('Preview'));

      await waitFor(() => {
        expect(screen.getByText('Test Script')).toBeInTheDocument();
        expect(screen.getByText(/by Test Author/)).toBeInTheDocument();
      });
    });
  });

  describe('Element Interaction', () => {
    it('should switch to edit mode when element is clicked in preview', async () => {
      render(<ScreenplayEditor initialText={sampleText} />);

      // Switch to preview
      fireEvent.click(screen.getByText('Preview'));

      await waitFor(() => {
        expect(screen.getByText('INT. OFFICE - DAY')).toBeInTheDocument();
      });

      // Click on element
      const sceneHeading = screen.getByText('INT. OFFICE - DAY');
      fireEvent.click(sceneHeading);

      // Should switch back to edit mode
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
    });
  });

  describe('Page Estimation', () => {
    it('should estimate page count', () => {
      render(<ScreenplayEditor initialText={sampleText} />);

      expect(screen.getByText(/~\d+ pages/)).toBeInTheDocument();
    });
  });

  describe('Placeholder Text', () => {
    it('should show placeholder when empty', () => {
      render(<ScreenplayEditor />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('placeholder');
    });
  });

  describe('Spell Check', () => {
    it('should disable spell check in textarea', () => {
      render(<ScreenplayEditor />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('spellCheck', 'false');
    });
  });
});
