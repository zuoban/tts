import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { FavoritesService } from '../../services/favorites';
import { useTTSStore } from '../../hooks/useTTSStore';
import type { FavoriteVoiceItem } from '../../types/index';
import ConfirmModal from '../ui/ConfirmModal';

interface FavoritesManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVoice?: (favorite: FavoriteVoiceItem) => void;
  onFavoritesChange?: () => void;
}

const FavoritesManager: React.FC<FavoritesManagerProps> = ({
  isOpen,
  onClose,
  onSelectVoice,
  onFavoritesChange,
}) => {
  const [favorites, setFavorites] = useState<FavoriteVoiceItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [removingFavorite, setRemovingFavorite] = useState<FavoriteVoiceItem | null>(null);

  const { setVoice, setStyle, setRate, setPitch, setLocale } = useTTSStore();

  useEffect(() => {
    if (isOpen) {
      loadFavorites();
    }
  }, [isOpen]);

  const loadFavorites = () => {
    const loadedFavorites = FavoritesService.getFavorites()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    setFavorites(loadedFavorites);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) {
      return;
    }

    const reordered = [...favorites];
    const [removed] = reordered.splice(sourceIndex, 1);
    reordered.splice(destinationIndex, 0, removed);

    setFavorites(reordered);

    const success = FavoritesService.reorderFavorites(sourceIndex, destinationIndex);
    if (success) {
      const message = document.createElement('div');
      message.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm animate-pulse';
      message.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>顺序已更新</span>
        </div>
      `;
      document.body.appendChild(message);
      setTimeout(() => message.remove(), 2000);
    }
  };

  const handleRemove = (e: React.MouseEvent, favorite: FavoriteVoiceItem) => {
    e.stopPropagation();
    setRemovingFavorite(favorite);
    setRemoveConfirmOpen(true);
  };

  const confirmRemove = () => {
    if (removingFavorite) {
      const result = FavoritesService.removeFromFavorites(removingFavorite.id);

      if (result) {
        const message = document.createElement('div');
        message.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm animate-pulse';
        message.innerHTML = `
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>已移除收藏: ${removingFavorite.localName || removingFavorite.name}</span>
          </div>
        `;
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 2000);

        loadFavorites();
        onFavoritesChange?.();
      } else {
        console.error('移除收藏失败');
      }
    }
    setRemoveConfirmOpen(false);
    setRemovingFavorite(null);
  };

  const cancelRemove = () => {
    setRemoveConfirmOpen(false);
    setRemovingFavorite(null);
  };

  const handleSelect = (favorite: FavoriteVoiceItem) => {
    setSelectedId(favorite.id);

    setVoice(favorite.id);
    setStyle('');
    setRate('0');
    setPitch('0');
    setLocale(favorite.locale);

    localStorage.setItem('tts_current_locale', favorite.locale);

    if (onSelectVoice) {
      onSelectVoice(favorite);
    } else {
      const message = document.createElement('div');
      message.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm animate-pulse';
      message.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>已选择收藏声音: ${favorite.localName || favorite.name}</span>
        </div>
      `;
      document.body.appendChild(message);
      setTimeout(() => message.remove(), 2000);
    }

    onClose();
  };

  const handleClearAll = () => {
    setClearConfirmOpen(true);
  };

  const confirmClearAll = () => {
    FavoritesService.clearFavorites();

    const message = document.createElement('div');
    message.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm';
    message.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>已清空所有收藏</span>
      </div>
    `;
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 2000);

    loadFavorites();
    onFavoritesChange?.();
    setClearConfirmOpen(false);
  };

  const cancelClearAll = () => {
    setClearConfirmOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[65] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                收藏管理
              </h2>
              <p className="text-yellow-100 mt-1">
                拖动调整顺序，管理您收藏的声音（共 {favorites.length} 个）
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-4 flex justify-end">
            {favorites.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                清空
              </button>
            )}
          </div>

          {favorites.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无收藏</h3>
              <p className="text-gray-500">在声音库中点击星星图标添加收藏</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="favorites-list">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-1.5"
                  >
                    {favorites.map((favorite, index) => (
                      <Draggable key={favorite.id} draggableId={favorite.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            onClick={() => handleSelect(favorite)}
                            className={`group flex items-center gap-3 px-3 py-2.5 border rounded-lg cursor-pointer transition-all duration-200 ${
                              selectedId === favorite.id
                                ? 'bg-yellow-50 border-yellow-300 ring-2 ring-yellow-200'
                                : 'bg-white border-gray-200 hover:border-yellow-300 hover:shadow-md'
                            } ${snapshot.isDragging ? 'shadow-xl opacity-80 ring-2 ring-yellow-300' : ''}`}
                          >
                            <div
                              {...provided.dragHandleProps}
                              className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                              </svg>
                            </div>

                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                              favorite.gender === 'Female' ? 'bg-gradient-to-br from-pink-400 to-pink-600' : 'bg-gradient-to-br from-blue-400 to-blue-600'
                            }`}>
                              {(favorite.localName || favorite.name).charAt(0)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-sm truncate">
                                {favorite.localName || favorite.name}
                              </h3>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-xs text-gray-600">{favorite.localeName || favorite.locale}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                  favorite.gender === 'Female'
                                    ? 'bg-pink-100 text-pink-700 border border-pink-200'
                                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                                }`}>
                                  {favorite.gender === 'Female' ? '女声' : '男声'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => handleRemove(e, favorite)}
                                className="flex items-center justify-center w-7 h-7 bg-red-50 border border-red-200 text-red-600 rounded hover:bg-red-100 hover:border-red-300 transition-all duration-200"
                                title="移除收藏"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                              <button className="flex items-center justify-center w-7 h-7 bg-green-50 border border-green-200 text-green-600 rounded hover:bg-green-100 hover:border-green-300 transition-all duration-200" title="选择此声音">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
           )}
         </div>
       </div>

      <ConfirmModal
        isOpen={removeConfirmOpen}
        title="移除收藏"
        message={`确定要移除收藏：${removingFavorite?.localName || removingFavorite?.name}？`}
        confirmText="移除"
        cancelText="取消"
        type="danger"
        onConfirm={confirmRemove}
        onCancel={cancelRemove}
      />

      <ConfirmModal
        isOpen={clearConfirmOpen}
        title="清空"
        message="确定要清空所有收藏吗？此操作不可恢复。"
        confirmText="清空"
        cancelText="取消"
        type="danger"
        onConfirm={confirmClearAll}
        onCancel={cancelClearAll}
      />
     </div>
   );
 };

export default FavoritesManager;
