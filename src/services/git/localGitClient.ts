/**
 * localGitClient.ts — Faz 80: Yerel Git Sürüm Kontrolü ve Dal Yönetimi İstemcisi
 */

export interface GitDocumentSnapshot {
  title: string;
  content?: string;
  notes?: string;
}

export interface GitCommit {
  id: string;
  branch: string;
  message: string;
  author: string;
  timestamp: number;
  parentCommitId?: string;
  snapshot: Record<string, GitDocumentSnapshot>;
}

export interface GitBranch {
  name: string;
  createdFrom: string;
  headCommitId?: string;
  isCurrent: boolean;
}

export interface GitState {
  currentBranch: string;
  branches: GitBranch[];
  commits: GitCommit[];
}

const STORAGE_KEY = 'openscriv_local_git_repo';

export class LocalGitClient {
  private state: GitState;
  private listeners = new Set<(state: GitState) => void>();

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): GitState {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }

    return {
      currentBranch: 'main',
      branches: [
        {
          name: 'main',
          createdFrom: 'init',
          isCurrent: true,
        },
      ],
      commits: [],
    };
  }

  private saveState(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      }
    } catch {
      // Ignore
    }
    this.notify();
  }

  private notify(): void {
    const cloned = this.getState();
    this.listeners.forEach((l) => l(cloned));
  }

  public subscribe(listener: (state: GitState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getState(): GitState {
    return JSON.parse(JSON.stringify(this.state));
  }

  public getCurrentBranch(): string {
    return this.state.currentBranch;
  }

  public getBranches(): GitBranch[] {
    return [...this.state.branches];
  }

  /**
   * Yeni bir commit (sürüm kaydı) oluşturur
   */
  public commit(
    message: string,
    snapshot: Record<string, GitDocumentSnapshot>,
    author = 'Yazar'
  ): GitCommit {
    const currentBranchObj = this.state.branches.find(
      (b) => b.name === this.state.currentBranch
    );
    const parentCommitId = currentBranchObj?.headCommitId;

    const commitId = `c_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newCommit: GitCommit = {
      id: commitId,
      branch: this.state.currentBranch,
      message: message.trim() || 'İsimsiz Değişiklik',
      author,
      timestamp: Date.now(),
      parentCommitId,
      snapshot: JSON.parse(JSON.stringify(snapshot)),
    };

    this.state.commits.push(newCommit);

    if (currentBranchObj) {
      currentBranchObj.headCommitId = commitId;
    }

    this.saveState();
    return newCommit;
  }

  /**
   * Yeni bir dal (Branch) açar
   */
  public createBranch(branchName: string, fromBranch?: string): GitBranch {
    const name = branchName.trim().replace(/\s+/g, '-').toLowerCase();
    if (!name) throw new Error('Dal adı boş olamaz.');

    if (this.state.branches.some((b) => b.name === name)) {
      throw new Error(`'${name}' isimli bir dal zaten mevcut.`);
    }

    const sourceBranchName = fromBranch || this.state.currentBranch;
    const sourceBranch = this.state.branches.find((b) => b.name === sourceBranchName);

    const newBranch: GitBranch = {
      name,
      createdFrom: sourceBranchName,
      headCommitId: sourceBranch?.headCommitId,
      isCurrent: false,
    };

    this.state.branches.push(newBranch);
    this.saveState();
    return newBranch;
  }

  /**
   * Dallar arasında geçiş yapar (Checkout)
   */
  public switchBranch(branchName: string): {
    branch: GitBranch;
    snapshot: Record<string, GitDocumentSnapshot> | null;
  } {
    const target = this.state.branches.find((b) => b.name === branchName);
    if (!target) {
      throw new Error(`'${branchName}' isimli dal bulunamadı.`);
    }

    this.state.branches.forEach((b) => {
      b.isCurrent = b.name === branchName;
    });
    this.state.currentBranch = branchName;

    let snapshot: Record<string, GitDocumentSnapshot> | null = null;
    if (target.headCommitId) {
      const headCommit = this.state.commits.find((c) => c.id === target.headCommitId);
      if (headCommit) {
        snapshot = headCommit.snapshot;
      }
    }

    this.saveState();
    return { branch: target, snapshot };
  }

  /**
   * Belirli bir commit'teki doküman durumunu döner
   */
  public checkoutCommit(commitId: string): {
    commit: GitCommit;
    snapshot: Record<string, GitDocumentSnapshot>;
  } {
    const commit = this.state.commits.find((c) => c.id === commitId);
    if (!commit) {
      throw new Error(`'${commitId}' numaralı commit bulunamadı.`);
    }
    return { commit, snapshot: commit.snapshot };
  }

  /**
   * İki dalı birleştirir (Merge)
   */
  public mergeBranch(
    sourceBranchName: string,
    targetBranchName?: string
  ): {
    success: boolean;
    newCommit: GitCommit;
    mergedSnapshot: Record<string, GitDocumentSnapshot>;
  } {
    const target = targetBranchName || this.state.currentBranch;
    if (sourceBranchName === target) {
      throw new Error('Bir dal kendisiyle birleştirilemez.');
    }

    const sourceObj = this.state.branches.find((b) => b.name === sourceBranchName);
    const targetObj = this.state.branches.find((b) => b.name === target);

    if (!sourceObj || !targetObj) {
      throw new Error('Birleştirilecek dallar bulunamadı.');
    }

    const sourceCommit = this.state.commits.find((c) => c.id === sourceObj.headCommitId);
    const targetCommit = this.state.commits.find((c) => c.id === targetObj.headCommitId);

    // Kaynak dalın verilerini hedef dal ile birleştir (3-way snapshot merge)
    const mergedSnapshot: Record<string, GitDocumentSnapshot> = {
      ...(targetCommit?.snapshot || {}),
      ...(sourceCommit?.snapshot || {}),
    };

    // Otomatik merge commiti oluştur
    const mergeCommit = this.commit(
      `Merge: '${sourceBranchName}' dalı '${target}' içine birleştirildi`,
      mergedSnapshot,
      'Git Merge Engine'
    );

    return {
      success: true,
      newCommit: mergeCommit,
      mergedSnapshot,
    };
  }

  /**
   * Dalın commit geçmişini döner
   */
  public getLog(branchName?: string): GitCommit[] {
    const targetBranch = branchName || this.state.currentBranch;
    return this.state.commits
      .filter((c) => c.branch === targetBranch)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Dalı siler
   */
  public deleteBranch(branchName: string): boolean {
    if (branchName === 'main' || branchName === this.state.currentBranch) {
      throw new Error('Aktif dal veya ana dal (main) silinemez.');
    }

    const initialLength = this.state.branches.length;
    this.state.branches = this.state.branches.filter((b) => b.name !== branchName);
    const deleted = this.state.branches.length < initialLength;
    if (deleted) this.saveState();
    return deleted;
  }

  public reset(): void {
    this.state = {
      currentBranch: 'main',
      branches: [
        {
          name: 'main',
          createdFrom: 'init',
          isCurrent: true,
        },
      ],
      commits: [],
    };
    this.saveState();
  }
}

export const localGitClient = new LocalGitClient();
export default localGitClient;
