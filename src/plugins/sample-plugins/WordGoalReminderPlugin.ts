/**
 * WordGoalReminderPlugin.ts — Faz 49 Örnek Eklentisi: Kelime Hedefi Hatırlatıcı
 */

import { OpenScrivPlugin, PluginContext } from '../../types/plugins';

export class WordGoalReminderPlugin implements OpenScrivPlugin {
  public metadata = {
    id: 'word-goal-reminder',
    name: 'Kelime Hedefi Hatırlatıcı',
    version: '1.0.0',
    author: 'OpenScriv Team',
    description: 'Yazım hedefinize ulaştığınızda tebrik ve motivasyon bildirimleri sunar.',
    permissions: ['notifications', 'storage'] as ('notifications' | 'storage' | 'editor-read' | 'theme-switch')[],
  };

  private context: PluginContext | null = null;
  private goal: number = 1000;
  private reachedMilestones = new Set<number>();

  public onLoad(context: PluginContext): void {
    this.context = context;
    const storedGoal = context.api.storage.get<number>('target_goal');
    if (storedGoal) {
      this.goal = storedGoal;
    }
    this.reachedMilestones.clear();
  }

  public onUnload(): void {
    this.context = null;
    this.reachedMilestones.clear();
  }

  public setGoal(goal: number): void {
    this.goal = goal;
    if (this.context) {
      this.context.api.storage.set('target_goal', goal);
    }
  }

  public onWordCountChange(wordCount: number): void {
    if (!this.context || this.goal <= 0) return;

    const percentage = Math.floor((wordCount / this.goal) * 100);

    if (percentage >= 100 && !this.reachedMilestones.has(100)) {
      this.reachedMilestones.add(100);
      this.context.api.notify(
        `🎉 Tebrikler! Günlük ${this.goal} kelimelik hedefinize ulaştınız! (${wordCount} kelime)`,
        'success'
      );
    } else if (percentage >= 50 && !this.reachedMilestones.has(50)) {
      this.reachedMilestones.add(50);
      this.context.api.notify(
        `✍️ Harika gidiyorsunuz! Hedefinizin %50'si tamamlandı (${wordCount} / ${this.goal} kelime).`,
        'info'
      );
    }
  }

  public getReachedMilestones(): number[] {
    return Array.from(this.reachedMilestones);
  }
}

export const wordGoalReminderPlugin = new WordGoalReminderPlugin();
export default wordGoalReminderPlugin;
