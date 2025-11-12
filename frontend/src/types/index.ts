// API 响应类型
export interface APIResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// 常用语言列表
export const COMMON_LANGUAGES = [
  'Chinese',
  'English',
  'Japanese',
  'Korean',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Russian',
] as const;

// TTS 声音信息
export interface Voice {
  id: string;
  name: string;
  locale: string;
  gender: 'Male' | 'Female';
  styles: string[];
  roles: string[];
  sampleRate?: number;
  wordsPerMinute?: number;
  short_name?: string;
  local_name?: string;
  locale_name?: string;
  display_name?: string;
  style_list?: string[];
  sample_rate_hertz?: string;
}

// TTS 请求参数
export interface TTSParams {
  text: string;
  voice: string;
  style?: string;
  rate?: string;
  pitch?: string;
  format?: string;
}

// 配置信息
export interface Config {
  defaultVoice: string;
  defaultRate: string;
  defaultPitch: string;
  defaultFormat: string;
  basePath: string;
  voices: Voice[];
  styles: string[];
}

// 音频播放状态
export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

// 历史记录项
export interface HistoryItem extends Record<string, unknown> {
  id: string;
  text: string;
  voice: string;
  voiceName: string;
  style?: string;
  rate: string;
  pitch: string;
  locale: string;
  audioUrl: string;
  createdAt: Date;
  duration?: number;
}

// TTS 应用状态
export interface TTSState {
  // 表单状态
  text: string;
  voice: string;
  style: string;
  rate: string;
  pitch: string;
  locale: string;

  // API 相关
  apiKey: string;
  isLoading: boolean;
  error: string | null;

  // 音频相关
  audioUrl: string | null;
  audioState: AudioState;

  // 数据
  voices: Voice[];
  styles: string[];
  config: Config | null;

  // 历史记录
  history: HistoryItem[];
  currentPlayingId: string | null;
}

// 收藏声音项
export interface FavoriteVoiceItem {
  id: string; // 声音ID或short_name
  name: string; // 声音名称
  localName?: string; // 本地化名称
  locale: string; // 语言区域
  localeName?: string; // 语言区域显示名称
  gender: 'Male' | 'Female';
  styles?: string[]; // 支持的风格
  addedAt: Date; // 收藏时间
}

// 收藏夹状态
export interface FavoritesState {
  items: FavoriteVoiceItem[];
  lastUpdated: Date | null;
}

// 本地存储键
export const STORAGE_KEYS = {
  API_KEY: 'tts_api_key',
  TEXT: 'tts_text',
  VOICE: 'tts_voice',
  STYLE: 'tts_style',
  RATE: 'tts_rate',
  PITCH: 'tts_pitch',
  LOCALE: 'tts_locale',
  HISTORY: 'tts_history',
  FAVORITES: 'tts_favorites',
} as const;