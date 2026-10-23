export type AuditSeverity = 'critical' | 'warning' | 'info';

export interface AuditIssue {
  id: string;
  type: 'empty_document' | 'missing_synopsis' | 'unresolved_comment' | 'broken_link' | 'draft_status';
  severity: AuditSeverity;
  documentId?: string;
  documentTitle?: string;
  title: string;
  description: string;
  recommendation: string;
  fixed: boolean;
}

export interface AuditSummary {
  score: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  fixedCount: number;
  wordCountTotal: number;
  documentCount: number;
  issues: AuditIssue[];
}

export interface AuditInputDocument {
  id: string;
  title: string;
  content?: string;
  synopsis?: string;
  status?: string; // 'draft' | 'in_progress' | 'revised' | 'final'
  wordCount?: number;
}

export interface AuditInputFeedback {
  id: string;
  documentId?: string;
  status: 'new' | 'reviewed' | 'applied' | 'rejected';
  comment: string;
}

export class ProjectHealthAuditor {
  public static calculateGrade(score: number): 'A+' | 'A' | 'B' | 'C' | 'D' {
    if (score >= 95) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 50) return 'C';
    return 'D';
  }

  public static audit(
    documents: AuditInputDocument[],
    feedbacks: AuditInputFeedback[] = []
  ): AuditSummary {
    const issues: AuditIssue[] = [];
    let wordCountTotal = 0;

    const docIdSet = new Set(documents.map((d) => d.id));

    documents.forEach((doc) => {
      const rawText = (doc.content || '').trim();
      const words = doc.wordCount ?? (rawText ? rawText.split(/\s+/).filter(Boolean).length : 0);
      wordCountTotal += words;

      // 1. Empty Document Check
      if (words === 0) {
        issues.push({
          id: `issue_empty_${doc.id}`,
          type: 'empty_document',
          severity: 'warning',
          documentId: doc.id,
          documentTitle: doc.title,
          title: `Boş Belge: "${doc.title}"`,
          description: `Bu belgede henüz hiç metin bulunmuyor (0 kelime).`,
          recommendation: `Bölümün taslağını yazın veya gereksizse çöp kutusuna taşıyın.`,
          fixed: false
        });
      }

      // 2. Missing Synopsis Check
      if (!doc.synopsis || doc.synopsis.trim().length === 0) {
        issues.push({
          id: `issue_synopsis_${doc.id}`,
          type: 'missing_synopsis',
          severity: 'info',
          documentId: doc.id,
          documentTitle: doc.title,
          title: `Eksik Özet: "${doc.title}"`,
          description: `Bu sahnenin mantar panosunda veya haritada görünecek bir özeti bulunmuyor.`,
          recommendation: `Mantar panosunda takip kolaylığı için 1-2 cümlelik sahne özeti ekleyin.`,
          fixed: false
        });
      }

      // 3. Draft Status Check (If manuscript nearing completion)
      if (doc.status === 'draft' || doc.status === 'todo') {
        issues.push({
          id: `issue_draft_${doc.id}`,
          type: 'draft_status',
          severity: 'info',
          documentId: doc.id,
          documentTitle: doc.title,
          title: `Taslak Aşamasında: "${doc.title}"`,
          description: `Bu belgenin durumu henüz 'Taslak' olarak işaretlenmiş.`,
          recommendation: `Bölümü gözden geçirdikten sonra durumunu 'Revize Edildi' veya 'Tamamlandı' yapın.`,
          fixed: false
        });
      }

      // 4. Broken internal doc links check (e.g. [[doc:xyz]] or @doc(xyz))
      const linkMatches = rawText.matchAll(/(?:\[\[doc:([a-zA-Z0-9_-]+)\]\]|data-doc-id="([a-zA-Z0-9_-]+)")/g);
      for (const match of linkMatches) {
        const targetId = match[1] || match[2];
        if (targetId && !docIdSet.has(targetId)) {
          issues.push({
            id: `issue_broken_link_${doc.id}_${targetId}`,
            type: 'broken_link',
            severity: 'critical',
            documentId: doc.id,
            documentTitle: doc.title,
            title: `Kırık İç Bağlantı: "${doc.title}"`,
            description: `Belge içindeki bağlantı var olmayan bir sahneyi işaret ediyor (${targetId}).`,
            recommendation: `Bağlantıyı güncelleyin veya kaldırın.`,
            fixed: false
          });
        }
      }
    });

    // 5. Unresolved comments and feedback check
    feedbacks.forEach((fb) => {
      if (fb.status === 'new') {
        const relatedDoc = documents.find((d) => d.id === fb.documentId);
        issues.push({
          id: `issue_feedback_${fb.id}`,
          type: 'unresolved_comment',
          severity: 'warning',
          documentId: fb.documentId,
          documentTitle: relatedDoc?.title || 'Genel Proje Notu',
          title: `Çözülmemiş Geri Bildirim`,
          description: `İncelenmeyi bekleyen okur notu: "${fb.comment.slice(0, 50)}..."`,
          recommendation: `Yorumu inceleyip uygulayın veya kapatın.`,
          fixed: false
        });
      }
    });

    // Score deduction
    let penalty = 0;
    let criticalCount = 0;
    let warningCount = 0;
    let infoCount = 0;

    issues.forEach((iss) => {
      if (iss.severity === 'critical') {
        penalty += 12;
        criticalCount++;
      } else if (iss.severity === 'warning') {
        penalty += 5;
        warningCount++;
      } else {
        penalty += 2;
        infoCount++;
      }
    });

    // Base score calculation
    let rawScore = 100 - penalty;
    if (documents.length === 0) rawScore = 0;
    const score = Math.max(0, Math.min(100, Math.round(rawScore)));
    const grade = this.calculateGrade(score);

    return {
      score,
      grade,
      totalIssues: issues.length,
      criticalCount,
      warningCount,
      infoCount,
      fixedCount: 0,
      wordCountTotal,
      documentCount: documents.length,
      issues
    };
  }
}
