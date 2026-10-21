import { useState, useEffect } from 'react';
import { SmartCollectionsState, SmartCollection, Document } from '../../types/smartCollections';
import { getSmartCollectionsStore } from '../../services/smartCollectionsStore';
import SmartCollectionEditor from './SmartCollectionEditor';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  FolderOpen,
  FileText,
  Clock,
  Tag,
} from 'lucide-react';

export default function SmartCollectionsList() {
  const store = getSmartCollectionsStore();
  const [state, setState] = useState<SmartCollectionsState>(store.getState());
  const [showEditor, setShowEditor] = useState(false);
  const [editingCollection, setEditingCollection] = useState<SmartCollection | null>(null);
  const [collectionDocuments, setCollectionDocuments] = useState<Document[]>([]);

  useEffect(() => {
    const unsubscribe = store.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, [store]);

  useEffect(() => {
    if (state.selectedCollectionId) {
      const docs = store.getCollectionDocuments(state.selectedCollectionId);
      setCollectionDocuments(docs);
    } else {
      setCollectionDocuments([]);
    }
  }, [state.selectedCollectionId, store]);

  const handleNewCollection = () => {
    setEditingCollection(null);
    setShowEditor(true);
  };

  const handleEditCollection = (collection: SmartCollection) => {
    setEditingCollection(collection);
    setShowEditor(true);
  };

  const handleDeleteCollection = (id: string) => {
    if (confirm('Bu akıllı koleksiyonu silmek istediğinizden emin misiniz?')) {
      store.dispatch({ type: 'DELETE_COLLECTION', payload: id });
    }
  };

  const handleSelectCollection = (id: string) => {
    store.dispatch({ type: 'SELECT_COLLECTION', payload: id });
  };

  const selectedCollection = state.selectedCollectionId
    ? store.getCollectionById(state.selectedCollectionId)
    : null;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Akıllı Koleksiyonlar</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {state.collections.length}
            </span>
          </div>
          <button
            onClick={handleNewCollection}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Yeni Koleksiyon
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Koleksiyon ara..."
            value={state.searchQuery}
            onChange={(e) => store.dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Collections List */}
        <div className="w-64 border-r border-gray-200 overflow-y-auto">
          {state.collections.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>Henüz koleksiyon yok</p>
              <p className="text-xs mt-1">Yeni bir akıllı koleksiyon oluşturun</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {state.collections
                .filter(c =>
                  !state.searchQuery ||
                  c.name.toLowerCase().includes(state.searchQuery.toLowerCase())
                )
                .map(collection => (
                  <div
                    key={collection.id}
                    className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      state.selectedCollectionId === collection.id
                        ? 'bg-indigo-50 border border-indigo-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                    onClick={() => handleSelectCollection(collection.id)}
                  >
                    <span className="text-lg">{collection.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {collection.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {store.getCollectionDocumentCount(collection.id)} doküman
                      </div>
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCollection(collection);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Edit3 className="w-3 h-3 text-gray-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCollection(collection.id);
                        }}
                        className="p-1 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-3 h-3 text-gray-500 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Documents List */}
        <div className="flex-1 overflow-y-auto">
          {selectedCollection ? (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{selectedCollection.icon}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedCollection.name}
                  </h3>
                  {selectedCollection.description && (
                    <p className="text-sm text-gray-500">
                      {selectedCollection.description}
                    </p>
                  )}
                </div>
              </div>

              {collectionDocuments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p>Bu koleksiyona uyan doküman bulunamadı</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {collectionDocuments.map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {doc.title}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {doc.status}
                          </span>
                          <span>{doc.wordCount} kelime</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(doc.lastModified).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </div>
                      {doc.pov && (
                        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                          POV: {doc.pov}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-sm">Bir koleksiyon seçin</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      <SmartCollectionEditor
        collection={editingCollection}
        isOpen={showEditor}
        onClose={() => {
          setShowEditor(false);
          setEditingCollection(null);
        }}
      />
    </div>
  );
}
