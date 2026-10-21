import { useState, useEffect } from 'react';
import {
  SmartCollection,
  FilterGroup,
  FilterRule,
  FilterField,
  FilterOperator,
  LogicOperator,
  FILTER_FIELD_LABELS,
  FILTER_OPERATOR_LABELS,
  DOCUMENT_STATUSES,
  POV_CHARACTERS,
} from '../../types/smartCollections';
import { getSmartCollectionsStore } from '../../services/smartCollectionsStore';
import { X, Plus, Trash2, Save, Filter } from 'lucide-react';

interface SmartCollectionEditorProps {
  collection?: SmartCollection | null;
  isOpen: boolean;
  onClose: () => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export default function SmartCollectionEditor({
  collection,
  isOpen,
  onClose,
}: SmartCollectionEditorProps) {
  const store = getSmartCollectionsStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📁');
  const [color, setColor] = useState('#3B82F6');
  const [filterGroup, setFilterGroup] = useState<FilterGroup>({
    id: generateId(),
    logic: 'and',
    rules: [],
  });
  const [sortBy, setSortBy] = useState<SmartCollection['sortBy']>('modified');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (collection) {
      setName(collection.name);
      setDescription(collection.description || '');
      setIcon(collection.icon || '📁');
      setColor(collection.color || '#3B82F6');
      setFilterGroup(collection.filterGroup);
      setSortBy(collection.sortBy || 'modified');
      setSortOrder(collection.sortOrder || 'desc');
    } else {
      setName('');
      setDescription('');
      setIcon('📁');
      setColor('#3B82F6');
      setFilterGroup({
        id: generateId(),
        logic: 'and',
        rules: [],
      });
      setSortBy('modified');
      setSortOrder('desc');
    }
  }, [collection, isOpen]);

  const handleAddRule = () => {
    const newRule: FilterRule = {
      id: generateId(),
      field: 'title',
      operator: 'contains',
      value: '',
    };
    setFilterGroup({
      ...filterGroup,
      rules: [...filterGroup.rules, newRule],
    });
  };

  const handleUpdateRule = (ruleId: string, updates: Partial<FilterRule>) => {
    setFilterGroup({
      ...filterGroup,
      rules: filterGroup.rules.map(r =>
        r.id === ruleId ? { ...r, ...updates } : r
      ),
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    setFilterGroup({
      ...filterGroup,
      rules: filterGroup.rules.filter(r => r.id !== ruleId),
    });
  };

  const handleToggleLogic = () => {
    setFilterGroup({
      ...filterGroup,
      logic: filterGroup.logic === 'and' ? 'or' : 'and',
    });
  };

  const handleSave = () => {
    if (!name.trim()) return;

    if (collection) {
      store.dispatch({
        type: 'UPDATE_COLLECTION',
        payload: {
          id: collection.id,
          updates: {
            name,
            description,
            icon,
            color,
            filterGroup,
            sortBy,
            sortOrder,
          },
        },
      });
    } else {
      store.dispatch({
        type: 'ADD_COLLECTION',
        payload: {
          name,
          description,
          icon,
          color,
          filterGroup,
          sortBy,
          sortOrder,
        },
      });
    }

    onClose();
  };

  const renderValueInput = (rule: FilterRule) => {
    switch (rule.field) {
      case 'status':
        return (
          <select
            value={String(rule.value)}
            onChange={(e) => handleUpdateRule(rule.id, { value: e.target.value })}
            className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded"
          >
            {DOCUMENT_STATUSES.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        );
      case 'pov':
        return (
          <select
            value={String(rule.value)}
            onChange={(e) => handleUpdateRule(rule.id, { value: e.target.value })}
            className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded"
          >
            <option value="">Seçiniz</option>
            {POV_CHARACTERS.map(pov => (
              <option key={pov} value={pov}>{pov}</option>
            ))}
          </select>
        );
      case 'wordCount':
        return (
          <input
            type="number"
            value={Number(rule.value) || 0}
            onChange={(e) => handleUpdateRule(rule.id, { value: parseInt(e.target.value) || 0 })}
            className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded"
            placeholder="0"
          />
        );
      case 'lastModified':
      case 'created':
        return (
          <select
            value={String(rule.value)}
            onChange={(e) => handleUpdateRule(rule.id, { value: e.target.value })}
            className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded"
          >
            <option value="3 days ago">Son 3 gün</option>
            <option value="7 days ago">Son 7 gün</option>
            <option value="1 week ago">Son 1 hafta</option>
            <option value="1 month ago">Son 1 ay</option>
            <option value="3 months ago">Son 3 ay</option>
          </select>
        );
      default:
        return (
          <input
            type="text"
            value={String(rule.value)}
            onChange={(e) => handleUpdateRule(rule.id, { value: e.target.value })}
            className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded"
            placeholder="Değer girin"
          />
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            {collection ? 'Koleksiyonu Düzenle' : 'Yeni Akıllı Koleksiyon'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-4 space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                İsim *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Örn: Son Değiştirilenler"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                İkon
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-16 px-3 py-2 text-sm border border-gray-200 rounded-lg text-center"
                  maxLength={2}
                />
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-16 h-9 border border-gray-200 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Açıklama
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200"
              rows={2}
              placeholder="Koleksiyon açıklaması (opsiyonel)"
            />
          </div>

          {/* Filter Rules */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-gray-800">Filtre Kuralları</h3>
              </div>
              <button
                onClick={handleToggleLogic}
                className={`px-3 py-1 text-xs rounded-lg border ${
                  filterGroup.logic === 'and'
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                    : 'bg-purple-50 text-purple-600 border-purple-200'
                }`}
              >
                {filterGroup.logic === 'and' ? 'VE (AND)' : 'VEYA (OR)'}
              </button>
            </div>

            <div className="space-y-2">
              {filterGroup.rules.map((rule) => (
                <div key={rule.id} className="flex items-center gap-2">
                  <select
                    value={rule.field}
                    onChange={(e) => handleUpdateRule(rule.id, { field: e.target.value as FilterField })}
                    className="px-2 py-1 text-sm border border-gray-200 rounded"
                  >
                    {Object.entries(FILTER_FIELD_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>

                  <select
                    value={rule.operator}
                    onChange={(e) => handleUpdateRule(rule.id, { operator: e.target.value as FilterOperator })}
                    className="px-2 py-1 text-sm border border-gray-200 rounded"
                  >
                    {Object.entries(FILTER_OPERATOR_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>

                  {renderValueInput(rule)}

                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddRule}
              className="mt-3 flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Kural Ekle
            </button>
          </div>

          {/* Sort Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Sıralama
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SmartCollection['sortBy'])}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              >
                <option value="title">Başlık</option>
                <option value="created">Oluşturulma</option>
                <option value="modified">Son Değiştirilme</option>
                <option value="wordCount">Kelime Sayısı</option>
                <option value="status">Durum</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Sıralama Yönü
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              >
                <option value="desc">Azalan</option>
                <option value="asc">Artan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || filterGroup.rules.length === 0}
            className="flex items-center gap-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {collection ? 'Güncelle' : 'Oluştur'}
          </button>
        </div>
      </div>
    </div>
  );
}
