import React, { useState, useEffect } from 'react';
import {
  localGitClient,
  GitBranch,
  GitDocumentSnapshot,
} from '../../services/git/localGitClient';

interface BranchManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBranchSwitched?: (branch: GitBranch, snapshot: Record<string, GitDocumentSnapshot> | null) => void;
  onBranchMerged?: (mergedSnapshot: Record<string, GitDocumentSnapshot>) => void;
}

export const BranchManagerDialog: React.FC<BranchManagerDialogProps> = ({
  isOpen,
  onClose,
  onBranchSwitched,
  onBranchMerged,
}) => {
  const [branches, setBranches] = useState<GitBranch[]>(localGitClient.getBranches());
  const [currentBranch, setCurrentBranch] = useState(localGitClient.getCurrentBranch());
  const [newBranchName, setNewBranchName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const refresh = () => {
    setBranches(localGitClient.getBranches());
    setCurrentBranch(localGitClient.getCurrentBranch());
  };

  useEffect(() => {
    refresh();
    const unsub = localGitClient.subscribe(() => refresh());
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      localGitClient.createBranch(newBranchName);
      setNewBranchName('');
      setSuccessMsg(`'${newBranchName}' dalı başarıyla oluşturuldu.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Dal oluşturulamadı.');
    }
  };

  const handleSwitchBranch = (branchName: string) => {
    setErrorMsg('');
    try {
      const res = localGitClient.switchBranch(branchName);
      onBranchSwitched?.(res.branch, res.snapshot);
      setSuccessMsg(`'${branchName}' dalına geçildi.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleMergeBranch = (sourceBranch: string) => {
    setErrorMsg('');
    try {
      const res = localGitClient.mergeBranch(sourceBranch);
      onBranchMerged?.(res.mergedSnapshot);
      setSuccessMsg(`'${sourceBranch}' dalı başarıyla '${currentBranch}' içine birleştirildi.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteBranch = (branchName: string) => {
    setErrorMsg('');
    try {
      localGitClient.deleteBranch(branchName);
      setSuccessMsg(`'${branchName}' dalı silindi.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-label="Yerel Git Dal Yönetimi"
      data-testid="branch-manager-dialog"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl text-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🌿</span>
            <div>
              <h2 className="text-base font-semibold text-white">
                Yerel Dal Yönetimi (Branch Studio)
              </h2>
              <p className="text-xs text-slate-400">
                Alternatif olay örgüleri ve sürümler arasında güvenli geçiş
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Create Branch Form */}
        <form
          onSubmit={handleCreateBranch}
          className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            required
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            placeholder="Yeni dal adı (örn: alternatif-son, revizyon-v2)..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium shrink-0"
          >
            + Dal Aç
          </button>
        </form>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="px-6 py-2 bg-rose-950/60 border-b border-rose-800 text-rose-300 text-xs">
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="px-6 py-2 bg-emerald-950/60 border-b border-emerald-800 text-emerald-300 text-xs">
            ✓ {successMsg}
          </div>
        )}

        {/* Branches List */}
        <div className="p-4 overflow-y-auto max-h-72 space-y-2">
          {branches.map((b) => (
            <div
              key={b.name}
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                b.isCurrent
                  ? 'bg-cyan-950/40 border-cyan-700/80 text-white'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">{b.isCurrent ? '📍' : '🌱'}</span>
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs font-mono">{b.name}</span>
                    {b.isCurrent && (
                      <span className="px-2 py-0.5 bg-cyan-700 text-white rounded-full text-[10px] font-bold">
                        Aktif
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Kaynak: {b.createdFrom} {b.headCommitId && `• Head: ${b.headCommitId.slice(0, 8)}`}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {!b.isCurrent && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSwitchBranch(b.name)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white rounded text-xs transition-colors"
                      title="Bu dala geçiş yap"
                    >
                      Geçiş Yap
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMergeBranch(b.name)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white rounded text-xs transition-colors"
                      title={`Bu dalı '${currentBranch}' dalına birleştir`}
                    >
                      Birleştir
                    </button>
                    {b.name !== 'main' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteBranch(b.name)}
                        className="p-1 hover:bg-rose-950 text-rose-400 rounded text-xs"
                        title="Dalı sil"
                      >
                        🗑️
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Toplam {branches.length} dal mevcut</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default BranchManagerDialog;
