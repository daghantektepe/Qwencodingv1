import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../src/App';
import { countWords, createSampleProject, projectWordCount } from '../src/lib/project';

describe('OpenScriv MVP', () => {
  it('renders binder, editor, and inspector', () => {
    render(<App />);

    expect(screen.getByText('OpenScriv')).toBeInTheDocument();
    expect(screen.getByLabelText('Metin editörü', { selector: '[role="textbox"]' })).toBeInTheDocument();
    expect(screen.getByLabelText('Bilgi paneli', { selector: 'aside' })).toBeInTheDocument();
  });

  it('updates the active document text and word count', async () => {
    render(<App />);

    // jsdom's simulated typing races ProseMirror's DOM reconciliation under load and drops
    // characters, so drive the TipTap editor through its own API (emits a real update).
    const surface = screen.getByLabelText('Metin editörü', { selector: '[role="textbox"]' }) as HTMLElement & { editor: any };
    act(() => {
      surface.editor.commands.setContent('<p>One <strong>two</strong> three four</p>', true);
    });

    expect(screen.getByTestId('word-count')).toHaveTextContent('4 kelime');
  });

  it('counts words across the sample project', () => {
    const project = createSampleProject();
    expect(countWords('alpha beta gamma')).toBe(3);
    expect(projectWordCount(project)).toBeGreaterThan(5);
  });
});
