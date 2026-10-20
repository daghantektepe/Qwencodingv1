import { useState, useEffect, useCallback } from 'react';
import {
  ResearchMedia,
  ResearchState,
  MediaType,
  MediaCategory,
  MEDIA_TYPE_LABELS,
  MEDIA_CATEGORY_LABELS,
  MEDIA_TYPE_ICONS,
} from '../../types/research';
import { getResearchStore } from '../../services/researchStore';
import MediaCard from './MediaCard';
import MediaViewer from './MediaViewer';
import SplitView from './SplitView';
import {
  Search,
  Grid3X3,
  List,
  Columns,
  FolderPlus,
  Upload,
  Filter,
  SortAsc,
  SortDesc,
  X,
  Library,
  FolderOpen,
} from 'lucide-react';

interface MediaFormData {
  title: string;
  description: string;
  type: MediaType;
  category: MediaCategory;
  fileData: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  tags: string[];
  notes: string;
}

const emptyForm: MediaFormData = {
  title: '',
  description: '',
  type: 'image',
  category: 'reference',
  fileData: '',
  fileName: '',
  fileSize: 0,
  mimeType: '',
  tags: [],
  notes: '',
};

export default function ResearchVault() {
  const store = getResearchStore();
  const [state, setState] = useState<ResearchState>(store.getState());
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMedia, setEditingMedia] = useState<ResearchMedia | null>(null);
  const [viewingMedia, setViewingMedia] = useState<ResearchMedia | null>(null);
  const [formData, setFormData] = useState<MediaFormData>(emptyForm);
  const [tagInput, setTagInput] = useState('');
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderDescription, setFolderDescription] = useState('');

  useEffect(() => {
    const unsubscribe = store.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, [store]);

  const filteredMedia = store.getFilteredMedia();
  const mediaCount = store.getMediaCount();

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;

      // Determine media type from MIME type
      let type: MediaType = 'document';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type === 'application/pdf') type = 'pdf';
      else if (file.type.startsWith('audio/')) type = 'audio';

      setFormData((prev) => ({
        ...prev,
        fileData: result,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        type,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAddMedia = useCallback(() => {
    if (!formData.title.trim() || !formData.fileData) return;

    if (editingMedia) {
      store.dispatch({
        type: 'UPDATE_MEDIA',
        payload: {
          id: editingMedia.id,
          updates: {
            title: formData.title,
            description: formData.description,
            type: formData.type,
            category: formData.category,
            tags: formData.tags,
            notes: formData.notes,
          },
        },
      });
    } else {
      store.dispatch({
        type: 'ADD_MEDIA',
        payload: formData,
      });
    }

    setFormData(emptyForm);
    setShowAddForm(false);
    setEditingMedia(null);
  }, [formData, editingMedia, store]);

  const handleEditMedia = useCallback((media: ResearchMedia) => {
    setEditingMedia(media);
    setFormData({
      title: media.title,
      description: media.description,
      type: media.type,
      category: media.category,
      fileData: media.fileData,
      fileName: media.fileName,
      fileSize: media.fileSize,
      mimeType: media.mimeType,
      tags: [...media.tags],
      notes: media.notes,
    });
    setShowAddForm(true);
  }, []);

  const handleDeleteMedia = useCallback(
    (id: string) => {
      if (confirm('Are you sure you want to delete this media?')) {
        store.dispatch({ type: 'DELETE_MEDIA', payload: id });
      }
    },
    [store]
  );

  const handleAddFolder = useCallback(() => {
    if (!folderName.trim()) return;
    store.dispatch({
      type: 'ADD_FOLDER',
      payload: {
        name: folderName,
        description: folderDescription,
      },
    });
    setFolderName('');
    setFolderDescription('');
    setShowFolderForm(false);
  }, [folderName, folderDescription, store]);

  const handleAddTag = useCallback(() => {
    if (!tagInput.trim() || formData.tags.includes(tagInput.trim())) return;
    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, tagInput.trim()],
    }));
    setTagInput('');
  }, [tagInput, formData.tags]);

  const handleRemoveTag = useCallback((tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  }, []);

  const selectedMedia = state.selectedMediaId
    ? store.getMediaById(state.selectedMediaId)
    : null;

  // Left panel content for split view
  const leftPanelContent = (
    <div className="h-full flex flex-col bg-white">
      {/* Sidebar - Folders */}
      <div className="w-full border-b border-gray-200 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-gray-800">Folders</h3>
          </div>
          <button
            onClick={() => setShowFolderForm(!showFolderForm)}
            className="p-1 hover:bg-gray-100 rounded"
            title="New folder"
          >
            <FolderPlus className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {showFolderForm && (
          <div className="mb-2 p-2 bg-gray-50 rounded-lg space-y-2">
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
            />
            <input
              type="text"
              value={folderDescription}
              onChange={(e) => setFolderDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
            />
            <div className="flex gap-1">
              <button
                onClick={handleAddFolder}
                disabled={!folderName.trim()}
                className="flex-1 px-2 py-1 text-xs bg-indigo-600 text-white rounded disabled:opacity-50"
              >
                Create
              </button>
              <button
                onClick={() => setShowFolderForm(false)}
                className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-1 max-h-32 overflow-y-auto">
          <button
            onClick={() => store.dispatch({ type: 'SELECT_FOLDER', payload: null })}
            className={`w-full text-left px-2 py-1 text-xs rounded ${
              !state.selectedFolderId ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50 text-gray-600'
            }`}
          >
            All Media ({mediaCount.total})
          </button>
          {state.folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => store.dispatch({ type: 'SELECT_FOLDER', payload: folder.id })}
              className={`w-full text-left px-2 py-1 text-xs rounded flex items-center gap-1 ${
                state.selectedFolderId === folder.id
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'hover:bg-gray-50 text-gray-600'
              }`}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: folder.color }}
              />
              <span className="truncate">{folder.name}</span>
              <span className="text-gray-400 ml-auto">({folder.mediaIds.length})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="p-3 border-b border-gray-200">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-gray-800">{mediaCount.total}</div>
            <div className="text-[10px] text-gray-500">Total</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-800">{mediaCount.byType.image}</div>
            <div className="text-[10px] text-gray-500">Images</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-800">{mediaCount.byType.pdf}</div>
            <div className="text-[10px] text-gray-500">PDFs</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Main content
  const mainContent = (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Library className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Research Vault</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {filteredMedia.length} items
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => store.dispatch({ type: 'TOGGLE_SPLIT_VIEW' })}
              className={`p-1.5 rounded-lg border ${
                state.splitViewActive
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                  : 'border-gray-200 text-gray-400 hover:text-gray-600'
              }`}
              title="Toggle split view"
            >
              <Columns className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setEditingMedia(null);
                setFormData(emptyForm);
                setShowAddForm(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
            >
              <Upload className="w-4 h-4" />
              Add Media
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search media..."
              value={state.searchQuery}
              onChange={(e) => store.dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {/* Type filter */}
          <select
            value={state.filterType}
            onChange={(e) => store.dispatch({ type: 'SET_FILTER_TYPE', payload: e.target.value as MediaType | 'all' })}
            className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg"
          >
            <option value="all">All Types</option>
            {Object.entries(MEDIA_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {/* Category filter */}
          <select
            value={state.filterCategory}
            onChange={(e) => store.dispatch({ type: 'SET_FILTER_CATEGORY', payload: e.target.value as MediaCategory | 'all' })}
            className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg"
          >
            <option value="all">All Categories</option>
            {Object.entries(MEDIA_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {/* View mode */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => store.dispatch({ type: 'SET_VIEW_MODE', payload: 'grid' })}
              className={`p-1.5 ${state.viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400'}`}
              title="Grid view"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => store.dispatch({ type: 'SET_VIEW_MODE', payload: 'list' })}
              className={`p-1.5 ${state.viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400'}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Sort */}
          <button
            onClick={() =>
              store.dispatch({
                type: 'SET_SORT_ORDER',
                payload: state.sortOrder === 'asc' ? 'desc' : 'asc',
              })
            }
            className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:text-gray-600"
            title={`Sort ${state.sortOrder === 'asc' ? 'descending' : 'ascending'}`}
          >
            {state.sortOrder === 'asc' ? (
              <SortAsc className="w-4 h-4" />
            ) : (
              <SortDesc className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="mb-4 border border-indigo-200 rounded-xl bg-indigo-50/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">
                {editingMedia ? 'Edit Media' : 'Add New Media'}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingMedia(null);
                  setFormData(emptyForm);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* File upload */}
              {!editingMedia && (
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    File
                  </label>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept="image/*,application/pdf,audio/*,.txt,.md"
                    className="w-full text-sm"
                  />
                  {formData.fileName && (
                    <div className="text-xs text-gray-500 mt-1">
                      Selected: {formData.fileName}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg"
                  placeholder="Enter title"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value as MediaType }))}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg"
                >
                  {Object.entries(MEDIA_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value as MediaCategory }))}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg"
                >
                  {Object.entries(MEDIA_CATEGORY_LABELS).map(([value, label]) => (
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
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg resize-none"
                  rows={2}
                  placeholder="Brief description"
                />
              </div>

              {/* Tags */}
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Tags
                </label>
                <div className="flex items-center gap-1 flex-wrap mb-1">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gray-100 text-xs"
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
                    className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded"
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

              {/* Notes */}
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg resize-none"
                  rows={2}
                  placeholder="Additional notes"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingMedia(null);
                  setFormData(emptyForm);
                }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMedia}
                disabled={!formData.title.trim() || (!editingMedia && !formData.fileData)}
                className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {editingMedia ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        )}

        {/* Media grid/list */}
        {state.viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredMedia.map((media) => (
              <MediaCard
                key={media.id}
                media={media}
                isSelected={media.id === state.selectedMediaId}
                onSelect={(id) => {
                  store.dispatch({ type: 'SELECT_MEDIA', payload: id });
                  if (state.splitViewActive) {
                    setViewingMedia(store.getMediaById(id) || null);
                  }
                }}
                onEdit={handleEditMedia}
                onDelete={handleDeleteMedia}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredMedia.map((media) => (
              <MediaCard
                key={media.id}
                media={media}
                isSelected={media.id === state.selectedMediaId}
                onSelect={(id) => {
                  store.dispatch({ type: 'SELECT_MEDIA', payload: id });
                  if (state.splitViewActive) {
                    setViewingMedia(store.getMediaById(id) || null);
                  }
                }}
                onEdit={handleEditMedia}
                onDelete={handleDeleteMedia}
                compact
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {filteredMedia.length === 0 && (
          <div className="text-center py-12">
            <Library className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {state.searchQuery || state.filterType !== 'all' || state.filterCategory !== 'all'
                ? 'No media matches your filters'
                : 'No media yet. Add your first research material!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Render with or without split view
  if (state.splitViewActive && viewingMedia) {
    return (
      <>
        <SplitView
          leftContent={
            <div className="h-full flex">
              {/* Sidebar */}
              <div className="w-48 border-r border-gray-200 overflow-y-auto">
                {leftPanelContent}
              </div>
              {/* Main content */}
              <div className="flex-1">{mainContent}</div>
            </div>
          }
          media={viewingMedia}
          onCloseMedia={() => setViewingMedia(null)}
        />
        {/* Full viewer modal (when clicking on media in split view) */}
        {selectedMedia && !state.splitViewActive && (
          <MediaViewer
            media={selectedMedia}
            onClose={() => store.dispatch({ type: 'SELECT_MEDIA', payload: null })}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="h-full flex">
        {/* Sidebar */}
        <div className="w-48 border-r border-gray-200 overflow-y-auto flex-shrink-0">
          {leftPanelContent}
        </div>
        {/* Main content */}
        <div className="flex-1">{mainContent}</div>
      </div>

      {/* Full viewer modal */}
      {selectedMedia && !state.splitViewActive && (
        <MediaViewer
          media={selectedMedia}
          onClose={() => store.dispatch({ type: 'SELECT_MEDIA', payload: null })}
        />
      )}
    </>
  );
}
