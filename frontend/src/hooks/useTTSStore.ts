import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '../types';
import type { Voice, TTSState, Config, AudioState, HistoryItem } from '../types/index';
import TTSApiService from '../services/api';

interface TTSStore extends TTSState {
  // 初始化状态
  isInitialized: boolean;
  isInitializing: boolean;

  // Actions
  setText: (text: string) => void;
  setVoice: (voice: string) => void;
  setStyle: (style: string) => void;
  setRate: (rate: string) => void;
  setPitch: (pitch: string) => void;
  setLocale: (locale: string) => void;
  setApiKey: (apiKey: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAudioUrl: (audioUrl: string | null) => void;
  setAudioState: (audioState: Partial<AudioState>) => void;
  setCurrentPlayingId: (id: string | null) => void;

  // Async actions
  initializeApp: () => Promise<void>;
  loadVoices: () => Promise<void>;
  generateSpeech: () => Promise<void>;
  downloadAudio: () => void;
  downloadHistoryAudio: (item: HistoryItem) => Promise<void>;
  resetForm: () => void;
  resetRateAndPitch: () => void;

  // History actions
  addToHistory: (item: HistoryItem) => void;
  removeFromHistory: (id: string) => void;
  updateHistoryItem: (id: string, updates: Partial<HistoryItem>) => void;
  clearHistory: () => void;
  playHistoryItem: (item: HistoryItem) => void;

  // Utils
  clearError: () => void;
}

const initialAudioState: AudioState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1.0,
};

// 辅助函数：下载blob文件
const downloadBlob = (audioUrl: string, text: string) => {
  const a = document.createElement('a');
  a.href = audioUrl;

  // 清理文件名，移除非法字符
  const cleanText = text
    .substring(0, 20)
    .replace(/[<>:"/\\|?*]/g, '') // 移除Windows不允许的字符
    .replace(/\s+/g, '_') // 空格替换为下划线
    .trim();

  const filename = cleanText ? `tts_${cleanText}_${Date.now()}.mp3` : `tts_audio_${Date.now()}.mp3`;
  a.download = filename;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  console.log('下载完成:', filename);
};

export const useTTSStore = create<TTSStore>()(
  persist(
    (set, get) => ({
      // Initial state
      text: '',
      voice: '',
      style: '',
      rate: '0',
      pitch: '0',
      locale: '',
      apiKey: '',
      isLoading: false,
      error: null,
      audioUrl: null,
      audioState: initialAudioState,
      voices: [],
      styles: [],
      config: null,
      history: [],
      currentPlayingId: null,
      isInitialized: false,
      isInitializing: false,

      // Helper to restore dates from localStorage
      _restoreHistoryDates: () => {
        const state = get();
        if (state.history.length > 0) {
          set({
            history: state.history.map(item => ({
              ...item,
              createdAt: new Date(item.createdAt)
            }))
          });
        }
      },

      // Actions
      setText: (text: string) => set({ text }),
      setVoice: (voice: string) => set({ voice }),
      setStyle: (style: string) => set({ style }),
      setRate: (rate: string) => set({ rate }),
      setPitch: (pitch: string) => set({ pitch }),
      setLocale: (locale: string) => set({ locale }),
      setApiKey: (apiKey: string) => set({ apiKey }),
      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),
      setAudioUrl: (audioUrl: string | null) => set({ audioUrl }),
      setAudioState: (audioState: Partial<AudioState>) =>
        set((state) => ({
          audioState: { ...state.audioState, ...audioState }
        })),
      setCurrentPlayingId: (currentPlayingId: string | null) => set({ currentPlayingId }),

      // Async actions
      initializeApp: async () => {
        const state = get();

        // 防止重复初始化
        if (state.isInitialized || state.isInitializing) {
          return;
        }

        try {
          set({ isLoading: true, error: null, isInitializing: true });

          // 加载配置
          const config = await TTSApiService.getConfig();
          set({ config });

          // 设置默认值
          const { voice, rate, pitch } = get();
          if (!voice && config.defaultVoice) {
            set({ voice: config.defaultVoice });
          }
          if (!rate && config.defaultRate) {
            set({ rate: config.defaultRate });
          }
          if (!pitch && config.defaultPitch) {
            set({ pitch: config.defaultPitch });
          }

          // 加载声音列表
          await get().loadVoices();

          // 恢复历史记录的日期格式 - 暂时跳过
          // const state = get();
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to initialize app' });
        } finally {
          set({ isLoading: false, isInitializing: false, isInitialized: true });
        }
      },

      loadVoices: async () => {
        try {
          const voices = await TTSApiService.getVoices();
          const styles = Array.from(new Set(voices.flatMap(voice => voice.styles)));
          set({ voices, styles });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to load voices' });
        }
      },

      generateSpeech: async () => {
        try {
          const { text, voice, style, rate, pitch, locale, voices } = get();

          if (!text.trim()) {
            set({ error: '请输入要转换的文本' });
            return;
          }

          if (!voice) {
            set({ error: '请选择一个声音' });
            return;
          }

          set({ isLoading: true, error: null, audioUrl: null });

          const audioBlob = await TTSApiService.synthesizeSpeech({
            text: text.trim(),
            voice,
            style: style || undefined,
            rate: rate || '0',
            pitch: pitch || '0',
          });

          const audioUrl = URL.createObjectURL(audioBlob);

          // 获取声音名称
          const selectedVoice = voices.find(v => v.short_name === voice || v.id === voice);
          const voiceName = selectedVoice?.local_name || selectedVoice?.name || voice;

          // 创建历史记录项
          const historyItem: HistoryItem = {
            id: Date.now().toString(),
            text: text.trim(),
            voice,
            voiceName,
            style,
            rate,
            pitch,
            locale,
            audioUrl,
            createdAt: new Date(),
          };

          // 添加到历史记录
          get().addToHistory(historyItem);

          set({ audioUrl, currentPlayingId: historyItem.id });

          // 自动播放新生成的音频
          setTimeout(() => {
            const audio = new Audio();
            audio.src = audioUrl;
            audio.volume = 1.0;
            audio.muted = false;

            audio.addEventListener('ended', () => {
              set({ currentPlayingId: null });
              URL.revokeObjectURL(audioUrl);
            });

            audio.addEventListener('error', () => {
              set({ currentPlayingId: null });
              URL.revokeObjectURL(audioUrl);
            });

            audio.play().catch(error => {
              console.error('自动播放失败:', error);
              set({ currentPlayingId: null });
            });
          }, 100);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to generate speech' });
        } finally {
          set({ isLoading: false });
        }
      },

      downloadAudio: () => {
        const { audioUrl, text } = get();
        if (!audioUrl) return;

        const a = document.createElement('a');
        a.href = audioUrl;
        a.download = `tts_${text.substring(0, 20)}_${Date.now()}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },

      resetForm: () => {
        const { config } = get();
        set({
          text: '',
          style: '',
          locale: '',
          rate: config?.defaultRate || '0',
          pitch: config?.defaultPitch || '0',
          error: null,
          audioUrl: null,
          audioState: initialAudioState,
        });
      },

      resetRateAndPitch: () => {
        const { config } = get();
        set({
          rate: config?.defaultRate || '0',
          pitch: config?.defaultPitch || '0',
        });
      },

      clearError: () => set({ error: null }),

      // History actions
      addToHistory: (item: HistoryItem) => {
        const state = get();

        // 检查是否存在相同的记录（基于文本、声音、风格、语速、语调、语言）
        const existingIndex = state.history.findIndex(existingItem =>
          existingItem.text.trim() === item.text.trim() &&
          existingItem.voice === item.voice &&
          existingItem.style === item.style &&
          existingItem.rate === item.rate &&
          existingItem.pitch === item.pitch &&
          existingItem.locale === item.locale
        );

        if (existingIndex !== -1) {
          // 如果存在重复记录，将其移到顶部并更新音频URL和时间
          const existingItem = state.history[existingIndex];
          const updatedItem = {
            ...existingItem,
            audioUrl: item.audioUrl, // 更新为新的音频URL
            createdAt: new Date() // 更新创建时间
          };

          set((prevState) => {
            const newHistory = [...prevState.history];
            newHistory.splice(existingIndex, 1); // 从原位置移除
            newHistory.unshift(updatedItem); // 添加到顶部
            return {
              history: newHistory.slice(0, 50).map(h => ({
                ...h,
                createdAt: new Date(h.createdAt)
              }))
            };
          });
          console.log('检测到重复记录，已更新现有记录');
          return;
        }

        // 如果没有重复记录，正常添加
        set((prevState) => ({
          history: [item, ...prevState.history].slice(0, 50).map(h => ({
            ...h,
            createdAt: new Date(h.createdAt)
          })), // 保留最近50条记录，确保日期格式正确
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

      downloadHistoryAudio: async (item: HistoryItem) => {
        try {
          // 验证 audioUrl 是否有效
          if (!item.audioUrl) {
            console.error('音频URL为空');
            set({ error: '音频URL无效，无法下载' });
            return;
          }

          // 如果是 blob URL 且可能已失效，尝试重新生成音频
          if (item.audioUrl.startsWith('blob:')) {
            try {
              // 验证 blob URL 是否仍然有效
              const response = await fetch(item.audioUrl, { method: 'HEAD' });
              if (!response.ok) {
                console.log('Blob URL已失效，尝试重新生成音频');
                // 重新生成音频
                const audioBlob = await TTSApiService.regenerateSpeech(item as Record<string, unknown>);
                const newAudioUrl = URL.createObjectURL(audioBlob);

                // 直接更新历史记录中的音频URL，不改变位置
                get().updateHistoryItem(item.id, { audioUrl: newAudioUrl });

                // 使用新的URL下载
                downloadBlob(newAudioUrl, item.text);
                return;
              }
            } catch (error) {
              console.log('验证blob URL失败，尝试重新生成音频:', error);
              // 重新生成音频
              const audioBlob = await TTSApiService.regenerateSpeech(item);
              const newAudioUrl = URL.createObjectURL(audioBlob);

              // 直接更新历史记录中的音频URL，不改变位置
              get().updateHistoryItem(item.id, { audioUrl: newAudioUrl });

              // 使用新的URL下载
              downloadBlob(newAudioUrl, item.text);
              return;
            }
          }

          // 直接下载有效的音频
          downloadBlob(item.audioUrl, item.text);
        } catch (error) {
          console.error('下载音频失败:', error);
          set({ error: error instanceof Error ? error.message : '下载音频失败' });
        }
      },

      playHistoryItem: (item: HistoryItem) => {
        set({
          audioUrl: item.audioUrl,
          currentPlayingId: item.id,
          text: item.text,
          voice: item.voice,
          style: item.style || '',
          rate: item.rate,
          pitch: item.pitch,
          locale: item.locale,
        });
      },
    }),
    {
      name: 'tts-store',
      partialize: (state) => ({
        text: state.text,
        voice: state.voice,
        style: state.style,
        rate: state.rate,
        pitch: state.pitch,
        locale: state.locale,
        apiKey: state.apiKey,
        history: state.history,
      }),
    }
  )
);