import React, { useState, useMemo } from 'react';
import {
  ProjectHealthAuditor,
  AuditSummary,
  AuditIssue,
  AuditInputDocument,
  AuditInputFeedback
} from '../../services/audit/projectHealthAuditor';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  ExternalLink,
  RefreshCw,
  FileText,
  Layers
} from 'lucide-react';

interface ProjectHealthDashboardProps {
  documents: AuditInputDocument[];
  feedbacks?: AuditInputFeedback[];
  onNavigateToDocument?: (documentId: string) => void;
  onClose?: () => void;
}

export const ProjectHealthDashboard: React.FC<ProjectHealthDashboardProps> = ({
  documents,
  feedbacks = [],
  onNavigateToDocument,
  onClose
}) => {
  const [resolvedIssueIds, setResolvedIssueIds] = useState<Set<string>>(new Set());
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [auditTimestamp, setAuditTimestamp] = useState<number>(Date.now());

  // Run audit
  const summary: AuditSummary = useMemo(() => {
    return ProjectHealthAuditor.audit(documents, feedbacks);
  }, [documents, feedbacks, auditTimestamp]);

  const toggleResolveIssue = (issueId: string) => {
    setResolvedIssueIds((prev) => {
      const next = new Set(prev);
      if (next.has(issueId)) {
        next.delete(issueId);
      } else {
        next.add(issueId);
      }
      return next;
    });
  };

  const filteredIssues = useMemo(() => {
    return summary.issues.filter((issue) => {
      if (filterSeverity === 'all') return true;
      return issue.severity === filterSeverity;
    });
  }, [summary.issues, filterSeverity]);

  const resolvedCount = resolvedIssueIds.size;
  const activeIssuesCount = Math.max(0, summary.totalIssues - resolvedCount);

  // Dynamic adjusted score based on user resolving issues in checklist
  const adjustedScore = useMemo(() => {
    if (summary.totalIssues === 0) return 100;
    const resolvedRatio = resolvedCount / summary.totalIssues;
    const gained = (100 - summary.score) * resolvedRatio;
    return Math.min(100, Math.round(summary.score + gained));
  }, [summary.score, summary.totalIssues, resolvedCount]);

  const adjustedGrade = ProjectHealthAuditor.calculateGrade(adjustedScore);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500 bg-green-500/10 border-green-500/30';
    if (score >= 75) return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
    return 'text-red-500 bg-red-500/10 border-red-500/30';
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100 p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 mb-4">
        <div className="flex items-center gap-2.5">
          <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h2 className="text-base font-semibold tracking-wide">Proje Sağlık Karnesi ve Denetim HUD</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setAuditTimestamp(Date.now());
              setResolvedIssueIds(new Set());
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
            <span>Yeniden Tara</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-2.5 py-1 text-xs rounded hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500"
            >
              Kapat
            </button>
          )}
        </div>
      </div>

      {/* Top Health Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        {/* Readiness Score Card */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${getScoreColor(adjustedScore)}`}>
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold opacity-80">Hazır Olma Skoru</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold">{adjustedScore}</span>
              <span className="text-xs font-mono opacity-70">/ 100</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-lg">
            {adjustedGrade}
          </div>
        </div>

        {/* Total Documents & Words */}
        <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/80">
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Toplam İçerik</p>
          <div className="flex items-center gap-2 mt-2">
            <FileText className="w-4 h-4 text-amber-500" />
            <span className="text-lg font-bold">{summary.wordCountTotal.toLocaleString()}</span>
            <span className="text-xs text-stone-400">kelime</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">{summary.documentCount} doküman / sahne</p>
        </div>

        {/* Active Issues Count */}
        <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/80">
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Tespit Edilen Eksikler</p>
          <div className="flex items-center gap-2 mt-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-lg font-bold">{activeIssuesCount}</span>
            <span className="text-xs text-stone-400">aktif madde</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {summary.criticalCount} kritik • {summary.warningCount} uyarı
          </p>
        </div>

        {/* Resolved Checklist Items */}
        <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/80">
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Gözden Geçirilen</p>
          <div className="flex items-center gap-2 mt-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-lg font-bold">{resolvedCount}</span>
            <span className="text-xs text-stone-400">/ {summary.totalIssues}</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Checklist ilerlemesi</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 pb-2 border-b border-stone-200 dark:border-stone-800 mb-3">
        <button
          onClick={() => setFilterSeverity('all')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            filterSeverity === 'all'
              ? 'bg-amber-600 text-white'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
          }`}
        >
          Tümü ({summary.totalIssues})
        </button>
        <button
          onClick={() => setFilterSeverity('critical')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            filterSeverity === 'critical'
              ? 'bg-red-600 text-white'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
          }`}
        >
          Kritik ({summary.criticalCount})
        </button>
        <button
          onClick={() => setFilterSeverity('warning')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            filterSeverity === 'warning'
              ? 'bg-amber-600 text-white'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
          }`}
        >
          Uyarı ({summary.warningCount})
        </button>
        <button
          onClick={() => setFilterSeverity('info')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            filterSeverity === 'info'
              ? 'bg-blue-600 text-white'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
          }`}
        >
          Öneri & Bilgi ({summary.infoCount})
        </button>
      </div>

      {/* Issues Checklist List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filteredIssues.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-stone-400 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-500 mb-2 opacity-80" />
            <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
              Harika! Bu kategoride hiçbir sorun bulunamadı.
            </p>
            <p className="text-xs text-stone-500 mt-1">Projeniz yayın ve teslimat standartlarına tam uyumlu.</p>
          </div>
        ) : (
          filteredIssues.map((issue) => {
            const isResolved = resolvedIssueIds.has(issue.id);

            return (
              <div
                key={issue.id}
                className={`p-3 rounded-lg border transition-all flex items-start justify-between gap-3 ${
                  isResolved
                    ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800/40 opacity-75'
                    : 'bg-white dark:bg-stone-800/90 border-stone-200 dark:border-stone-700 shadow-sm'
                }`}
              >
                {/* Checkbox and info */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isResolved}
                    onChange={() => toggleResolveIssue(issue.id)}
                    className="mt-1 w-4 h-4 text-green-600 rounded border-stone-300 dark:border-stone-600 focus:ring-green-500 cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold ${
                          isResolved
                            ? 'line-through text-stone-500 dark:text-stone-400'
                            : 'text-stone-900 dark:text-stone-100'
                        }`}
                      >
                        {issue.title}
                      </span>
                      {issue.severity === 'critical' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                          Kritik
                        </span>
                      )}
                      {issue.severity === 'warning' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          Uyarı
                        </span>
                      )}
                      {issue.severity === 'info' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          Bilgi
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5 leading-relaxed">
                      {issue.description}
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400/90 mt-1">
                      💡 <span className="font-medium">Tavsiye:</span> {issue.recommendation}
                    </p>
                  </div>
                </div>

                {/* Document Navigation Button */}
                {issue.documentId && onNavigateToDocument && (
                  <button
                    onClick={() => onNavigateToDocument(issue.documentId!)}
                    className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 text-xs rounded border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
                    title="İlgili sahneye git"
                  >
                    <span>Sahneye Git</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
