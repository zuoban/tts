import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '../../types';
import { debouncedStorage } from '../../utils/storage';

/**
 * 表单状态接口
 * 包含用户输入的表单数据，需要持久化到 localStorage
 */
interface FormState {
  // 表单字段
  text: string;
  voice: string;
  style: string;
  rate: string;
  pitch: string;
  locale: string;
  apiKey: string;

  // Actions
  setText: (text: string) => void;
  setVoice: (voice: string) => void;
  setStyle: (style: string) => void;
  setRate: (rate: string) => void;
  setPitch: (pitch: string) => void;
  setLocale: (locale: string) => void;
  setApiKey: (apiKey: string) => void;

  // 批量更新
  resetForm: (defaults?: Partial<FormState>) => void;
  updateForm: (updates: Partial<FormState>) => void;
}

/**
 * 表单状态 Store
 *
 * 职责：
 * - 管理用户输入的表单数据
 * - 持久化到 localStorage
 * - 提供表单重置和批量更新功能
 *
 * 持久化策略：
 * - 只持久化必要的表单字段
 * - 使用防抖减少 localStorage 写入次数
 */
export const useFormStore = create<FormState>()(
  persist(
    (set) => ({
      // Initial state
      text: '',
      voice: '',
      style: '',
      rate: '0',
      pitch: '0',
      locale: '',
      apiKey: '',

      // Actions
      setText: (text: string) => set({ text }),
      setVoice: (voice: string) => set({ voice }),
      setStyle: (style: string) => set({ style }),
      setRate: (rate: string) => set({ rate }),
      setPitch: (pitch: string) => set({ pitch }),
      setLocale: (locale: string) => set({ locale }),
      setApiKey: (apiKey: string) => set({ apiKey }),

      // 批量更新
      updateForm: (updates: Partial<FormState>) => set(updates),

      // 重置表单
      resetForm: (defaults?: Partial<FormState>) => set({
        text: '',
        style: '',
        locale: '',
        rate: defaults?.rate || '0',
        pitch: defaults?.pitch || '0',
        voice: defaults?.voice || '',
        // 不重置 apiKey
      }),
    }),
    {
      name: STORAGE_KEYS.FORM_STORE || 'tts-form-store',
      // 使用防抖存储，减少 localStorage 写入次数
      storage: debouncedStorage as any,

      // 只持久化必要的状态
      partialize: (state) => ({
        text: state.text,
        voice: state.voice,
        style: state.style,
        rate: state.rate,
        pitch: state.pitch,
        locale: state.locale,
        apiKey: state.apiKey,
      }),

      // 版本管理，用于数据迁移
      version: 1,

      // 数据迁移函数
      migrate: (persistedState: any, version: number) => {
        // 从旧版本迁移数据
        if (version === 0) {
          // 从旧的 tts-store 迁移
          const oldState = persistedState as any;
          return {
            text: oldState.text || '',
            voice: oldState.voice || '',
            style: oldState.style || '',
            rate: oldState.rate || '0',
            pitch: oldState.pitch || '0',
            locale: oldState.locale || '',
            apiKey: oldState.apiKey || '',
          };
        }
        return persistedState;
      },
    }
  )
);

// ========== 选择器 Hooks ==========

/**
 * 选择表单文本
 */
export const useText = () => useFormStore((state) => state.text);

/**
 * 选择语音相关设置
 */
export const useVoiceSettings = () => useFormStore((state) => ({
  voice: state.voice,
  style: state.style,
  locale: state.locale,
}));

/**
 * 选择参数设置
 */
export const useParameterSettings = () => useFormStore((state) => ({
  rate: state.rate,
  pitch: state.pitch,
}));

/**
 * 选择表单 actions
 */
export const useFormActions = () => useFormStore((state) => ({
  setText: state.setText,
  setVoice: state.setVoice,
  setStyle: state.setStyle,
  setRate: state.setRate,
  setPitch: state.setPitch,
  setLocale: state.setLocale,
  updateForm: state.updateForm,
  resetForm: state.resetForm,
}));
