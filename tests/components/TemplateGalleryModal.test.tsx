import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TemplateGalleryModal from '../../src/components/Templates/TemplateGalleryModal';

describe('TemplateGalleryModal Component', () => {
  it('renders modal when isOpen is true', () => {
    render(
      <TemplateGalleryModal
        isOpen={true}
        onClose={vi.fn()}
        onSelectTemplate={vi.fn()}
      />
    );

    expect(screen.getByTestId('template-gallery-modal')).toBeInTheDocument();
    expect(screen.getByText(/Proje Şablon Galerisi & Sihirbazı/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Klasik Roman/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Akademik Tez ve Araştırma Makalesi/i)).toBeInTheDocument();
  });

  it('filters templates by category', () => {
    render(
      <TemplateGalleryModal
        isOpen={true}
        onClose={vi.fn()}
        onSelectTemplate={vi.fn()}
      />
    );

    // Click Akademik filter
    const academicBtn = screen.getByRole('button', { name: /Akademik/i });
    fireEvent.click(academicBtn);

    expect(screen.getByTestId('template-card-preset-academic-thesis')).toBeInTheDocument();
    expect(screen.queryByTestId('template-card-preset-novel-three-act')).not.toBeInTheDocument();
  });

  it('selects template and calls onSelectTemplate on submit', () => {
    const onSelectTemplate = vi.fn();
    const onClose = vi.fn();

    render(
      <TemplateGalleryModal
        isOpen={true}
        onClose={onClose}
        onSelectTemplate={onSelectTemplate}
      />
    );

    const startBtn = screen.getByTestId('start-template-button');
    fireEvent.click(startBtn);

    expect(onSelectTemplate).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    // Should receive selected template and cloned nodes array
    const [template, nodes] = onSelectTemplate.mock.calls[0];
    expect(template.id).toBe('preset-novel-three-act');
    expect(Array.isArray(nodes)).toBe(true);
    expect(nodes.length).toBeGreaterThan(0);
  });
});
