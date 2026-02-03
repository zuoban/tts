import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { FavoritesService } from '../services/favorites';
import { useTTSStore } from '../hooks/useTTSStore';
import type { FavoriteVoiceItem } from '../types/index';
import ConfirmModal from '../components/ui/ConfirmModal';
import { Navbar } from '../components/layout/Navbar';
import { Button } from '../components/ui/Button';
import { showSuccess, showWarning, showInfo } from '../components/ui/Toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faTrash, faGripVertical, faPlay } from '@fortawesome/free-solid-svg-icons';

export default function Favorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteVoiceItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [removingFavorite, setRemovingFavorite] = useState<FavoriteVoiceItem | null>(null);

  const { setVoice, setStyle, setRate, setPitch, setLocale } = useTTSStore();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = () => {
    const loadedFavorites = FavoritesService.getFavorites()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    setFavorites(loadedFavorites);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const reordered = [...favorites];
    const [removed] = reordered.splice(sourceIndex, 1);
    reordered.splice(destinationIndex, 0, removed);

    setFavorites(reordered);

    const success = FavoritesService.reorderFavorites(sourceIndex, destinationIndex);
    if (success) showSuccess('顺序已更新');
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
        showWarning(`已移除收藏: ${removingFavorite.localName || removingFavorite.name}`);
        loadFavorites();
      }
    }
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
    showSuccess(`已选择: ${favorite.localName || favorite.name}`);
    setTimeout(() => navigate('/'), 300);
  };

  const confirmClearAll = () => {
    FavoritesService.clearFavorites();
    showInfo('已清空所有收藏');
    loadFavorites();
    setClearConfirmOpen(false);
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      <main className="container max-w-4xl mx-auto px-4 py-6 sm:py-10 lg:py-12">
        <div className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">收藏管理</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              管理您的收藏声音 <span className="text-primary/50 mx-2">/</span> {favorites.length} 个项目
            </p>
          </div>

          {favorites.length > 0 && (
            <Button variant="destructive" size="sm" className="w-full sm:w-auto" onClick={() => setClearConfirmOpen(true)}>
              清空所有
            </Button>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm min-h-[320px] p-4 sm:p-6">
          {favorites.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-16 sm:py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <FontAwesomeIcon icon={faStar} className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <div>
                <h3 className="text-lg font-medium">暂无收藏</h3>
                <p className="text-muted-foreground text-sm">
                  在声音库中点击星星图标添加收藏
                </p>
              </div>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="favorites-list">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 sm:space-y-4">
                    {favorites.map((favorite, index) => (
                      <Draggable key={favorite.id} draggableId={favorite.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            onClick={() => handleSelect(favorite)}
                            className={`
                              group relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border cursor-pointer transition-all
                              ${snapshot.isDragging ? 'shadow-xl z-50 bg-card' : ''}
                              ${selectedId === favorite.id 
                                ? 'bg-primary/5 border-primary' 
                                : 'bg-card border-border hover:border-primary/50 hover:bg-accent/50'}
                            `}
                            style={provided.draggableProps.style}
                          >
                            {/* Drag Handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing p-1"
                            >
                              <FontAwesomeIcon icon={faGripVertical} />
                            </div>

                            {/* Icon */}
                            <div className={`
                              w-9 h-9 sm:w-10 sm:h-10 rounded-md flex items-center justify-center text-base sm:text-lg font-bold
                              ${favorite.gender === 'Female' 
                                ? 'bg-pink-500/10 text-pink-500' 
                                : 'bg-blue-500/10 text-blue-500'}
                            `}>
                              {(favorite.localName || favorite.name).charAt(0)}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-medium truncate ${selectedId === favorite.id ? 'text-primary' : 'text-foreground'}`}>
                                {favorite.localName || favorite.name}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                                  {favorite.locale}
                                </span>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  favorite.gender === 'Female' ? 'bg-pink-500/10 text-pink-500' : 'bg-blue-500/10 text-blue-500'
                                }`}>
                                  {favorite.gender === 'Female' ? '女声' : '男声'}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                               <Button variant="ghost" size="icon" onClick={(e) => handleRemove(e, favorite)} className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-destructive">
                                  <FontAwesomeIcon icon={faTrash} />
                               </Button>
                               <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 text-primary hover:bg-primary/10">
                                  <FontAwesomeIcon icon={faPlay} />
                               </Button>
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
      </main>

      <ConfirmModal
        isOpen={removeConfirmOpen}
        title="移除收藏"
        message={`确定要移除收藏：${removingFavorite?.localName || removingFavorite?.name}？`}
        confirmText="移除"
        cancelText="取消"
        type="danger"
        onConfirm={confirmRemove}
        onCancel={() => setRemoveConfirmOpen(false)}
      />

      <ConfirmModal
        isOpen={clearConfirmOpen}
        title="清空收藏"
        message="确定要清空所有收藏吗？此操作不可恢复。"
        confirmText="清空"
        cancelText="取消"
        type="danger"
        onConfirm={confirmClearAll}
        onCancel={() => setClearConfirmOpen(false)}
      />
    </div>
  );
}
