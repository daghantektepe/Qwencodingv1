import React, { useState, useEffect, useMemo } from 'react';
import { annotationStore } from '../../services/annotationStore';
import { CommentItem, FootnoteItem } from '../../types/annotations';
import CommentCard from './CommentCard';
import FootnoteDialog from './FootnoteDialog';

export interface CommentSidebarProps {
  docId: string;
  selectedText?: string;
  currentUser?: string;
  onClose?: () => void;
}

export const CommentSidebar: React.FC<CommentSidebarProps> = ({
  docId,
  selectedText,
  currentUser = 'Yazar',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'comments' | 'footnotes'>('comments');
  const [showResolved, setShowResolved] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [isFootnoteDialogOpen, setIsFootnoteDialogOpen] = useState(false);
  const [editingFootnote, setEditingFootnote] = useState<FootnoteItem | null>(null);
  const [tick, setTick] = useState(0);

  // Subscribe to annotation store changes
  useEffect(() => {
    const unsubscribe = annotationStore.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  const comments = useMemo(() => {
    let list = annotationStore.getComments(docId, { showResolved });
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.content.toLowerCase().includes(q) ||
          c.author.toLowerCase().includes(q) ||
          (c.selectedText && c.selectedText.toLowerCase().includes(q))
      );
    }
    return list;
  }, [docId, showResolved, searchQuery, tick]);

  const footnotes = useMemo(() => {
    const fns = annotationStore.getFootnotes(docId, false);
    const ens = annotationStore.getFootnotes(docId, true);
    let all = [...fns, ...ens];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      all = all.filter((f) => f.content.toLowerCase().includes(q));
    }
    return all;
  }, [docId, searchQuery, tick]);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCommentText.trim()) {
      annotationStore.addComment({
        docId,
        author: currentUser,
        content: newCommentText.trim(),
        selectedText: selectedText || undefined,
      });
      setNewCommentText('');
    }
  };

  const handleSaveFootnote = (data: {
    content: string;
    format: 'numeric' | 'roman' | 'asterisk';
    isEndnote: boolean;
  }) => {
    if (editingFootnote) {
      annotationStore.updateFootnote(editingFootnote.id, data.content);
      setEditingFootnote(null);
    } else {
      annotationStore.addFootnote({
        docId,
        content: data.content,
        format: data.format,
        isEndnote: data.isEndnote,
      });
    }
  };

  return (
    <aside
      className="comment-sidebar flex flex-col h-full w-80 bg-neutral-50 dark:bg-neutral-850 border-l border-neutral-200 dark:border-neutral-750 text-neutral-900 dark:text-neutral-100 font-sans select-none"
      data-testid="comment-sidebar"
      aria-label="Yorumlar ve Dipnotlar Paneli"
    >
      {/* Üst Başlık & Sekmeler */}
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-750 bg-white dark:bg-neutral-800">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-semibold flex items-center gap-1.5">
            <span>💬</span>
            <span>Kenar Notları</span>
          </h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-xs p-1"
              title="Paneli Kapat"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sekme Butonları */}
        <div className="grid grid-cols-2 gap-1 bg-neutral-100 dark:bg-neutral-700 p-0.5 rounded-md text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('comments')}
            className={`py-1 rounded text-center transition-all ${
              activeTab === 'comments'
                ? 'bg-white dark:bg-neutral-800 text-amber-600 dark:text-amber-400 shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900'
            }`}
            aria-selected={activeTab === 'comments'}
          >
            Yorumlar ({comments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('footnotes')}
            className={`py-1 rounded text-center transition-all ${
              activeTab === 'footnotes'
                ? 'bg-white dark:bg-neutral-800 text-amber-600 dark:text-amber-400 shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900'
            }`}
            aria-selected={activeTab === 'footnotes'}
          >
            Dipnotlar ({footnotes.length})
          </button>
        </div>

        {/* Arama ve Filtreleme */}
        <div className="mt-2.5 flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Notlarda ara..."
            className="flex-1 text-xs px-2 py-1 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
            aria-label="Notlarda ara"
          />
          {activeTab === 'comments' && (
            <label className="flex items-center gap-1 text-[11px] text-neutral-500 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
                className="rounded text-amber-600 focus:ring-0"
              />
              <span>Çözülenler</span>
            </label>
          )}
        </div>
      </div>

      {/* Ana Liste İçeriği */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === 'comments' ? (
          <>
            {/* Yeni Yorum Ekleme Formu */}
            <form
              onSubmit={handleAddComment}
              className="p-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-xs space-y-2"
            >
              {selectedText && (
                <div className="text-[11px] text-neutral-500 italic pl-2 border-l-2 border-amber-500 line-clamp-2">
                  "{selectedText}"
                </div>
              )}
              <textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Yorum ekleyin..."
                rows={2}
                className="w-full text-xs p-1.5 rounded border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                aria-label="Yeni yorum metni"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  onClick={handleAddComment}
                  disabled={!newCommentText.trim()}
                  className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-40"
                >
                  Yorum Yap
                </button>
              </div>
            </form>

            {/* Yorumlar Listesi */}
            {comments.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-xs">
                <span>💬</span>
                <p className="mt-1">Henüz yorum yok.</p>
              </div>
            ) : (
              comments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  currentUser={currentUser}
                  onResolve={(id) => annotationStore.toggleResolveComment(id)}
                  onDelete={(id) => annotationStore.deleteComment(id)}
                  onUpdate={(id, text) => annotationStore.updateComment(id, text)}
                  onAddReply={(cId, auth, text) => annotationStore.addReply(cId, auth, text)}
                  onDeleteReply={(cId, rId) => annotationStore.deleteReply(cId, rId)}
                />
              ))
            )}
          </>
        ) : (
          /* =========================================================================
             DİPNOTLAR (FOOTNOTES) LİSTESİ
             ========================================================================= */
          <>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-neutral-500">Sayfa / Bölüm Notları</span>
              <button
                type="button"
                onClick={() => {
                  setEditingFootnote(null);
                  setIsFootnoteDialogOpen(true);
                }}
                className="px-2 py-1 text-xs font-medium rounded bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
              >
                + Dipnot Ekle
              </button>
            </div>

            {footnotes.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-xs">
                <span>🔖</span>
                <p className="mt-1">Henüz dipnot veya son not eklenmedi.</p>
              </div>
            ) : (
              footnotes.map((fn) => (
                <div
                  key={fn.id}
                  className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-xs text-xs space-y-1.5"
                  data-testid={`footnote-card-${fn.id}`}
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500">
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 font-mono">
                        [{fn.marker}]
                      </span>
                      <span>{fn.isEndnote ? 'Son Not' : 'Dipnot'}</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFootnote(fn);
                          setIsFootnoteDialogOpen(true);
                        }}
                        className="text-neutral-400 hover:text-amber-600 p-0.5"
                        title="Düzenle"
                      >
                        ✏
                      </button>
                      <button
                        type="button"
                        onClick={() => annotationStore.deleteFootnote(fn.id)}
                        className="text-neutral-400 hover:text-rose-600 p-0.5"
                        title="Sil"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                  <p className="text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
                    {fn.content}
                  </p>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Dipnot Ekleme / Düzenleme Dialogu */}
      <FootnoteDialog
        isOpen={isFootnoteDialogOpen}
        onClose={() => {
          setIsFootnoteDialogOpen(false);
          setEditingFootnote(null);
        }}
        onSave={handleSaveFootnote}
        initialData={editingFootnote}
      />
    </aside>
  );
};

export default CommentSidebar;
