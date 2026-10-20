import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { CodexMentionExtension } from '../../src/components/Codex/CodexMentionExtension';
import { getCodexStore, resetCodexStore } from '../../src/services/codexStore';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('CodexMentionExtension', () => {
  let editor: Editor;

  beforeEach(() => {
    resetCodexStore();
    localStorageMock.clear();
    vi.clearAllMocks();

    editor = new Editor({
      extensions: [StarterKit, CodexMentionExtension],
      content: '',
    });
  });

  describe('Extension Registration', () => {
    it('should register the extension', () => {
      expect(editor.extensionManager.extensions).toContainEqual(
        expect.objectContaining({ name: 'codexMention' })
      );
    });

    it('should have correct default options', () => {
      const extension = editor.extensionManager.extensions.find(
        (ext) => ext.name === 'codexMention'
      );
      expect(extension).toBeDefined();
    });
  });

  describe('Commands', () => {
    it('should add codex mention via command', () => {
      const store = getCodexStore();
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Gandalf', role: 'supporting', description: 'Wizard' },
      });

      const character = store.getState().characters[0];

      editor.commands.addCodexMention({
        id: character.id,
        label: character.name,
        role: character.role,
        color: character.color,
      });

      const html = editor.getHTML();
      expect(html).toContain('data-type="codexMention"');
      expect(html).toContain(`data-id="${character.id}"`);
      expect(html).toContain(`data-label="${character.name}"`);
      expect(html).toContain(`@${character.name}`);
    });

    it('should insert mention with correct attributes', () => {
      editor.commands.addCodexMention({
        id: 'test-id',
        label: 'TestChar',
        role: 'protagonist',
        color: '#FF0000',
      });

      const html = editor.getHTML();
      expect(html).toContain('data-id="test-id"');
      expect(html).toContain('data-label="TestChar"');
      expect(html).toContain('data-role="protagonist"');
      expect(html).toContain('data-color="#FF0000"');
    });
  });

  describe('Parsing', () => {
    it('should parse HTML with codex mention', () => {
      const html = '<span data-type="codexMention" data-id="123" data-label="Frodo" data-role="protagonist" data-color="#3B82F6">@Frodo</span>';
      
      editor.commands.setContent(html);
      
      const json = editor.getJSON();
      const mentionMark = json.content?.[0]?.content?.[0]?.marks?.find(
        (mark: any) => mark.type === 'codexMention'
      );

      expect(mentionMark).toBeDefined();
      expect(mentionMark.attrs.id).toBe('123');
      expect(mentionMark.attrs.label).toBe('Frodo');
      expect(mentionMark.attrs.role).toBe('protagonist');
      expect(mentionMark.attrs.color).toBe('#3B82F6');
    });
  });

  describe('Suggestion Items', () => {
    it('should filter characters by query', () => {
      const store = getCodexStore();
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Frodo', role: 'protagonist', description: '' },
      });
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Sam', role: 'supporting', description: '' },
      });
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Gandalf', role: 'supporting', description: '' },
      });

      const extension = editor.extensionManager.extensions.find(
        (ext) => ext.name === 'codexMention'
      );
      
      const items = extension?.options.suggestion.items('fro');
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('Frodo');
    });

    it('should return all characters for empty query', () => {
      const store = getCodexStore();
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Alice', role: 'protagonist', description: '' },
      });
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { name: 'Bob', role: 'supporting', description: '' },
      });

      const extension = editor.extensionManager.extensions.find(
        (ext) => ext.name === 'codexMention'
      );
      
      const items = extension?.options.suggestion.items('');
      expect(items).toHaveLength(2);
    });
  });

  describe('HTML Output', () => {
    it('should render mention with correct styling', () => {
      editor.commands.addCodexMention({
        id: '1',
        label: 'Test',
        role: 'minor',
        color: '#10B981',
      });

      const html = editor.getHTML();
      expect(html).toMatch(/border-left:\s*3px solid\s*(#10B981|rgb\(16,\s*185,\s*129\))/i);
      expect(html).toMatch(/background-color:\s*(#eef2ff|rgb\(238,\s*242,\s*255\))/i);
      expect(html).toContain('@Test');
    });

    it('should use default color when not specified', () => {
      editor.commands.addCodexMention({
        id: '1',
        label: 'Test',
        role: 'minor',
        color: '',
      });

      const html = editor.getHTML();
      expect(html).toMatch(/border-left:\s*3px solid\s*(#6366f1|rgb\(99,\s*102,\s*241\))/i);
    });
  });

  describe('Integration with Store', () => {
    it('should work with characters from store', () => {
      const store = getCodexStore();
      store.dispatch({
        type: 'ADD_CHARACTER',
        payload: { 
          name: 'Aragorn', 
          role: 'protagonist', 
          description: 'King',
          tags: ['human', 'king'],
        },
      });

      const character = store.getState().characters[0];

      editor.commands.addCodexMention({
        id: character.id,
        label: character.name,
        role: character.role,
        color: character.color,
      });

      const html = editor.getHTML();
      expect(html).toContain(`data-id="${character.id}"`);
      expect(html).toContain(`data-label="${character.name}"`);
      expect(html).toContain(`data-role="${character.role}"`);
      expect(html).toContain(`data-color="${character.color}"`);
    });
  });
});
