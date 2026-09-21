import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../src/App';
import { countWords, createSampleProject, projectWordCount } from '../src/lib/project';

describe('OpenScriv MVP', () => {
  it('renders binder, editor, and inspector', () => {
    render(<App />);

    expect(screen.getByText('OpenScriv')).toBeInTheDocument();
    expect(screen.getByLabelText('Manuscript editor')).toBeInTheDocument();
    expect(screen.getByLabelText('Inspector')).toBeInTheDocument();
  });

  it('updates the active document text and word count', async () => {
    const user = userEvent.setup();
    render(<App />);

    const editor = screen.getByLabelText('Manuscript editor');
    await user.clear(editor);
    await user.type(editor, 'One two three four');

    expect(screen.getByText('4 words')).toBeInTheDocument();
  });

  it('counts words across the sample project', () => {
    const project = createSampleProject();
    expect(countWords('alpha beta gamma')).toBe(3);
    expect(projectWordCount(project)).toBeGreaterThan(5);
  });
});
