/**
 * TTS 组合 Hook
 *
 * 这个 Hook 将 4 个拆分的 Store 组合在一起，提供类似旧版 useTTSStore 的接口
 * 使得组件可以平滑过渡到新的 Store 架构
 */

import { useCallback } from 'react';
import TTSApiService from '../services/api';
import { audioManager } from '../utils/audioResourceManager';
import type { HistoryItem } from '../types';

// 从各个 Store 导入选择器
import {
  useText,
  useVoiceSettings,
  useParameterSettings,
  useFormActions,
} from './stores/formStore';

import {
  useAudioUrl,
  useCurrentPlayingId,
  useAudioState,
  useAudioActions,
} from './stores/audioStore';

import {
  useIsLoading,
  useError,
  useLanguageState,
  useUIActions,
} from './stores/uiStore';

import {
  useVoices,
  useStyles,
  useConfig,
  useHistory,
  useInitState,
  useHistoryActions,
  useDataActions,
} from './stores/dataStore';

/**
 * TTS 组合 Hook
 *
 * 提供类似旧版 useTTSStore 的接口，但内部使用拆分的 Store
 */
export const useTTSStoreV2 = () => {
  // ========== Form State ==========
  const text = useText();
  const { voice, style, locale } = useVoiceSettings();
  const { rate, pitch } = useParameterSettings();
  const formActions = useFormActions();

  // ========== Audio State ==========
  const audioUrl = useAudioUrl();
  const currentPlayingId = useCurrentPlayingId();
  const audioState = useAudioState();
  const audioActions = useAudioActions();

  // ========== UI State ==========
  const isLoading = useIsLoading();
  const error = useError();
  const { selectedLanguage, languageMap } = useLanguageState();
  const uiActions = useUIActions();

  // ========== Data State ==========
  const voices = useVoices();
  const styles = useStyles();
  const config = useConfig();
  const history = useHistory();
  const { isInitialized, isInitializing } = useInitState();
  const historyActions = useHistoryActions();
  const dataActions = useDataActions();

  // ========== Actions ==========

  /**
   * 初始化应用
   */
  const initializeApp = useCallback(async () => {
    const { isInitialized, isInitializing } = useInitState();

    // 防止重复初始化
    if (isInitialized || isInitializing) {
      return;
    }

    try {
      uiActions.setLoading(true);
      uiActions.setError(null);
      dataActions.setIsInitializing(true);

      // 加载配置
      const serviceConfig = await TTSApiService.getConfig();
      dataActions.setConfig(serviceConfig);

      // 设置默认值
      if (!voice && serviceConfig.defaultVoice) {
        formActions.setVoice(serviceConfig.defaultVoice);
      }
      if (!rate && serviceConfig.defaultRate) {
        formActions.setRate(serviceConfig.defaultRate);
      }
      if (!pitch && serviceConfig.defaultPitch) {
        formActions.setPitch(serviceConfig.defaultPitch);
      }

      // 加载声音列表
      const voicesList = await TTSApiService.getVoices();
      dataActions.setVoices(voicesList);

      dataActions.setIsInitialized(true);
    } catch (error) {
      uiActions.setError(error instanceof Error ? error.message : 'Failed to initialize app');
    } finally {
      uiActions.setLoading(false);
      dataActions.setIsInitializing(false);
    }
  }, [voice, rate, pitch, formActions, uiActions, dataActions]);

  /**
   * 加载声音列表
   */
  const loadVoices = useCallback(async () => {
    try {
      const voicesList = await TTSApiService.getVoices();
      dataActions.setVoices(voicesList);
    } catch (error) {
      uiActions.setError(error instanceof Error ? error.message : 'Failed to load voices');
    }
  }, [dataActions, uiActions]);

  /**
   * 生成语音
   */
  const generateSpeech = useCallback(async () => {
    try {
      if (!text.trim()) {
        uiActions.setError('请输入要转换的文本');
        return;
      }

      if (!voice) {
        uiActions.setError('请选择一个声音');
        return;
      }

      uiActions.setLoading(true);
      uiActions.setError(null);
      audioActions.setAudioUrl(null);

      const audioBlob = await TTSApiService.synthesizeSpeech({
        text: text.trim(),
        voice,
        style: style || undefined,
        rate: rate || '0',
        pitch: pitch || '0',
      });

      // 验证音频数据
      if (audioBlob.size === 0) {
        throw new Error('音频数据为空');
      }

      // 确保 MIME 类型正确
      let finalBlob = audioBlob;
      if (!audioBlob.type || !audioBlob.type.startsWith('audio/')) {
        const arrayBuffer = await audioBlob.arrayBuffer();
        finalBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      }

      // 使用音频资源管理器创建 Blob URL
      const newAudioUrl = audioManager.createBlobUrl(finalBlob);

      // 移除旧的防止 Blob 被垃圾回收的代码（现在由 audioManager 管理）
      // (window as any).__activeBlobs 已废弃

      // 获取声音名称
      const selectedVoice = voices.find(v => v.short_name === voice || v.id === voice);
      const voiceName = selectedVoice?.local_name || selectedVoice?.name || voice;

      // 创建历史记录项
      const historyId = Date.now().toString();
      const historyItem: HistoryItem = {
        id: historyId,
        text: text.trim(),
        voice,
        voiceName,
        style,
        rate,
        pitch,
        locale,
        audioUrl: null, // 不存储 blob URL
        createdAt: new Date(),
      };

      // 添加到历史记录
      historyActions.addToHistory(historyItem);

      // 设置音频 URL 用于当前播放
      audioActions.setAudioUrl(newAudioUrl);
      audioActions.setCurrentPlayingId(historyId);
    } catch (error) {
      uiActions.setError(error instanceof Error ? error.message : 'Failed to generate speech');
    } finally {
      uiActions.setLoading(false);
    }
  }, [
    text,
    voice,
    style,
    rate,
    pitch,
    locale,
    voices,
    uiActions,
    audioActions,
    historyActions,
  ]);

  /**
   * 下载音频
   */
  const downloadAudio = useCallback(() => {
    if (!audioUrl) return;

    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `tts_${text.substring(0, 20)}_${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [audioUrl, text]);

  /**
   * 下载历史记录音频
   */
  const downloadHistoryAudio = useCallback(async (item: HistoryItem) => {
    try {
      if (!item.audioUrl) {
        uiActions.setError('音频URL无效，无法下载');
        return;
      }

      // 如果是 blob URL 且可能已失效，尝试重新生成音频
      if (item.audioUrl.startsWith('blob:')) {
        try {
          const response = await fetch(item.audioUrl, { method: 'HEAD' });
          if (!response.ok) {
            // 重新生成音频
            const audioBlob = await TTSApiService.regenerateSpeech(item as Record<string, unknown>);
            const newAudioUrl = audioManager.createBlobUrl(audioBlob);

            // 更新历史记录
            historyActions.updateHistoryItem(item.id, { audioUrl: newAudioUrl });

            // 下载新的 URL
            const a = document.createElement('a');
            a.href = newAudioUrl;
            a.download = `tts_${item.text.substring(0, 20)}_${Date.now()}.mp3`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            return;
          }
        } catch (error) {
          // 重新生成音频
          const audioBlob = await TTSApiService.regenerateSpeech(item);
          const newAudioUrl = audioManager.createBlobUrl(audioBlob);

          historyActions.updateHistoryItem(item.id, { audioUrl: newAudioUrl });

          const a = document.createElement('a');
          a.href = newAudioUrl;
          a.download = `tts_${item.text.substring(0, 20)}_${Date.now()}.mp3`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          return;
        }
      }

      // 直接下载有效的音频
      const a = document.createElement('a');
      a.href = item.audioUrl;
      a.download = `tts_${item.text.substring(0, 20)}_${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('下载音频失败:', error);
      uiActions.setError(error instanceof Error ? error.message : '下载音频失败');
    }
  }, [uiActions, historyActions]);

  /**
   * 重置表单
   */
  const resetForm = useCallback(() => {
    formActions.resetForm({
      rate: config?.defaultRate || '0',
      pitch: config?.defaultPitch || '0',
    });
    audioActions.setAudioUrl(null);
    audioActions.setCurrentPlayingId(null);
    uiActions.setError(null);
  }, [formActions, audioActions, uiActions, config]);

  /**
   * 重置语速和语调
   */
  const resetRateAndPitch = useCallback(() => {
    formActions.setRate(config?.defaultRate || '0');
    formActions.setPitch(config?.defaultPitch || '0');
  }, [formActions, config]);

  /**
   * 播放历史记录项
   */
  const playHistoryItem = useCallback((item: HistoryItem) => {
    formActions.setText(item.text);
    formActions.setVoice(item.voice);
    formActions.setStyle(item.style || '');
    formActions.setRate(item.rate);
    formActions.setPitch(item.pitch);
    formActions.setLocale(item.locale);
    audioActions.setCurrentPlayingId(item.id);
    audioActions.setAudioUrl(null);
  }, [formActions, audioActions]);

  /**
   * 清理无效的 Blob URL
   */
  const cleanupInvalidUrls = useCallback(() => {
    const cleanedHistory = history.map(item => ({
      ...item,
      audioUrl: item.audioUrl?.startsWith('blob:') ? null : item.audioUrl,
    }));

    // 批量更新历史记录
    cleanedHistory.forEach(item => {
      if (item.audioUrl !== history.find(h => h.id === item.id)?.audioUrl) {
        historyActions.updateHistoryItem(item.id, { audioUrl: item.audioUrl });
      }
    });
  }, [history, historyActions]);

  // ========== 返回组合后的状态和方法 ==========

  return {
    // Form State
    text,
    voice,
    style,
    rate,
    pitch,
    locale,
    apiKey: '', // TODO: 从 formStore 获取

    // Audio State
    audioUrl,
    currentPlayingId,
    audioState,

    // UI State
    isLoading,
    error,

    // Data State
    voices,
    styles,
    config,
    history,
    isInitialized,
    isInitializing,

    // Language State
    selectedLanguage,
    languageMap,

    // Form Actions
    setText: formActions.setText,
    setVoice: formActions.setVoice,
    setStyle: formActions.setStyle,
    setRate: formActions.setRate,
    setPitch: formActions.setPitch,
    setLocale: formActions.setLocale,

    // Audio Actions
    setAudioUrl: audioActions.setAudioUrl,
    setAudioState: audioActions.setAudioState,
    setCurrentPlayingId: audioActions.setCurrentPlayingId,

    // UI Actions
    setLoading: uiActions.setLoading,
    setError: uiActions.setError,
    clearError: uiActions.clearError,

    // Data Actions
    setVoices: dataActions.setVoices,
    setStyles: dataActions.setStyles,
    setConfig: dataActions.setConfig,

    // History Actions
    addToHistory: historyActions.addToHistory,
    removeFromHistory: historyActions.removeFromHistory,
    updateHistoryItem: historyActions.updateHistoryItem,
    clearHistory: historyActions.clearHistory,

    // Composite Actions
    initializeApp,
    loadVoices,
    generateSpeech,
    downloadAudio,
    downloadHistoryAudio,
    resetForm,
    resetRateAndPitch,
    playHistoryItem,
    cleanupInvalidUrls,
  };
};
