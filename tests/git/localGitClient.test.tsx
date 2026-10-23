import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  localGitClient,
  GitDocumentSnapshot,
} from '../../src/services/git/localGitClient';
import { BranchManagerDialog } from '../../src/components/Git/BranchManagerDialog';
import { CommitHistoryTimeline } from '../../src/components/Git/CommitHistoryTimeline';

describe('LocalGitClient (Faz 80)', () => {
  beforeEach(() => {
    localGitClient.reset();
  });

  it('varsayılan olarak main dalı ile başlar', () => {
    expect(localGitClient.getCurrentBranch()).toBe('main');
    const branches = localGitClient.getBranches();
    expect(branches.length).toBe(1);
    expect(branches[0].name).toBe('main');
    expect(branches[0].isCurrent).toBe(true);
  });

  it('commit oluşturur ve dalın headCommitId değerini günceller', () => {
    const snapshot: Record<string, GitDocumentSnapshot> = {
      'doc-1': { title: 'Bölüm 1', content: 'İlk paragraf' },
    };

    const c1 = localGitClient.commit('İlk taslak', snapshot, 'Yazar');
    expect(c1.message).toBe('İlk taslak');
    expect(c1.branch).toBe('main');

    const log = localGitClient.getLog('main');
    expect(log.length).toBe(1);
    expect(log[0].id).toBe(c1.id);
  });

  it('yeni dal açar ve dallar arasında geçiş yapar (checkout)', () => {
    localGitClient.commit('Ana başlangıç', {
      'doc-1': { title: 'Bölüm 1', content: 'Ana hikaye' },
    });

    // Yeni dal aç
    const b2 = localGitClient.createBranch('alternatif-son');
    expect(b2.name).toBe('alternatif-son');
    expect(b2.createdFrom).toBe('main');

    // Yeni dala geç
    const switchRes = localGitClient.switchBranch('alternatif-son');
    expect(switchRes.branch.name).toBe('alternatif-son');
    expect(localGitClient.getCurrentBranch()).toBe('alternatif-son');

    // Alternatif dalda yeni commit yap
    localGitClient.commit('Kötü son eklendi', {
      'doc-1': { title: 'Bölüm 1', content: 'Karanlık son' },
    });

    const altLog = localGitClient.getLog('alternatif-son');
    expect(altLog.length).toBe(1);
    expect(altLog[0].message).toBe('Kötü son eklendi');

    // main dalına geri dön ve kontrol et
    const switchBack = localGitClient.switchBranch('main');
    expect(switchBack.snapshot?.['doc-1'].content).toBe('Ana hikaye');
  });

  it('dalları birleştirir (merge)', () => {
    localGitClient.commit('Başlangıç', {
      'doc-1': { title: 'Giriş', content: 'Başlangıç metni' },
    });

    localGitClient.createBranch('yan-hikaye');
    localGitClient.switchBranch('yan-hikaye');
    localGitClient.commit('Yan karakter hikayesi', {
      'doc-2': { title: 'Yan Karakter', content: 'Yan hikaye detayları' },
    });

    localGitClient.switchBranch('main');

    const mergeRes = localGitClient.mergeBranch('yan-hikaye', 'main');
    expect(mergeRes.success).toBe(true);
    expect(mergeRes.newCommit.message).toContain('yan-hikaye');
    // Her iki doküman da birleşmiş olmalı
    expect(mergeRes.mergedSnapshot['doc-1']).toBeDefined();
    expect(mergeRes.mergedSnapshot['doc-2']).toBeDefined();
  });

  it('aktif dalı veya main dalını silmeye izin vermez', () => {
    expect(() => localGitClient.deleteBranch('main')).toThrow();

    localGitClient.createBranch('deneme');
    localGitClient.switchBranch('deneme');
    expect(() => localGitClient.deleteBranch('deneme')).toThrow();

    localGitClient.switchBranch('main');
    const deleted = localGitClient.deleteBranch('deneme');
    expect(deleted).toBe(true);
  });
});

describe('BranchManagerDialog Component', () => {
  beforeEach(() => {
    localGitClient.reset();
  });

  it('isOpen false olduğunda render etmez', () => {
    const { container } = render(
      <BranchManagerDialog isOpen={false} onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('yeni dal oluşturur ve listeyi günceller', () => {
    render(<BranchManagerDialog isOpen={true} onClose={() => {}} />);

    expect(screen.getByText('Yerel Dal Yönetimi (Branch Studio)')).toBeDefined();

    const input = screen.getByPlaceholderText(/Yeni dal adı/i);
    fireEvent.change(input, { target: { value: 'revizyon-2' } });

    const submitBtn = screen.getByRole('button', { name: /\+ Dal Aç/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('revizyon-2')).toBeDefined();
  });
});

describe('CommitHistoryTimeline Component', () => {
  beforeEach(() => {
    localGitClient.reset();
  });

  it('hızlı commit oluşturur ve callback çağırır', () => {
    const onCommitCreated = vi.fn();

    render(
      <CommitHistoryTimeline
        currentSnapshot={{ 'doc-1': { title: 'Giriş' } }}
        onCommitCreated={onCommitCreated}
      />
    );

    expect(screen.getByText('Sürüm Geçmişi & Zaman Çizelgesi')).toBeDefined();

    const input = screen.getByPlaceholderText(/Bu anın sürüm notunu yazın/i);
    fireEvent.change(input, { target: { value: 'Revizyon 1.0 bitti' } });

    const saveBtn = screen.getByRole('button', { name: /💾 Kaydet/i });
    fireEvent.click(saveBtn);

    expect(onCommitCreated).toHaveBeenCalled();
    expect(screen.getByText('Revizyon 1.0 bitti')).toBeDefined();
  });
});
