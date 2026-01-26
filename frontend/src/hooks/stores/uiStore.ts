import { create } from 'zustand';

/**
 * UI 状态接口
 * 管理 UI 相关的临时状态，不需要持久化
 */
export interface UIState {
  // 加载状态
  isLoading: boolean;

  // 错误信息
  error: string | null;

  // 侧边栏状态
  sidebarOpen: boolean;

  // 声音库模态框状态
  voiceLibraryOpen: boolean;

  // 快捷键帮助弹窗状态
  shortcutsHelpOpen: boolean;

  // 语言选择状态（二级联动）
  selectedLanguage: string;

  // 语言映射表
  languageMap: Map<string, any[]>;

  // 收藏声音列表
  favoriteVoices: any[];

  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setSidebarOpen: (open: boolean) => void;
  setVoiceLibraryOpen: (open: boolean) => void;
  setShortcutsHelpOpen: (open: boolean) => void;
  setSelectedLanguage: (language: string) => void;
  setLanguageMap: (map: Map<string, any[]>) => void;
  setFavoriteVoices: (voices: any[]) => void;

  // 切换方法
  toggleSidebar: () => void;
  toggleVoiceLibrary: () => void;
  toggleShortcutsHelp: () => void;
}

/**
 * UI 状态 Store
 *
 * 职责：
 * - 管理 UI 状态（加载、错误、模态框等）
 * - 管理侧边栏和弹窗状态
 * - 管理语言选择和映射表
 *
 * 注意：
 * - 不持久化到 localStorage（临时状态）
 * - 页面刷新后状态重置
 */
export const useUIStore = create<UIState>((set) => ({
  // Initial state
  isLoading: false,
  error: null,
  sidebarOpen: false,
  voiceLibraryOpen: false,
  shortcutsHelpOpen: false,
  selectedLanguage: '',
  languageMap: new Map(),
  favoriteVoices: [],

  // Actions
  setLoading: (loading: boolean) => set({ isLoading: loading }),

  setError: (error: string | null) => set({ error }),

  clearError: () => set({ error: null }),

  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

  setVoiceLibraryOpen: (open: boolean) => set({ voiceLibraryOpen: open }),

  setShortcutsHelpOpen: (open: boolean) => set({ shortcutsHelpOpen: open }),

  setSelectedLanguage: (language: string) => set({ selectedLanguage: language }),

  setLanguageMap: (map: Map<string, any[]>) => set({ languageMap: map }),

  setFavoriteVoices: (voices: any[]) => set({ favoriteVoices: voices }),

  // Toggle methods
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  toggleVoiceLibrary: () => set((state) => ({ voiceLibraryOpen: !state.voiceLibraryOpen })),

  toggleShortcutsHelp: () => set((state) => ({ shortcutsHelpOpen: !state.shortcutsHelpOpen })),
}));

// ========== 选择器 Hooks ==========

/**
 * 选择加载状态
 */
export const useIsLoading = () => useUIStore((state) => state.isLoading);

/**
 * 选择错误信息
 */
export const useError = () => useUIStore((state) => state.error);

/**
 * 选择模态框状态
 */
export const useModalStates = () => useUIStore((state) => ({
  voiceLibraryOpen: state.voiceLibraryOpen,
  shortcutsHelpOpen: state.shortcutsHelpOpen,
  sidebarOpen: state.sidebarOpen,
}));

/**
 * 选择语言相关状态
 */
export const useLanguageState = () => useUIStore((state) => ({
  selectedLanguage: state.selectedLanguage,
  languageMap: state.languageMap,
}));

/**
 * 选择收藏声音列表
 */
export const useFavoriteVoices = () => useUIStore((state) => state.favoriteVoices);

/**
 * 选择 UI actions
 */
export const useUIActions = () => useUIStore((state) => ({
  setLoading: state.setLoading,
  setError: state.setError,
  clearError: state.clearError,
  setSidebarOpen: state.setSidebarOpen,
  setVoiceLibraryOpen: state.setVoiceLibraryOpen,
  setShortcutsHelpOpen: state.setShortcutsHelpOpen,
  setSelectedLanguage: state.setSelectedLanguage,
  setLanguageMap: state.setLanguageMap,
  setFavoriteVoices: state.setFavoriteVoices,
  toggleSidebar: state.toggleSidebar,
  toggleVoiceLibrary: state.toggleVoiceLibrary,
  toggleShortcutsHelp: state.toggleShortcutsHelp,
}));
