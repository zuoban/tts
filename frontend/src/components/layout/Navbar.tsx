import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTTSStore } from '../../hooks/useTTSStore';
import { FavoritesService } from '../../services/favorites';
import { cn } from '../../utils/utils'; // Assuming utils exists, or I will create a helper function inline or use standard className

interface NavbarProps {}

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

  const NavItem = ({ to, icon, label, activeColorClass = "text-primary bg-primary/10" }: { to: string, icon: React.ReactNode, label: string, activeColorClass?: string }) => (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-2 rounded-md transition-all text-xs sm:text-sm font-medium sm:gap-2 sm:px-3 whitespace-nowrap",
        isActive(to)
          ? activeColorClass
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
      title={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center">
            {/* Logo and Title */}
            <Link to="/" className="flex items-center space-x-2 mr-6">
              <div className="h-6 w-6 bg-primary rounded-md flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <span className="font-bold text-lg hidden sm:inline-block">TTS Studio</span>
            </Link>
          </div>

          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar -mx-2 px-2">
            <NavItem 
                to="/" 
                label="主页" 
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
            />
             <NavItem 
                to="/voices" 
                label="声音库" 
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
            />
             <NavItem 
                to="/favorites" 
                label="收藏" 
                icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
            />
             <NavItem 
                to="/templates" 
                label="模板" 
                icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z" /></svg>}
            />
             <NavItem 
                to="/settings" 
                label="设置" 
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
