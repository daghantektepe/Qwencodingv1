import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../src/App';

describe('OpenScriv Full Ecosystem Integration', () => {
  it('switches between Editor, Corkboard, and Outliner views', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Initially in Editor view (the toolbar button shares the name, so target the text surface)
    expect(screen.getByLabelText('Metin editörü', { selector: '[role="textbox"]' })).toBeInTheDocument();

    // Switch to Corkboard view
    const corkboardBtn = screen.getByTitle('Mantar pano');
    await user.click(corkboardBtn);

    expect(screen.getByRole('list', { name: 'Mantar pano kartları' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Metin editörü', { selector: '[role="textbox"]' })).not.toBeInTheDocument();

    // Switch to Outliner view
    const outlinerBtn = screen.getByTitle('Ana hat (tablo görünümü)');
    await user.click(outlinerBtn);

    expect(screen.getByRole('table')).toBeInTheDocument();

    // Switch back to Editor view
    const editorBtn = screen.getByTitle('Metin editörü');
    await user.click(editorBtn);

    expect(screen.getByLabelText('Metin editörü', { selector: '[role="textbox"]' })).toBeInTheDocument();
  });

  it('switches Inspector tabs between Metadata, Snapshots, and Targets', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Initially in Metadata tab
    expect(screen.getByLabelText('Bilgi paneli', { selector: 'aside' })).toBeInTheDocument();
    expect(screen.getByText('Özet')).toBeInTheDocument();

    // Switch to Snapshots tab
    const snapshotsTabBtn = screen.getByTitle('Sürümler (anlık görüntüler)');
    await user.click(snapshotsTabBtn);

    expect(screen.getByRole('heading', { name: 'Sürümler' })).toBeInTheDocument();
    expect(screen.getByText('Sürüm kaydet')).toBeInTheDocument();

    // Switch to Targets / WordCount tab
    const targetsTabBtn = screen.getByTitle('Kelime ve hedef takibi');
    await user.click(targetsTabBtn);

    expect(screen.getByText('Kelime Sayacı')).toBeInTheDocument();
  });

  it('opens and closes Search modal', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Click search box
    const searchTrigger = screen.getByRole('button', { name: 'Projede ara' });
    await user.click(searchTrigger);

    // Search panel opens with role="search"
    expect(screen.getByRole('search', { name: 'Proje içinde ara' })).toBeInTheDocument();
    const searchInput = screen.getByPlaceholderText(/Tüm projede ara/i);
    expect(searchInput).toBeInTheDocument();

    // Type in search
    await user.type(searchInput, 'zarf');
    await waitFor(() => {
      expect(screen.getByText('Bölüm 2: İpucu')).toBeInTheDocument();
    });

    // Close search
    const closeBtn = screen.getByRole('button', { name: 'Arama panelini kapat' });
    await user.click(closeBtn);

    expect(screen.queryByRole('search', { name: 'Proje içinde ara' })).not.toBeInTheDocument();
  });

  it('opens and closes Compile / Export dialog', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Click Compile button in toolbar
    const compileBtn = screen.getByTitle('Projeyi derle ve dışa aktar');
    await user.click(compileBtn);

    // Compile modal opens
    expect(screen.getByRole('dialog', { name: 'Proje Derle' })).toBeInTheDocument();
    expect(screen.getByText('Derle ve Dışa Aktar')).toBeInTheDocument();
    expect(screen.getByText('Markdown (.md)')).toBeInTheDocument();

    // Close modal
    const cancelBtn = screen.getByRole('button', { name: 'Vazgeç' });
    await user.click(cancelBtn);

    expect(screen.queryByRole('dialog', { name: 'Proje Derle' })).not.toBeInTheDocument();
  });
});
