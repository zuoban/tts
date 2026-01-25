import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { FavoritesService } from '../services/favorites';
import { useTTSStore } from '../hooks/useTTSStore';
import type { FavoriteVoiceItem } from '../types/index';
import ConfirmModal from '../components/ui/ConfirmModal';
import { Navbar } from '../components/layout/Navbar';
import { showSuccess, showWarning, showInfo } from '../components/ui/Toast';

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
      showSuccess('顺序已更新');
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
        showWarning(`已移除收藏: ${removingFavorite.localName || removingFavorite.name}`);
        loadFavorites();
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

    showSuccess(`已选择收藏声音: ${favorite.localName || favorite.name}`);

    // 短暂延迟后跳转，让用户看到选中效果
    setTimeout(() => {
        navigate('/');
    }, 300);
  };

  const handleClearAll = () => {
    setClearConfirmOpen(true);
  };

  const confirmClearAll = () => {
    FavoritesService.clearFavorites();
    showInfo('已清空所有收藏');
    loadFavorites();
    setClearConfirmOpen(false);
  };

  const cancelClearAll = () => {
    setClearConfirmOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden font-sans selection:bg-green-500/30">
      {/* 动态背景网格 - 与 Home 保持一致 */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
            backgroundImage: `
                linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px),
                linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* 装饰性光晕 */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none translate-y-1/2"></div>

      <div className="relative z-10">
        <Navbar />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 头部区域 */}
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="relative group">
               {/* 装饰线条 */}
               <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
               
               <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 tracking-tight mb-2">
                 收藏管理
               </h1>
               <p className="text-gray-400 font-mono text-sm tracking-wide">
                 管理您的收藏声音 <span className="text-green-500/50">///</span> {favorites.length} 个项目
               </p>
            </div>

            {favorites.length > 0 && (
              <button
                onClick={handleClearAll}
                className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40 transition-all duration-300 backdrop-blur-sm"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-sm font-medium">清空所有</span>
              </button>
            )}
          </div>

          {/* 列表区域 */}
          <div className="relative min-h-[400px]">
             {/* 背景层 - 负责样式 */}
             <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-gray-800/50 shadow-2xl pointer-events-none"></div>

             {/* 内容层 - 负责交互 */}
             <div className="relative z-10 p-6">
            {favorites.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 mb-6 rounded-full bg-gray-800/50 flex items-center justify-center relative group">
                  <div className="absolute inset-0 rounded-full bg-green-500/20 animate-pulse"></div>
                  <svg className="w-10 h-10 text-gray-500 group-hover:text-green-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-200 mb-2 font-mono">暂无数据</h3>
                <p className="text-gray-500 max-w-xs mx-auto">
                  暂无收藏声音。在声音库中点击 <span className="text-yellow-500">★</span> 图标添加。
                </p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="favorites-list">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="flex flex-col gap-3"
                    >
                      {favorites.map((favorite, index) => (
                        <Draggable key={favorite.id} draggableId={favorite.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              onClick={() => handleSelect(favorite)}
                                className={`
                                group relative flex items-center gap-4 p-4 rounded-xl border cursor-pointer overflow-hidden
                                ${snapshot.isDragging ? 'shadow-2xl ring-1 ring-green-500/50 z-50 bg-gray-800' : 'transition-all duration-300'}
                                ${selectedId === favorite.id
                                  ? 'bg-green-500/10 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.1)]' 
                                  : 'bg-gray-800/40 border-gray-700/50 hover:bg-gray-800/80 hover:border-gray-600 hover:shadow-lg hover:shadow-black/20'
                                }
                              `}
                              style={{
                                ...provided.draggableProps.style,
                                // 拖拽时必须禁用 transition，否则会导致位置更新滞后
                                transition: snapshot.isDragging ? 'none' : provided.draggableProps.style?.transition,
                              }}
                            >
                              {/* 背景装饰：扫描线效果 */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>

                              {/* 拖拽手柄 */}
                              <div
                                {...provided.dragHandleProps}
                                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded text-gray-600 group-hover:text-gray-400 hover:bg-gray-700/50 transition-colors cursor-grab active:cursor-grabbing"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                                </svg>
                              </div>

                              {/* 头像/图标 */}
                              <div className={`
                                flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold shadow-inner relative overflow-hidden
                                ${favorite.gender === 'Female' 
                                  ? 'bg-gradient-to-br from-pink-500/20 to-rose-600/20 text-pink-400 border border-pink-500/30' 
                                  : 'bg-gradient-to-br from-blue-500/20 to-cyan-600/20 text-blue-400 border border-blue-500/30'
                                }
                              `}>
                                <div className="absolute inset-0 bg-noise opacity-20"></div>
                                {(favorite.localName || favorite.name).charAt(0)}
                              </div>

                              {/* 信息区域 */}
                              <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                                <div className="min-w-0">
                                  <h3 className={`font-medium text-lg truncate transition-colors ${selectedId === favorite.id ? 'text-green-400' : 'text-gray-200 group-hover:text-white'}`}>
                                    {favorite.localName || favorite.name}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-1 md:hidden">
                                    <span className="text-xs font-mono text-gray-500">{favorite.locale}</span>
                                  </div>
                                </div>

                                <div className="hidden md:flex items-center gap-3 ml-auto mr-4">
                                  {/* 区域标签 */}
                                  <div className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-gray-800 border border-gray-700 text-gray-400">
                                    {favorite.localeName || favorite.locale}
                                  </div>
                                  
                                  {/* 性别标签 */}
                                  <div className={`
                                    px-2.5 py-0.5 rounded-full text-xs font-medium border
                                    ${favorite.gender === 'Female' 
                                      ? 'bg-pink-500/10 border-pink-500/20 text-pink-400' 
                                      : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                    }
                                  `}>
                                    {favorite.gender === 'Female' ? '女声' : '男声'}
                                  </div>
                                </div>
                              </div>

                              {/* 操作按钮组 */}
                              <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                  onClick={(e) => handleRemove(e, favorite)}
                                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-transparent hover:bg-red-500/10 hover:border-red-500/30 text-gray-500 hover:text-red-400 transition-all duration-200"
                                  title="移除收藏"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                  </svg>
                                </button>
                                
                                <button
                                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500/20 hover:border-green-500/40 transition-all duration-200 shadow-[0_0_10px_rgba(34,197,94,0.1)] hover:shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                                  title="使用此声音"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
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
        </main>
      </div>

      <ConfirmModal
        isOpen={removeConfirmOpen}
        title="移除收藏"
        message={`确定要移除收藏：${removingFavorite?.localName || removingFavorite?.name}？`}
        confirmText="确认移除"
        cancelText="取消"
        type="danger"
        onConfirm={confirmRemove}
        onCancel={cancelRemove}
      />

      <ConfirmModal
        isOpen={clearConfirmOpen}
        title="清空收藏"
        message="确定要清空所有收藏吗？此操作不可恢复。"
        confirmText="确认清空"
        cancelText="取消"
        type="danger"
        onConfirm={confirmClearAll}
        onCancel={cancelClearAll}
      />
    </div>
  );
}
