import React, { useState } from 'react';
import { InlineComment } from '../../types/comments';
import { commentStore } from '../../services/comments/commentStore';

interface CommentThreadProps {
  comment: InlineComment;
  currentUser?: string;
  onSelect?: () => void;
}

export const CommentThread: React.FC<CommentThreadProps> = ({
  comment,
  currentUser = 'Editör',
  onSelect
}) => {
  const [replyInput, setReplyInput] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const handleAddReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim()) return;

    commentStore.addReply(comment.id, currentUser, replyInput.trim());
    setReplyInput('');
    setIsReplying(false);
  };

  const handleToggleResolve = () => {
    if (comment.status === 'open') {
      commentStore.resolveComment(comment.id);
    } else {
      commentStore.reopenComment(comment.id);
    }
  };

  const handleDelete = () => {
    commentStore.deleteComment(comment.id);
  };

  const isResolved = comment.status === 'resolved';

  return (
    <div
      onClick={onSelect}
      className={`comment-thread p-3.5 rounded-lg border transition-all text-xs flex flex-col gap-2.5 ${
        isResolved
          ? 'bg-slate-900/40 border-slate-800 opacity-75'
          : 'bg-slate-900 border-slate-700 shadow-md hover:border-slate-600'
      }`}
    >
      {/* Üst Bilgi: Yazar ve Durum */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-medium text-slate-200">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>{comment.author}</span>
          <span className="text-[10px] text-slate-500 font-normal">
            {new Date(comment.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleToggleResolve}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
              isResolved
                ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                : 'bg-emerald-950 text-emerald-400 border-emerald-800 hover:bg-emerald-900'
            }`}
          >
            {isResolved ? 'Yeniden Aç' : '✓ Çöz'}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="text-slate-500 hover:text-rose-400 p-0.5"
            title="Yorumu Sil"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Alıntılanan Metin */}
      {comment.selectedText && (
        <div className="border-l-2 border-amber-500 pl-2 text-[11px] text-amber-200/90 italic line-clamp-2 bg-amber-950/20 py-0.5 rounded-r">
          "{comment.selectedText}"
        </div>
      )}

      {/* Ana Yorum Metni */}
      <p className="text-slate-100 text-xs leading-relaxed font-sans select-text">
        {comment.content}
      </p>

      {/* Yanıtlar (Thread) */}
      {comment.replies.length > 0 && (
        <div className="flex flex-col gap-1.5 pl-3 border-l border-slate-800 mt-1">
          {comment.replies.map((rep) => (
            <div key={rep.id} className="bg-slate-950/60 p-2 rounded border border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                <span className="font-semibold text-slate-300">{rep.author}</span>
                <span>{new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-slate-200 select-text">{rep.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Yanıt Ekleme */}
      {!isResolved && (
        <div className="pt-1">
          {isReplying ? (
            <form onSubmit={handleAddReply} className="flex flex-col gap-1.5">
              <textarea
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                placeholder="Yanıtınızı yazın..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsReplying(false)}
                  className="px-2 py-0.5 text-slate-400 hover:text-white text-[11px]"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[11px] font-medium"
                >
                  Yanıtla
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsReplying(true)}
              className="text-cyan-400 hover:text-cyan-300 text-[11px] font-medium"
            >
              ↩ Yanıt Ekle
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentThread;
