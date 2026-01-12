import { create } from 'zustand';
import type { AudioState } from '../../types';
import { audioManager } from '../../utils/audioResourceManager';

/**
 * 音频状态接口
 * 管理音频播放相关的临时状态，不需要持久化
 */
interface AudioStateStore {
  // 音频 URL
  audioUrl: string | null;

  // 当前播放项 ID
  currentPlayingId: string | null;

  // 音频播放状态
  audioState: AudioState;

  // 自动播放标志
  shouldAutoPlay: boolean;

  // Actions
  setAudioUrl: (url: string | null) => void;
  setCurrentPlayingId: (id: string | null) => void;
  setAudioState: (state: Partial<AudioState>) => void;
  setShouldAutoPlay: (should: boolean) => void;

  // 播放控制
  play: () => void;
  pause: () => void;
  stop: () => void;

  // 清理
  cleanup: () => void;
  cleanupOld: () => void; // 清理旧资源但保留当前
}

/**
 * 初始音频状态
 */
const initialAudioState: AudioState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1.0,
};

/**
 * 音频状态 Store
 *
 * 职责：
 * - 管理音频播放状态
 * - 管理当前播放项
 * - 提供播放控制方法
 *
 * 注意：
 * - 不持久化到 localStorage（临时状态）
 * - 页面刷新后状态丢失
 */
export const useAudioStore = create<AudioStateStore>((set, get) => ({
  // Initial state
  audioUrl: null,
  currentPlayingId: null,
  audioState: initialAudioState,
  shouldAutoPlay: false,

  // Actions
  setAudioUrl: (url: string | null) => {
    // 如果是 Blob URL，使用音频资源管理器创建
    set({ audioUrl: url });
  },

  setCurrentPlayingId: (id: string | null) => set({ currentPlayingId: id }),

  setAudioState: (newState: Partial<AudioState>) =>
    set((state) => ({
      audioState: { ...state.audioState, ...newState },
    })),

  setShouldAutoPlay: (should: boolean) => set({ shouldAutoPlay: should }),

  // 播放控制
  play: () =>
    set((state) => ({
      audioState: { ...state.audioState, isPlaying: true },
    })),

  pause: () =>
    set((state) => ({
      audioState: { ...state.audioState, isPlaying: false },
    })),

  stop: () =>
    set({
      audioState: initialAudioState,
      currentPlayingId: null,
    }),

  // 清理音频资源
  cleanup: () => {
    const { audioUrl } = get();

    // 使用音频资源管理器释放 Blob URL
    if (audioUrl && audioUrl.startsWith('blob:')) {
      audioManager.revokeBlobUrl(audioUrl);
    }

    // 重置状态
    set({
      audioUrl: null,
      currentPlayingId: null,
      audioState: initialAudioState,
      shouldAutoPlay: false,
    });
  },

  // 清理旧的音频资源（但保留当前正在播放的）
  cleanupOld: () => {
    const { audioUrl } = get();

    // 清理所有资源，但保留当前正在使用的
    audioManager.cleanupExpired();

    // 如果当前音频是 Blob URL，更新其访问时间
    if (audioUrl && audioUrl.startsWith('blob:')) {
      audioManager.getAudioResource(audioUrl);
    }
  },
}));

// ========== 选择器 Hooks ==========

/**
 * 选择当前音频 URL
 */
export const useAudioUrl = () => useAudioStore((state) => state.audioUrl);

/**
 * 选择当前播放项 ID
 */
export const useCurrentPlayingId = () => useAudioStore((state) => state.currentPlayingId);

/**
 * 选择音频播放状态
 */
export const useAudioState = () => useAudioStore((state) => state.audioState);

/**
 * 选择是否正在播放
 */
export const useIsPlaying = () => useAudioStore((state) => state.audioState.isPlaying);

/**
 * 选择音频相关 actions
 */
export const useAudioActions = () => useAudioStore((state) => ({
  setAudioUrl: state.setAudioUrl,
  setCurrentPlayingId: state.setCurrentPlayingId,
  setAudioState: state.setAudioState,
  setShouldAutoPlay: state.setShouldAutoPlay,
  play: state.play,
  pause: state.pause,
  stop: state.stop,
  cleanup: state.cleanup,
  cleanupOld: state.cleanupOld,
}));
