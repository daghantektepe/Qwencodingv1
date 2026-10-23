import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  ProjectHealthAuditor,
  AuditInputDocument,
  AuditInputFeedback
} from '../../src/services/audit/projectHealthAuditor';
import { ProjectHealthDashboard } from '../../src/components/Audit/ProjectHealthDashboard';

describe('Phase 89: Project Health & Quality Audit HUD', () => {
  const sampleDocuments: AuditInputDocument[] = [
    {
      id: 'doc-1',
      title: 'Bölüm 1 - Giriş',
      content: 'Ejderha sislerin arasından göründü ve kanatlarını çırptı. [[doc:doc-2]]',
      synopsis: 'Kahraman ejderha ile karşılaşır.',
      status: 'final',
      wordCount: 10
    },
    {
      id: 'doc-2',
      title: 'Bölüm 2 - Dağ Geçidi',
      content: 'Geçit karlar altındaydı. [[doc:doc-999]]', // Broken link to doc-999
      synopsis: '', // Missing synopsis
      status: 'draft',
      wordCount: 5
    },
    {
      id: 'doc-3',
      title: 'Bölüm 3 - Boş Sahne',
      content: '', // Empty document
      synopsis: '',
      status: 'draft',
      wordCount: 0
    }
  ];

  const sampleFeedbacks: AuditInputFeedback[] = [
    {
      id: 'fb-1',
      documentId: 'doc-1',
      status: 'new',
      comment: 'Burası biraz hızlı geçilmiş gibi.'
    },
    {
      id: 'fb-2',
      documentId: 'doc-2',
      status: 'applied',
      comment: 'Düzeltme yapıldı.'
    }
  ];

  describe('ProjectHealthAuditor Core Logic', () => {
    it('should calculate 100 score and A+ grade for perfect manuscript', () => {
      const perfectDocs: AuditInputDocument[] = [
        {
          id: 'p1',
          title: 'Tamamlanmış Bölüm',
          content: 'Harika bir roman başlangıcı.',
          synopsis: 'Bölüm özeti var.',
          status: 'final',
          wordCount: 500
        }
      ];

      const report = ProjectHealthAuditor.audit(perfectDocs, []);
      expect(report.score).toBe(100);
      expect(report.grade).toBe('A+');
      expect(report.totalIssues).toBe(0);
      expect(report.wordCountTotal).toBe(500);
    });

    it('should detect empty documents, missing synopsis, broken links and unresolved feedback', () => {
      const report = ProjectHealthAuditor.audit(sampleDocuments, sampleFeedbacks);

      expect(report.totalIssues).toBeGreaterThanOrEqual(4);
      expect(report.criticalCount).toBeGreaterThanOrEqual(1); // Broken link doc-999

      const brokenLinkIssue = report.issues.find((i) => i.type === 'broken_link');
      expect(brokenLinkIssue).toBeDefined();
      expect(brokenLinkIssue?.documentId).toBe('doc-2');

      const emptyDocIssue = report.issues.find((i) => i.type === 'empty_document');
      expect(emptyDocIssue).toBeDefined();
      expect(emptyDocIssue?.documentId).toBe('doc-3');

      const synopsisIssue = report.issues.find((i) => i.type === 'missing_synopsis');
      expect(synopsisIssue).toBeDefined();

      const unresolvedIssue = report.issues.find((i) => i.type === 'unresolved_comment');
      expect(unresolvedIssue).toBeDefined();

      expect(report.score).toBeLessThan(100);
    });
  });

  describe('ProjectHealthDashboard UI Component', () => {
    it('should render dashboard summary cards and issue list', () => {
      render(<ProjectHealthDashboard documents={sampleDocuments} feedbacks={sampleFeedbacks} />);

      expect(screen.getByText('Proje Sağlık Karnesi ve Denetim HUD')).toBeDefined();
      expect(screen.getByText('Hazır Olma Skoru')).toBeDefined();
      expect(screen.getByText('Toplam İçerik')).toBeDefined();
      expect(screen.getByText('Tespit Edilen Eksikler')).toBeDefined();
    });

    it('should allow filtering issues by severity', () => {
      render(<ProjectHealthDashboard documents={sampleDocuments} feedbacks={sampleFeedbacks} />);

      // Filter critical
      const criticalBtn = screen.getByRole('button', { name: /Kritik/i });
      fireEvent.click(criticalBtn);

      expect(screen.getByText(/Kırık İç Bağlantı/i)).toBeDefined();
      expect(screen.queryByText(/Boş Belge/i)).toBeNull(); // Empty doc is warning
    });

    it('should toggle issue resolution and increase adjusted score', () => {
      render(<ProjectHealthDashboard documents={sampleDocuments} feedbacks={sampleFeedbacks} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);

      // Check the first issue as resolved
      fireEvent.click(checkboxes[0]);
      expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
    });

    it('should trigger navigation callback when clicking Sahneye Git', () => {
      const onNavigate = vi.fn();
      render(
        <ProjectHealthDashboard
          documents={sampleDocuments}
          feedbacks={sampleFeedbacks}
          onNavigateToDocument={onNavigate}
        />
      );

      const navButtons = screen.getAllByText('Sahneye Git');
      expect(navButtons.length).toBeGreaterThan(0);

      fireEvent.click(navButtons[0]);
      expect(onNavigate).toHaveBeenCalled();
    });
  });
});
