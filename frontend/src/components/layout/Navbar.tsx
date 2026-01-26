import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTTSStore } from '../../hooks/useTTSStore';
import { FavoritesService } from '../../services/favorites';
import type { FavoriteVoiceItem } from '../../types/index';

interface NavbarProps {
  // 不再需要 showShortcutsHelp prop
}

export const Navbar: React.FC<NavbarProps> = () => {
  const location = useLocation();
  const { voices } = useTTSStore();
  const [favoriteCount, setFavoriteCount] = useState(0);

  const loadFavoriteVoices = useCallback(() => {
    const favorites = FavoritesService.getFavorites();
    setFavoriteCount(favorites.length);
  }, []);

  useEffect(() => {
    loadFavoriteVoices();
  }, [loadFavoriteVoices]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {/* Logo和标题 */}
            <Link to="/" className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/50">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-100 font-mono">TTS Studio</h1>
                <p className="text-xs text-gray-500 hidden sm:block font-mono">AI 文本转语音</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            {/* 首页按钮 */}
            <Link
              to="/"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                isActive('/')
                  ? 'text-green-400 bg-green-500/10 border border-green-500/30'
                  : 'text-gray-400 hover:text-green-400 hover:bg-gray-800 border border-transparent'
              }`}
              title="主页"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="hidden sm:inline font-mono">主页</span>
            </Link>

            {/* 声音库按钮 */}
            <Link
              to="/voices"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                isActive('/voices')
                  ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-cyan-400 hover:bg-gray-800 border border-transparent'
              }`}
              title="声音库"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="hidden sm:inline font-mono">声音库</span>
            </Link>

            {/* 收藏管理按钮 */}
            <Link
              to="/favorites"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium relative ${
                isActive('/favorites')
                  ? 'text-orange-400 bg-orange-500/10 border border-orange-500/30'
                  : 'text-gray-400 hover:text-orange-400 hover:bg-gray-800 border border-transparent'
              }`}
              title="收藏管理"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <span className="hidden sm:inline font-mono">收藏</span>
            </Link>

            {/* 文本模板按钮 */}
            <Link
              to="/templates"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                isActive('/templates')
                  ? 'text-purple-400 bg-purple-500/10 border border-purple-500/30'
                  : 'text-gray-400 hover:text-purple-400 hover:bg-gray-800 border border-transparent'
              }`}
              title="文本模板"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z" />
              </svg>
              <span className="hidden sm:inline font-mono">文本模板</span>
            </Link>

            {/* 设置按钮 */}
            <Link
              to="/settings"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                isActive('/settings')
                  ? 'text-gray-300 bg-gray-700 border border-gray-600'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800 border border-transparent'
              }`}
              title="设置"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline font-mono">设置</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
