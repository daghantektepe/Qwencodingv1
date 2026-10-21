import React, { useState } from 'react';
import { CommentItem } from '../../types/annotations';

export interface CommentCardProps {
  comment: CommentItem;
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
  onAddReply: (commentId: string, author: string, content: string) => void;
  onDeleteReply: (commentId: string, replyId: string) => void;
  currentUser?: string;
}

export const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  onResolve,
  onDelete,
  onUpdate,
  onAddReply,
  onDeleteReply,
  currentUser = 'Yazar',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleSaveEdit = () => {
    if (editContent.trim()) {
      onUpdate(comment.id, editContent.trim());
      setIsEditing(false);
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyText.trim()) {
      onAddReply(comment.id, currentUser, replyText.trim());
      setReplyText('');
      setShowReplyInput(false);
    }
  };

  return (
    <div
      className={`comment-card p-3.5 rounded-lg border text-sm transition-all shadow-xs ${
        comment.resolved
          ? 'bg-neutral-100/70 dark:bg-neutral-850/50 border-neutral-200 dark:border-neutral-800 opacity-75'
          : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700'
      }`}
      data-testid={`comment-card-${comment.id}`}
    >
      {/* Kart Başlığı */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
            {comment.author.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-xs text-neutral-800 dark:text-neutral-100">
              {comment.author}
            </div>
            <div className="text-[10px] text-neutral-400">
              {new Date(comment.createdAt).toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>

        {/* Çözüldü ve Sil Butonları */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onResolve(comment.id)}
            className={`p-1 rounded text-xs transition-colors cursor-pointer ${
              comment.resolved
                ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                : 'text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
            }`}
            title={comment.resolved ? 'Yorumu yeniden aç' : 'Çözüldü olarak işaretle'}
            aria-label={comment.resolved ? 'Yorumu yeniden aç' : 'Çözüldü olarak işaretle'}
          >
            {comment.resolved ? '✓ Çözüldü' : '○ Çöz'}
          </button>
          <button
            type="button"
            onClick={() => onDelete(comment.id)}
            className="p-1 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-xs transition-colors cursor-pointer"
            title="Yorumu sil"
            aria-label="Yorumu sil"
          >
            🗑
          </button>
        </div>
      </div>

      {/* Alıntılanan Metin (Varsa) */}
      {comment.selectedText && (
        <div className="mb-2 pl-2.5 py-1 border-l-2 border-amber-400 dark:border-amber-500 bg-amber-50/60 dark:bg-amber-950/20 text-xs italic text-neutral-600 dark:text-neutral-300 rounded-r">
          "{comment.selectedText}"
        </div>
      )}

      {/* Yorum İçeriği veya Düzenleme Alanı */}
      {isEditing ? (
        <div className="space-y-2 mt-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full text-xs p-2 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            rows={3}
            aria-label="Yorum metnini düzenle"
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-2 py-1 text-xs rounded border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              className="px-2 py-1 text-xs rounded bg-amber-600 hover:bg-amber-700 text-white font-medium"
            >
              Kaydet
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className={`text-xs text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed cursor-text hover:bg-neutral-50/60 dark:hover:bg-neutral-750/40 p-1 rounded ${
            comment.resolved ? 'line-through text-neutral-400' : ''
          }`}
          title="Düzenlemek için tıkla"
        >
          {comment.content}
        </div>
      )}

      {/* Yanıtlar Listesi */}
      {comment.replies.length > 0 && (
        <div className="mt-3 pt-2 border-t border-neutral-200 dark:border-neutral-700/60 space-y-2">
          {comment.replies.map((reply) => (
            <div
              key={reply.id}
              className="pl-3 border-l border-neutral-300 dark:border-neutral-600 text-xs text-neutral-700 dark:text-neutral-300 flex items-start justify-between gap-1 group"
            >
              <div>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-[11px]">
                  {reply.author}:
                </span>{' '}
                <span>{reply.content}</span>
              </div>
              <button
                type="button"
                onClick={() => onDeleteReply(comment.id, reply.id)}
                className="opacity-0 group-hover:opacity-100 text-[10px] text-neutral-400 hover:text-rose-600 transition-opacity"
                title="Yanıtı sil"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Yanıt Ekle Formu */}
      <div className="mt-2.5 pt-1.5 flex items-center justify-between text-xs">
        {showReplyInput ? (
          <form onSubmit={handleSendReply} className="w-full flex gap-1.5 items-center">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Yanıt yazın..."
              className="flex-1 text-xs px-2 py-1 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              autoFocus
            />
            <button
              type="submit"
              onClick={handleSendReply}
              className="px-2 py-1 rounded bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 shrink-0"
            >
              Gönder
            </button>
            <button
              type="button"
              onClick={() => setShowReplyInput(false)}
              className="px-1.5 py-1 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              ✕
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowReplyInput(true)}
            className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
          >
            + Yanıtla
          </button>
        )}
      </div>
    </div>
  );
};

export default CommentCard;
