import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../src/App';

describe('OpenScriv Full Ecosystem Integration', () => {
  it('switches between Editor, Corkboard, and Outliner views', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Initially in Editor view
    expect(screen.getByLabelText('Manuscript editor')).toBeInTheDocument();

    // Switch to Corkboard view
    const corkboardBtn = screen.getByTitle('Mantar Pano (Corkboard)');
    await user.click(corkboardBtn);

    expect(screen.getByText(/Mantar Pano/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Manuscript editor')).not.toBeInTheDocument();

    // Switch to Outliner view
    const outlinerBtn = screen.getByTitle('Tablo Görünümü (Outliner)');
    await user.click(outlinerBtn);

    expect(screen.getByRole('table')).toBeInTheDocument();

    // Switch back to Editor view
    const editorBtn = screen.getByTitle('Metin Editörü');
    await user.click(editorBtn);

    expect(screen.getByLabelText('Manuscript editor')).toBeInTheDocument();
  });

  it('switches Inspector tabs between Metadata, Snapshots, and Targets', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Initially in Metadata tab
    expect(screen.getByLabelText('Inspector')).toBeInTheDocument();
    expect(screen.getByText('Synopsis')).toBeInTheDocument();

    // Switch to Snapshots tab
    const snapshotsTabBtn = screen.getByTitle('Anlık Görüntüler (Snapshots)');
    await user.click(snapshotsTabBtn);

    expect(screen.getByText('Anlık Görüntüler')).toBeInTheDocument();
    expect(screen.getByText('📸 Snapshot Al')).toBeInTheDocument();

    // Switch to Targets / WordCount tab
    const targetsTabBtn = screen.getByTitle('Kelime ve Hedef Takibi');
    await user.click(targetsTabBtn);

    expect(screen.getByText('Kelime Sayacı')).toBeInTheDocument();
  });

  it('opens and closes Search modal', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Click search box
    const searchTrigger = screen.getByRole('button', { name: 'Arama Yap' });
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
    const compileBtn = screen.getByTitle('Projeyi Derle ve Dışa Aktar');
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
