import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Voice, Config, HistoryItem } from '../../types';
import { STORAGE_KEYS } from '../../types';

/**
 * 数据状态接口
 * 管理应用数据（声音列表、配置、历史记录）
 */
interface DataState {
  // 声音列表
  voices: Voice[];

  // 风格列表（所有可用风格的去重集合）
  styles: string[];

  // 服务配置
  config: Config | null;

  // 历史记录
  history: HistoryItem[];

  // 初始化状态
  isInitialized: boolean;
  isInitializing: boolean;

  // Actions
  setVoices: (voices: Voice[]) => void;
  setStyles: (styles: string[]) => void;
  setConfig: (config: Config) => void;
  setIsInitialized: (initialized: boolean) => void;
  setIsInitializing: (initializing: boolean) => void;

  // 历史记录 actions
  addToHistory: (item: HistoryItem) => void;
  removeFromHistory: (id: string) => void;
  updateHistoryItem: (id: string, updates: Partial<HistoryItem>) => void;
  clearHistory: () => void;

  // 获取单个历史记录
  getHistoryItem: (id: string) => HistoryItem | undefined;
}

/**
 * 最大历史记录数量
 */
const MAX_HISTORY_SIZE = 50;

/**
 * 数据状态 Store
 *
 * 职责：
 * - 管理声音列表和配置
 * - 管理历史记录
 * - 持久化到 localStorage
 *
 * 持久化策略：
 * - voices: 不持久化（从 API 获取）
 * - config: 不持久化（从 API 获取）
 * - history: 持久化（用户生成数据）
 */
export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      // Initial state
      voices: [],
      styles: [],
      config: null,
      history: [],
      isInitialized: false,
      isInitializing: false,

      // Actions
      setVoices: (voices: Voice[]) => {
        set({ voices });

        // 自动提取并更新风格列表
        const uniqueStyles = Array.from(
          new Set(voices.flatMap((voice) => voice.styles || []))
        );
        set({ styles: uniqueStyles });
      },

      setStyles: (styles: string[]) => set({ styles }),

      setConfig: (config: Config) => set({ config }),

      setIsInitialized: (initialized: boolean) =>
        set({ isInitialized: initialized }),

      setIsInitializing: (initializing: boolean) =>
        set({ isInitializing: initializing }),

      // 历史记录 actions
      addToHistory: (item: HistoryItem) => {
        const state = get();

        // 检查是否存在相同的记录
        const existingIndex = state.history.findIndex(
          (existingItem) =>
            existingItem.text.trim() === item.text.trim() &&
            existingItem.voice === item.voice &&
            existingItem.style === item.style &&
            existingItem.rate === item.rate &&
            existingItem.pitch === item.pitch &&
            existingItem.locale === item.locale
        );

        if (existingIndex !== -1) {
          // 如果存在重复记录，将其移到顶部并更新
          const existingItem = state.history[existingIndex];
          const updatedItem = {
            ...existingItem,
            audioUrl: item.audioUrl,
            createdAt: new Date(),
          };

          set((prevState) => {
            const newHistory = [...prevState.history];
            newHistory.splice(existingIndex, 1);
            newHistory.unshift(updatedItem);
            return {
              history: newHistory.slice(0, MAX_HISTORY_SIZE).map((h) => ({
                ...h,
                createdAt: new Date(h.createdAt),
              })),
            };
          });
          return;
        }

        // 如果没有重复记录，正常添加
        set((prevState) => ({
          history: [item, ...prevState.history]
            .slice(0, MAX_HISTORY_SIZE)
            .map((h) => ({
              ...h,
              createdAt: new Date(h.createdAt),
            })),
        }));
      },

      removeFromHistory: (id: string) =>
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        })),

      updateHistoryItem: (id: string, updates: Partial<HistoryItem>) =>
        set((state) => ({
          history: state.history.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),

      clearHistory: () => set({ history: [] }),

      // 获取单个历史记录
      getHistoryItem: (id: string) => {
        const state = get();
        return state.history.find((item) => item.id === id);
      },
    }),
    {
      name: STORAGE_KEYS.DATA_STORE || 'tts-data-store',
      storage: createJSONStorage(() => localStorage),

      // 只持久化历史记录
      partialize: (state) => ({
        history: state.history,
      }),

      // 版本管理
      version: 1,

      // 数据迁移
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // 从旧的 tts-store 迁移历史记录
          const oldState = persistedState as any;
          return {
            history: oldState.history || [],
            voices: [],
            styles: [],
            config: null,
            isInitialized: false,
            isInitializing: false,
          };
        }
        return persistedState;
      },

      // 在 hydration 时恢复日期对象
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 将日期字符串转换为 Date 对象
          state.history = state.history.map((item) => ({
            ...item,
            createdAt: new Date(item.createdAt),
          }));
        }
      },
    }
  )
);

// ========== 选择器 Hooks ==========

/**
 * 选择声音列表
 */
export const useVoices = () => useDataStore((state) => state.voices);

/**
 * 选择风格列表
 */
export const useStyles = () => useDataStore((state) => state.styles);

/**
 * 选择服务配置
 */
export const useConfig = () => useDataStore((state) => state.config);

/**
 * 选择历史记录
 */
export const useHistory = () => useDataStore((state) => state.history);

/**
 * 选择初始化状态
 */
export const useInitState = () => useDataStore((state) => ({
  isInitialized: state.isInitialized,
  isInitializing: state.isInitializing,
}));

/**
 * 选择历史记录 actions
 */
export const useHistoryActions = () => useDataStore((state) => ({
  addToHistory: state.addToHistory,
  removeFromHistory: state.removeFromHistory,
  updateHistoryItem: state.updateHistoryItem,
  clearHistory: state.clearHistory,
  getHistoryItem: state.getHistoryItem,
}));

/**
 * 选择数据 actions
 */
export const useDataActions = () => useDataStore((state) => ({
  setVoices: state.setVoices,
  setStyles: state.setStyles,
  setConfig: state.setConfig,
  setIsInitialized: state.setIsInitialized,
  setIsInitializing: state.setIsInitializing,
}));
