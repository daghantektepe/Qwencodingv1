import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WelcomeHub } from '../../src/components/Project/WelcomeHub';
import { RecentProjectsService } from '../../src/services/recentProjects';

describe('WelcomeHub (Faz 2)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <WelcomeHub
        isOpen={false}
        onClose={vi.fn()}
        canClose={true}
        onOpenProject={vi.fn()}
        onCreateProject={vi.fn()}
        onLoadSampleProject={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders welcome hub with tabs when open', () => {
    render(
      <WelcomeHub
        isOpen={true}
        onClose={vi.fn()}
        canClose={true}
        onOpenProject={vi.fn()}
        onCreateProject={vi.fn()}
        onLoadSampleProject={vi.fn()}
      />
    );

    expect(screen.getByText('OpenScriv')).toBeInTheDocument();
    expect(screen.getByText('Yeni Proje')).toBeInTheDocument();
    expect(screen.getByText('Proje Aç (.opscriv)')).toBeInTheDocument();
  });

  it('submits new project form with custom template', async () => {
    const createMock = vi.fn().mockResolvedValue(true);
    const closeMock = vi.fn();

    render(
      <WelcomeHub
        isOpen={true}
        onClose={closeMock}
        canClose={true}
        onOpenProject={vi.fn()}
        onCreateProject={createMock}
        onLoadSampleProject={vi.fn()}
      />
    );

    // Yeni proje sekmesine geç
    fireEvent.click(screen.getByText('Yeni Proje'));

    const nameInput = screen.getByLabelText('Proje Adı');
    fireEvent.change(nameInput, { target: { value: 'Büyük Roman' } });

    const submitBtn = screen.getByText('Projeyi Oluştur ve Başla');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledWith('Büyük Roman', expect.any(String), 'clean');
      expect(closeMock).toHaveBeenCalled();
    });
  });

  it('calls onLoadSampleProject when sample project button is clicked', () => {
    const loadSampleMock = vi.fn();
    const closeMock = vi.fn();

    render(
      <WelcomeHub
        isOpen={true}
        onClose={closeMock}
        canClose={true}
        onOpenProject={vi.fn()}
        onCreateProject={vi.fn()}
        onLoadSampleProject={loadSampleMock}
      />
    );

    // Proje Aç sekmesine geç
    fireEvent.click(screen.getByText('Proje Aç (.opscriv)'));

    const sampleBtn = screen.getByText('Örnek Projeyi Yükle');
    fireEvent.click(sampleBtn);

    expect(loadSampleMock).toHaveBeenCalled();
    expect(closeMock).toHaveBeenCalled();
  });

  it('displays hero card and recent projects list when recent projects exist', () => {
    RecentProjectsService.add({ name: 'Eski Proje', path: 'C:/docs/eski.opscriv' });

    render(
      <WelcomeHub
        isOpen={true}
        onClose={vi.fn()}
        canClose={true}
        onOpenProject={vi.fn()}
        onCreateProject={vi.fn()}
        onLoadSampleProject={vi.fn()}
      />
    );

    expect(screen.getByText('Son Çalışılan Proje')).toBeInTheDocument();
    expect(screen.getAllByText('Eski Proje').length).toBe(2);
  });
});
