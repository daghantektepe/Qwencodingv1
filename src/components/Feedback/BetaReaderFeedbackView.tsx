import React, { useState, useMemo } from 'react';
import {
  useFeedbackStore,
  FeedbackComment,
  FeedbackFilterOptions
} from '../../services/feedback/feedbackImporter';
import {
  MessageSquare,
  CheckCircle,
  XCircle,
  RotateCcw,
  Trash2,
  Search,
  Upload,
  Download,
  Star
} from 'lucide-react';

interface BetaReaderFeedbackViewProps {
  onSelectDocument?: (documentId: string) => void;
  currentDocumentId?: string;
}

export const BetaReaderFeedbackView: React.FC<BetaReaderFeedbackViewProps> = ({
  onSelectDocument,
  currentDocumentId
}) => {
  const {
    comments,
    activeFilter,
    updateCommentStatus,
    deleteComment,
    importFromText,
    setFilter,
    exportToJson
  } = useFeedbackStore();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [readerNameInput, setReaderNameInput] = useState('');

  const filteredComments = useMemo(() => {
    return comments.filter((comment) => {
      // Filter status
      if (activeFilter.status && activeFilter.status !== 'all' && comment.status !== activeFilter.status) {
        return false;
      }
      // Filter reader
      if (activeFilter.readerName && activeFilter.readerName !== 'all' && comment.readerName !== activeFilter.readerName) {
        return false;
      }
      // Filter document
      if (activeFilter.documentId && activeFilter.documentId !== 'all') {
        if (comment.documentId !== activeFilter.documentId) return false;
      }
      // Filter search query
      if (activeFilter.searchQuery && activeFilter.searchQuery.trim() !== '') {
        const query = activeFilter.searchQuery.toLowerCase();
        const matchesComment = comment.comment.toLowerCase().includes(query);
        const matchesQuote = comment.quoteSnippet?.toLowerCase().includes(query);
        const matchesReader = comment.readerName.toLowerCase().includes(query);
        const matchesDoc = comment.documentTitle?.toLowerCase().includes(query);
        if (!matchesComment && !matchesQuote && !matchesReader && !matchesDoc) return false;
      }
      return true;
    });
  }, [comments, activeFilter]);

  const uniqueReaders = useMemo(() => {
    const set = new Set<string>();
    comments.forEach((c) => set.add(c.readerName));
    return Array.from(set);
  }, [comments]);

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) return;

    importFromText(
      importText,
      readerNameInput.trim() || 'Anonim Beta Okur',
      currentDocumentId
    );

    setImportText('');
    setReaderNameInput('');
    setIsImportModalOpen(false);
  };

  const getStatusBadge = (status: FeedbackComment['status']) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            Yeni
          </span>
        );
      case 'reviewed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            İncelendi
          </span>
        );
      case 'applied':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
            Uygulandı
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-400">
            Reddedildi
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100 border-l border-stone-200 dark:border-stone-800 select-none">
      {/* Top Header */}
      <div className="p-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-100/70 dark:bg-stone-800/50">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h2 className="text-sm font-semibold tracking-wide">Beta Okur Geri Bildirimleri</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700 font-mono">
            {filteredComments.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsImportModalOpen(true)}
            title="Metin veya E-posta İçe Aktar"
            className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
          >
            <Upload className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const data = exportToJson();
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `openscriv-beta-feedback-${Date.now()}.json`;
              a.click();
            }}
            title="JSON Olarak Dışa Aktar"
            className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-2.5 border-b border-stone-200 dark:border-stone-800 flex flex-col gap-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder="Yorumlarda, alıntılarda ara..."
            value={activeFilter.searchQuery || ''}
            onChange={(e) => setFilter({ searchQuery: e.target.value })}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter */}
          <select
            value={activeFilter.status || 'all'}
            onChange={(e) =>
              setFilter({ status: e.target.value as FeedbackFilterOptions['status'] })
            }
            className="text-xs px-2 py-1 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="new">Yeni</option>
            <option value="reviewed">İncelendi</option>
            <option value="applied">Uygulandı</option>
            <option value="rejected">Reddedildi</option>
          </select>

          {/* Reader filter */}
          <select
            value={activeFilter.readerName || 'all'}
            onChange={(e) => setFilter({ readerName: e.target.value })}
            className="text-xs px-2 py-1 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none truncate max-w-[130px]"
          >
            <option value="all">Tüm Okurlar</option>
            {uniqueReaders.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Feedback List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
        {filteredComments.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-stone-400">
            <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs">Henüz gösterilecek geri bildirim bulunmuyor.</p>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium hover:underline"
            >
              Yorum Yapıştır veya İçe Aktar
            </button>
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div
              key={comment.id}
              className="p-3 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700/80 shadow-sm flex flex-col gap-2 transition-shadow hover:shadow-md"
            >
              {/* Comment Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                    {comment.readerName}
                  </span>
                  {comment.documentTitle && (
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                      • {comment.documentTitle}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {comment.rating && (
                    <div className="flex items-center text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < comment.rating!
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-stone-300 dark:text-stone-600'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  {getStatusBadge(comment.status)}
                </div>
              </div>

              {/* Quote Snippet if any */}
              {comment.quoteSnippet && (
                <blockquote className="text-xs italic pl-2.5 border-l-2 border-amber-500 text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-900/60 py-1 rounded-r">
                  "{comment.quoteSnippet}"
                </blockquote>
              )}

              {/* Actual Feedback Comment */}
              <p className="text-xs leading-relaxed text-stone-800 dark:text-stone-200 select-text whitespace-pre-wrap">
                {comment.comment}
              </p>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-1 border-t border-stone-100 dark:border-stone-700/50 mt-1">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateCommentStatus(comment.id, 'applied')}
                    title="Uygulandı olarak işaretle"
                    className={`p-1 rounded text-xs flex items-center gap-1 ${
                      comment.status === 'applied'
                        ? 'text-green-600 font-bold'
                        : 'text-stone-500 hover:text-green-600'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Uygula</span>
                  </button>
                  <button
                    onClick={() => updateCommentStatus(comment.id, 'reviewed')}
                    title="İncelendi olarak işaretle"
                    className={`p-1 rounded text-xs flex items-center gap-1 ${
                      comment.status === 'reviewed'
                        ? 'text-amber-600 font-bold'
                        : 'text-stone-500 hover:text-amber-600'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>İncele</span>
                  </button>
                  <button
                    onClick={() => updateCommentStatus(comment.id, 'rejected')}
                    title="Reddedildi olarak işaretle"
                    className={`p-1 rounded text-xs flex items-center gap-1 ${
                      comment.status === 'rejected'
                        ? 'text-red-500 font-bold'
                        : 'text-stone-500 hover:text-red-500'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => deleteComment(comment.id)}
                  title="Yorumu sil"
                  className="p-1 text-stone-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-2xl max-w-lg w-full p-5 border border-stone-300 dark:border-stone-700 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b pb-3 border-stone-200 dark:border-stone-700">
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-600" />
                Beta Okur Yorumu İçe Aktar
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Beta Okur / Editör Adı:
                </label>
                <input
                  type="text"
                  placeholder="Örn: Ayşe Yılmaz veya Editör Mehmet"
                  value={readerNameInput}
                  onChange={(e) => setReaderNameInput(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Yorum Metni veya E-posta İçeriği:
                </label>
                <textarea
                  rows={6}
                  placeholder={`E-posta veya notları buraya yapıştırın. Örn:\n[Bölüm 1] Harika bir başlangıç olmuş.\n---\n"Kılıcını çekti" sahnesinde tempo biraz düşük kalmış (4/5).`}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full text-xs p-3 rounded bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-700">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3 py-1.5 text-xs rounded border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={!importText.trim()}
                  className="px-4 py-1.5 text-xs font-medium rounded bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 transition-colors"
                >
                  İçe Aktar ve Ayrıştır
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
