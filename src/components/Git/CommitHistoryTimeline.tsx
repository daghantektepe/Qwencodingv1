import React, { useState, useEffect } from 'react';
import {
  localGitClient,
  GitCommit,
  GitDocumentSnapshot,
} from '../../services/git/localGitClient';

interface CommitHistoryTimelineProps {
  currentSnapshot?: Record<string, GitDocumentSnapshot>;
  onCheckoutCommit?: (commit: GitCommit, snapshot: Record<string, GitDocumentSnapshot>) => void;
  onCommitCreated?: (commit: GitCommit) => void;
}

export const CommitHistoryTimeline: React.FC<CommitHistoryTimelineProps> = ({
  currentSnapshot = {},
  onCheckoutCommit,
  onCommitCreated,
}) => {
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [currentBranch, setCurrentBranch] = useState(localGitClient.getCurrentBranch());
  const [commitMsg, setCommitMsg] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const refresh = () => {
    setCurrentBranch(localGitClient.getCurrentBranch());
    setCommits(localGitClient.getLog());
  };

  useEffect(() => {
    refresh();
    const unsub = localGitClient.subscribe(() => refresh());
    return unsub;
  }, []);

  const handleCreateCommit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMsg.trim()) return;

    const newCommit = localGitClient.commit(commitMsg.trim(), currentSnapshot);
    setCommitMsg('');
    onCommitCreated?.(newCommit);
    setFeedbackMsg('Yeni sürüm başarıyla mühürlendi!');
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const handleCheckout = (commitId: string) => {
    try {
      const res = localGitClient.checkoutCommit(commitId);
      onCheckoutCommit?.(res.commit, res.snapshot);
      setFeedbackMsg(`'${res.commit.id.slice(0, 7)}' durumuna geri dönüldü.`);
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (err: any) {
      setFeedbackMsg(`Hata: ${err.message}`);
    }
  };

  return (
    <div
      className="commit-history-timeline bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-xl text-slate-200 flex flex-col gap-4 text-xs"
      data-testid="commit-history-timeline"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">⏳</span>
          <h3 className="font-semibold text-white">Sürüm Geçmişi & Zaman Çizelgesi</h3>
        </div>
        <span className="px-2 py-0.5 bg-cyan-950/80 border border-cyan-800 rounded-full font-mono text-[11px] text-cyan-300">
          Dal: {currentBranch}
        </span>
      </div>

      {/* Quick Commit Form */}
      <form onSubmit={handleCreateCommit} className="flex gap-2">
        <input
          type="text"
          value={commitMsg}
          onChange={(e) => setCommitMsg(e.target.value)}
          placeholder="Bu anın sürüm notunu yazın (örn: Final sahnesi tamamlandı)..."
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
        />
        <button
          type="submit"
          className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-xl shrink-0 transition-colors shadow"
        >
          💾 Kaydet
        </button>
      </form>

      {feedbackMsg && (
        <div className="text-[11px] text-emerald-400 font-medium px-2 animate-pulse">
          ✓ {feedbackMsg}
        </div>
      )}

      {/* Timeline List */}
      <div className="space-y-3 overflow-y-auto max-h-80 pr-1">
        {commits.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            Bu dalda henüz kaydedilmiş commit bulunmuyor.
            <br />
            Yukarıdaki kutucuktan ilk sürümünüzü oluşturabilirsiniz.
          </div>
        ) : (
          commits.map((c, i) => {
            const dateStr = new Date(c.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div key={c.id} className="relative flex items-start gap-3 pl-2 group">
                {/* Timeline connector dot */}
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-cyan-500 border-2 border-slate-900 z-10" />
                  {i < commits.length - 1 && (
                    <div className="w-0.5 h-full bg-slate-800 absolute top-3 left-[13px] -bottom-3" />
                  )}
                </div>

                {/* Commit Content */}
                <div className="flex-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white text-xs">{c.message}</span>
                    <span className="font-mono text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
                      {c.id.slice(0, 8)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span>{c.author}</span>
                      <span>•</span>
                      <span>{dateStr}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCheckout(c.id)}
                      className="text-cyan-400 hover:text-cyan-300 font-medium text-[11px] hover:underline"
                    >
                      Bu Duruma Dön
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CommitHistoryTimeline;
