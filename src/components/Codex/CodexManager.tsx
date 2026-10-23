import { useState, useEffect, useCallback } from 'react';
import {
  Character,
  CharacterRole,
  Relationship,
  RelationshipType,
  CodexState,
  ROLE_LABELS,
  RELATIONSHIP_LABELS,
  RELATIONSHIP_COLORS,
} from '../../types/codex';
import { getCodexStore } from '../../services/codexStore';
import CharacterCard from './CharacterCard';
import RelationshipGraph from './RelationshipGraph';
import {
  Plus,
  Search,
  Grid3X3,
  List,
  Network,
  Filter,
  X,
  Link2,
  BookOpen,
} from 'lucide-react';

interface CharacterFormData {
  name: string;
  role: CharacterRole;
  description: string;
  attributes: Record<string, string>;
  tags: string[];
}

const emptyForm: CharacterFormData = {
  name: '',
  role: 'supporting',
  description: '',
  attributes: {},
  tags: [],
};

// Fallback definitions in case imports fail
const FALLBACK_ROLE_LABELS: Record<CharacterRole, string> = {
  protagonist: 'Protagonist',
  antagonist: 'Antagonist',
  supporting: 'Supporting',
  minor: 'Minor',
  npc: 'NPC',
};

const FALLBACK_RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  ally: 'Ally',
  enemy: 'Enemy',
  family: 'Family',
  romantic: 'Romantic',
  mentor: 'Mentor',
  rival: 'Rival',
  neutral: 'Neutral',
  complex: 'Complex',
};

const FALLBACK_RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  ally: '#22C55E',
  enemy: '#EF4444',
  family: '#F97316',
  romantic: '#EC4899',
  mentor: '#3B82F6',
  rival: '#EAB308',
  neutral: '#6B7280',
  complex: '#8B5CF6',
};

// Use imported values or fallback
const safeRoleLabels = ROLE_LABELS || FALLBACK_ROLE_LABELS;
const safeRelationshipLabels = RELATIONSHIP_LABELS || FALLBACK_RELATIONSHIP_LABELS;
const safeRelationshipColors = RELATIONSHIP_COLORS || FALLBACK_RELATIONSHIP_COLORS;

export function CodexManager() {
  const store = getCodexStore();
  const [state, setState] = useState<CodexState>(store.getState());
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [showRelationshipForm, setShowRelationshipForm] = useState(false);
  const [formData, setFormData] = useState<CharacterFormData>(emptyForm);
  const [relFormData, setRelFormData] = useState({
    targetId: '',
    type: 'neutral' as RelationshipType,
    description: '',
    strength: 5,
  });
  const [newAttributeKey, setNewAttributeKey] = useState('');
  const [newAttributeValue, setNewAttributeValue] = useState('');
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    const unsubscribe = store.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, [store]);

  const filteredCharacters = store.getFilteredCharacters();

  const handleAddCharacter = useCallback(() => {
    if (!formData.name.trim()) return;
    store.dispatch({
      type: 'ADD_CHARACTER',
      payload: {
        name: formData.name.trim(),
        role: formData.role,
        description: formData.description,
        attributes: formData.attributes,
        tags: formData.tags,
      },
    });
    store.dispatch({ type: 'SELECT_CHARACTER', payload: null });
    setFormData(emptyForm);
    setShowAddForm(false);
  }, [formData, store]);

  const handleUpdateCharacter = useCallback(() => {
    if (!editingCharacter || !formData.name.trim()) return;
    store.dispatch({
      type: 'UPDATE_CHARACTER',
      payload: {
        id: editingCharacter.id,
        updates: {
          name: formData.name.trim(),
          role: formData.role,
          description: formData.description,
          attributes: formData.attributes,
          tags: formData.tags,
        },
      },
    });
    setEditingCharacter(null);
    setFormData(emptyForm);
  }, [editingCharacter, formData, store]);

  const handleDeleteCharacter = useCallback(
    (id: string) => {
      if (confirm('Are you sure you want to delete this character?')) {
        store.dispatch({ type: 'DELETE_CHARACTER', payload: id });
      }
    },
    [store]
  );

  const handleEditCharacter = useCallback((character: Character) => {
    setEditingCharacter(character);
    setFormData({
      name: character.name,
      role: character.role,
      description: character.description,
      attributes: { ...character.attributes } as Record<string, string>,
      tags: [...character.tags],
    });
    setShowAddForm(false);
  }, []);

  const handleAddRelationship = useCallback(() => {
    if (!state.selectedCharacterId || !relFormData.targetId) return;
    store.dispatch({
      type: 'ADD_RELATIONSHIP',
      payload: {
        sourceId: state.selectedCharacterId,
        targetId: relFormData.targetId,
        type: relFormData.type,
        description: relFormData.description,
        strength: relFormData.strength,
      },
    });
    setRelFormData({ targetId: '', type: 'neutral', description: '', strength: 5 });
    setShowRelationshipForm(false);
  }, [state.selectedCharacterId, relFormData, store]);

  const handleDeleteRelationship = useCallback(
    (id: string) => {
      store.dispatch({ type: 'DELETE_RELATIONSHIP', payload: id });
    },
    [store]
  );

  const handleAddAttribute = () => {
    if (!newAttributeKey.trim()) return;
    setFormData((prev) => ({
      ...prev,
      attributes: { ...prev.attributes, [newAttributeKey.trim()]: newAttributeValue },
    }));
    setNewAttributeKey('');
    setNewAttributeValue('');
  };

  const handleRemoveAttribute = (key: string) => {
    setFormData((prev) => {
      const newAttrs = { ...prev.attributes };
      delete newAttrs[key];
      return { ...prev, attributes: newAttrs };
    });
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    if (!formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const selectedCharacter =
    state.selectedCharacterId &&
    filteredCharacters.some((c) => c.id === state.selectedCharacterId)
      ? store.getCharacterById(state.selectedCharacterId)
      : null;

  const selectedRelationships = state.selectedCharacterId
    ? store.getCharacterRelationships(state.selectedCharacterId)
    : [];

  const availableTargets = state.characters.filter(
    (c) => c.id !== state.selectedCharacterId
  );

  const isFormOpen = showAddForm || editingCharacter !== null;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Character Codex</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {state.characters.length}
            </span>
          </div>
          <button
            data-testid="add-character-button"
            onClick={() => {
              setShowAddForm(true);
              setEditingCharacter(null);
              setFormData(emptyForm);
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Character
          </button>
        </div>

        {/* Search and filters */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search characters..."
              value={state.searchQuery}
              onChange={(e) =>
                store.dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })
              }
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
            />
            {state.searchQuery && (
              <button
                onClick={() => store.dispatch({ type: 'SET_SEARCH_QUERY', payload: '' })}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={state.filterRole}
              onChange={(e) =>
                store.dispatch({
                  type: 'SET_FILTER_ROLE',
                  payload: e.target.value as CharacterRole | 'all',
                })
              }
              className="appearance-none pl-7 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
            >
              <option value="all">All Roles</option>
              {Object.entries(safeRoleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <Filter className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => store.dispatch({ type: 'SET_VIEW_MODE', payload: 'grid' })}
              className={`p-1.5 ${state.viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Grid view"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => store.dispatch({ type: 'SET_VIEW_MODE', payload: 'list' })}
              className={`p-1.5 ${state.viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => store.dispatch({ type: 'SET_VIEW_MODE', payload: 'graph' })}
              className={`p-1.5 ${state.viewMode === 'graph' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Graph view"
            >
              <Network className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Main area */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Add/Edit Form */}
          {isFormOpen && (
            <div className="mb-4 border border-indigo-200 rounded-xl bg-indigo-50/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 data-testid="form-title" className="text-sm font-semibold text-gray-800">
                  {editingCharacter ? 'Edit Character' : 'New Character'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingCharacter(null);
                    setFormData(emptyForm);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="Character name"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, role: e.target.value as CharacterRole }))
                    }
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    {Object.entries(safeRoleLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, description: e.target.value }))
                    }
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
                    rows={2}
                    placeholder="Brief description..."
                  />
                </div>

                {/* Tags */}
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Tags</label>
                  <div className="flex items-center gap-1 flex-wrap mb-1">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gray-100 text-xs text-gray-600"
                      >
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)}>
                          <X className="w-2.5 h-2.5 hover:text-red-500" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-200"
                      placeholder="Add tag..."
                    />
                    <button
                      onClick={handleAddTag}
                      className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Attributes */}
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Attributes
                  </label>
                  <div className="space-y-1 mb-2">
                    {Object.entries(formData.attributes).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-1 text-xs">
                        <span className="text-gray-500 font-medium">{key}:</span>
                        <span className="text-gray-700">{value}</span>
                        <button
                          onClick={() => handleRemoveAttribute(key)}
                          className="ml-auto text-gray-400 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={newAttributeKey}
                      onChange={(e) => setNewAttributeKey(e.target.value)}
                      className="w-24 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-200"
                      placeholder="Key"
                    />
                    <input
                      type="text"
                      value={newAttributeValue}
                      onChange={(e) => setNewAttributeValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddAttribute()}
                      className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-200"
                      placeholder="Value"
                    />
                    <button
                      onClick={handleAddAttribute}
                      className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingCharacter(null);
                    setFormData(emptyForm);
                  }}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={editingCharacter ? handleUpdateCharacter : handleAddCharacter}
                  disabled={!formData.name.trim()}
                  className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingCharacter ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          )}

          {/* Graph View */}
          {state.viewMode === 'graph' && (
            <RelationshipGraph
              characters={state.characters}
              relationships={state.relationships}
              selectedCharacterId={state.selectedCharacterId}
              onSelectCharacter={(id) =>
                store.dispatch({ type: 'SELECT_CHARACTER', payload: id })
              }
              width={560}
              height={380}
            />
          )}

          {/* Grid View */}
          {state.viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCharacters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  relationships={store.getCharacterRelationships(character.id)}
                  isSelected={character.id === state.selectedCharacterId}
                  onSelect={(id) =>
                    store.dispatch({ type: 'SELECT_CHARACTER', payload: id })
                  }
                  onEdit={handleEditCharacter}
                  onDelete={handleDeleteCharacter}
                />
              ))}
            </div>
          )}

          {/* List View */}
          {state.viewMode === 'list' && (
            <div className="space-y-1">
              {filteredCharacters.map((character) => (
                <div
                  key={character.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    character.id === state.selectedCharacterId
                      ? 'bg-indigo-50 border border-indigo-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                  onClick={() =>
                    store.dispatch({ type: 'SELECT_CHARACTER', payload: character.id })
                  }
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: character.color }}
                  >
                    {character.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {character.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {safeRoleLabels[character.role]}
                      {character.description && ` · ${character.description}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {character.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCharacter(character);
                    }}
                    className="p-1 hover:bg-gray-200 rounded text-gray-400"
                  >
                    <span className="text-xs">Edit</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCharacter(character.id);
                    }}
                    className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {filteredCharacters.length === 0 && state.viewMode !== 'graph' && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {state.searchQuery || state.filterRole !== 'all'
                  ? 'No characters match your filters'
                  : 'No characters yet. Create your first character!'}
              </p>
            </div>
          )}
        </div>

        {/* Detail sidebar */}
        {selectedCharacter && state.viewMode !== 'graph' && (
          <div className="w-72 border-l border-gray-200 overflow-y-auto p-4 bg-gray-50/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Details</h3>
              <button
                onClick={() => store.dispatch({ type: 'SELECT_CHARACTER', payload: null })}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: selectedCharacter.color }}
              >
                {selectedCharacter.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-sm text-gray-900">
                  {selectedCharacter.name}
                </div>
                <div className="text-xs text-gray-500">
                  {safeRoleLabels[selectedCharacter.role]}
                </div>
              </div>
            </div>

            {selectedCharacter.description && (
              <p className="text-xs text-gray-600 mb-3">
                {selectedCharacter.description}
              </p>
            )}

            {/* Relationships section */}
            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  <Link2 className="w-3 h-3" />
                  Relationships
                </h4>
                {availableTargets.length > 0 && (
                  <button
                    onClick={() => setShowRelationshipForm(!showRelationshipForm)}
                    className="text-[10px] text-indigo-600 hover:text-indigo-700"
                  >
                    + Add
                  </button>
                )}
              </div>

              {/* Add relationship form */}
              {showRelationshipForm && (
                <div className="mb-2 p-2 bg-white rounded-lg border border-gray-200 space-y-2">
                  <select
                    value={relFormData.targetId}
                    onChange={(e) =>
                      setRelFormData((p) => ({ ...p, targetId: e.target.value }))
                    }
                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                  >
                    <option value="">Select character...</option>
                    {availableTargets.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={relFormData.type}
                    onChange={(e) =>
                      setRelFormData((p) => ({
                        ...p,
                        type: e.target.value as RelationshipType,
                      }))
                    }
                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                  >
                    {Object.entries(safeRelationshipLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-gray-500">Strength:</label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={relFormData.strength}
                      onChange={(e) =>
                        setRelFormData((p) => ({
                          ...p,
                          strength: parseInt(e.target.value),
                        }))
                      }
                      className="flex-1 h-1"
                    />
                    <span className="text-[10px] text-gray-500 w-4">
                      {relFormData.strength}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={handleAddRelationship}
                      disabled={!relFormData.targetId}
                      className="flex-1 px-2 py-1 text-xs bg-indigo-600 text-white rounded disabled:opacity-50"
                    >
                      Link
                    </button>
                    <button
                      onClick={() => setShowRelationshipForm(false)}
                      className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Relationship list */}
              <div className="space-y-1">
                {selectedRelationships.map((rel: Relationship) => {
                  const otherId =
                    rel.sourceId === selectedCharacter.id ? rel.targetId : rel.sourceId;
                  const other = store.getCharacterById(otherId);
                  return (
                    <div
                      key={rel.id}
                      className="flex items-center gap-2 px-2 py-1.5 bg-white rounded border border-gray-100"
                    >
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                        style={{ backgroundColor: other?.color || '#9CA3AF' }}
                      >
                        {other?.name.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-700 truncate">
                          {other?.name || 'Unknown'}
                        </div>
                        <div className="flex items-center gap-1">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: safeRelationshipColors[rel.type] || '#6B7280',
                            }}
                          />
                          <span className="text-[10px] text-gray-400">
                            {safeRelationshipLabels[rel.type] || rel.type} · Str:{rel.strength}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteRelationship(rel.id)}
                        className="text-gray-300 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
                {selectedRelationships.length === 0 && (
                  <p className="text-[10px] text-gray-400 text-center py-2">
                    No relationships yet
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CodexManager;
