import { describe, it, expect, beforeEach } from 'vitest';
import { RecentProjectsService } from '../../src/services/recentProjects';

describe('RecentProjectsService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return empty array when no recent projects exist', () => {
    const list = RecentProjectsService.getRecent();
    expect(list).toEqual([]);
    expect(RecentProjectsService.getLatest()).toBeNull();
  });

  it('should add a project and return it as latest', () => {
    RecentProjectsService.add({ name: 'Proje 1', path: 'C:/docs/proje1.opscriv' });
    const list = RecentProjectsService.getRecent();
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('Proje 1');
    expect(list[0].path).toBe('C:/docs/proje1.opscriv');
    expect(RecentProjectsService.getLatest()?.name).toBe('Proje 1');
  });

  it('should deduplicate same project path and move it to top', () => {
    RecentProjectsService.add({ name: 'Proje 1', path: 'C:/docs/proje1.opscriv' });
    RecentProjectsService.add({ name: 'Proje 2', path: 'C:/docs/proje2.opscriv' });
    RecentProjectsService.add({ name: 'Proje 1 Güncellendi', path: 'C:/docs/proje1.opscriv' });

    const list = RecentProjectsService.getRecent();
    expect(list.length).toBe(2);
    expect(list[0].name).toBe('Proje 1 Güncellendi');
    expect(list[0].path).toBe('C:/docs/proje1.opscriv');
  });

  it('should remove project by path', () => {
    RecentProjectsService.add({ name: 'Proje 1', path: 'C:/docs/proje1.opscriv' });
    RecentProjectsService.add({ name: 'Proje 2', path: 'C:/docs/proje2.opscriv' });

    const updated = RecentProjectsService.remove('C:/docs/proje1.opscriv');
    expect(updated.length).toBe(1);
    expect(updated[0].name).toBe('Proje 2');
    expect(RecentProjectsService.getRecent().length).toBe(1);
  });

  it('should clear all recent projects', () => {
    RecentProjectsService.add({ name: 'Proje 1', path: 'C:/docs/proje1.opscriv' });
    RecentProjectsService.clear();
    expect(RecentProjectsService.getRecent()).toEqual([]);
  });
});
