import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import pluginHost from '../../src/services/plugins/pluginHost';
import { PluginSandbox } from '../../src/services/plugins/pluginSandbox';
import wordGoalReminderPlugin, { WordGoalReminderPlugin } from '../../src/plugins/sample-plugins/WordGoalReminderPlugin';
import PluginManagerDialog from '../../src/components/Plugins/PluginManagerDialog';
import { OpenScrivPlugin } from '../../src/types/plugins';

describe('Phase 49: Plugin API & Custom Themes SDK', () => {
  beforeEach(() => {
    pluginHost.reset();
  });

  describe('Plugin Lifecycle & Host', () => {
    it('registers and automatically enables a plugin', async () => {
      const onLoadMock = vi.fn();
      const testPlugin: OpenScrivPlugin = {
        metadata: {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
          author: 'Tester',
          description: 'A test plugin',
        },
        onLoad: onLoadMock,
      };

      await pluginHost.registerPlugin(testPlugin, true);

      expect(pluginHost.isPluginEnabled('test-plugin')).toBe(true);
      expect(onLoadMock).toHaveBeenCalled();
      expect(pluginHost.getLoadedPlugins().length).toBe(1);
    });

    it('enables, disables, and unregisters plugins gracefully', async () => {
      const onUnloadMock = vi.fn();
      const testPlugin: OpenScrivPlugin = {
        metadata: {
          id: 'test-plugin-2',
          name: 'Test Plugin 2',
          version: '1.0.0',
          author: 'Tester',
          description: 'Desc',
        },
        onUnload: onUnloadMock,
      };

      await pluginHost.registerPlugin(testPlugin, true);
      expect(pluginHost.isPluginEnabled('test-plugin-2')).toBe(true);

      await pluginHost.disablePlugin('test-plugin-2');
      expect(pluginHost.isPluginEnabled('test-plugin-2')).toBe(false);
      expect(onUnloadMock).toHaveBeenCalled();

      await pluginHost.unregisterPlugin('test-plugin-2');
      expect(pluginHost.getLoadedPlugins().length).toBe(0);
    });

    it('isolates storage per plugin in sandbox', () => {
      const storageA = PluginSandbox.createStorage('plugin-a');
      const storageB = PluginSandbox.createStorage('plugin-b');

      storageA.set('key1', 'Value for A');
      storageB.set('key1', 'Value for B');

      expect(storageA.get('key1')).toBe('Value for A');
      expect(storageB.get('key1')).toBe('Value for B');
    });

    it('prevents plugin errors from crashing the application', async () => {
      const buggyPlugin: OpenScrivPlugin = {
        metadata: {
          id: 'buggy',
          name: 'Buggy Plugin',
          version: '0.1',
          author: 'Unknown',
          description: 'Throws error',
        },
        onLoad: () => {
          throw new Error('Crash inside plugin onLoad!');
        },
      };

      // Should not throw unhandled exception
      await expect(pluginHost.registerPlugin(buggyPlugin, true)).resolves.not.toThrow();
    });
  });

  describe('WordGoalReminderPlugin Sample', () => {
    it('notifies writer at 50% and 100% word milestones', async () => {
      const notifyMock = vi.fn();
      pluginHost.setProviders({ notify: notifyMock });

      const instance = new WordGoalReminderPlugin();
      await pluginHost.registerPlugin(instance, true);

      instance.setGoal(500);

      pluginHost.emitWordCountChange(250); // 50%
      expect(notifyMock).toHaveBeenCalledWith(
        expect.stringContaining('%50'),
        'info'
      );

      pluginHost.emitWordCountChange(500); // 100%
      expect(notifyMock).toHaveBeenCalledWith(
        expect.stringContaining('Tebrikler!'),
        'success'
      );
    });
  });

  describe('Custom Theme SDK (.osctheme)', () => {
    it('imports and applies custom themes', () => {
      const themeJson = JSON.stringify({
        id: 'nordic-aurora',
        name: 'Nordic Aurora',
        author: 'Sven',
        colors: {
          bgPrimary: '#2e3440',
          bgSecondary: '#3b4252',
          textPrimary: '#eceff4',
          textSecondary: '#d8dee9',
          accent: '#88c0d0',
          border: '#4c566a',
        },
      });

      const theme = pluginHost.importCustomTheme(themeJson);
      expect(theme.name).toBe('Nordic Aurora');
      expect(pluginHost.getCustomThemes().length).toBe(1);

      const applied = pluginHost.applyCustomTheme('nordic-aurora');
      expect(applied).toBe(true);

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--bg-primary')).toBe('#2e3440');
      expect(root.style.getPropertyValue('--accent-color')).toBe('#88c0d0');
    });

    it('rejects invalid theme JSON', () => {
      expect(() => pluginHost.importCustomTheme('not-valid-json')).toThrow();
      expect(() => pluginHost.importCustomTheme('{"incomplete": true}')).toThrow();
    });
  });

  describe('PluginManagerDialog UI', () => {
    it('renders loaded plugins and toggles enabled state', async () => {
      const plugin: OpenScrivPlugin = {
        metadata: {
          id: 'ui-test-plugin',
          name: 'UI Test Plugin',
          version: '1.2.0',
          author: 'Tester',
          description: 'Plugin for UI testing',
        },
      };

      await pluginHost.registerPlugin(plugin, true);

      render(
        React.createElement(PluginManagerDialog, {
          isOpen: true,
          onClose: () => {},
        })
      );

      expect(screen.getByText('UI Test Plugin')).toBeDefined();
      const toggleBtn = screen.getByText('Aktif');
      expect(toggleBtn).toBeDefined();

      fireEvent.click(toggleBtn);
      await waitFor(() => {
        expect(pluginHost.isPluginEnabled('ui-test-plugin')).toBe(false);
      });
    });

    it('imports a custom theme through dialog textarea', async () => {
      render(
        React.createElement(PluginManagerDialog, {
          isOpen: true,
          onClose: () => {},
        })
      );

      const textarea = screen.getByPlaceholderText(/cyberpunk/i);
      const submitBtn = screen.getByText(/Temayı İçe Aktar ve Uygula/i);

      const validTheme = JSON.stringify({
        id: 'dialog-theme',
        name: 'Dialog Gold',
        colors: {
          bgPrimary: '#111',
          bgSecondary: '#222',
          textPrimary: '#eee',
          textSecondary: '#aaa',
          accent: '#ffd700',
          border: '#333',
        },
      });

      fireEvent.change(textarea, { target: { value: validTheme } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/başarıyla içe aktarıldı/i)).toBeDefined();
      });
      expect(pluginHost.getCustomThemes().some((t) => t.id === 'dialog-theme')).toBe(true);
    });
  });
});
