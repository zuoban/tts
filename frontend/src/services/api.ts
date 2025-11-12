import axios from 'axios';
import type { Voice, TTSParams, Config } from '../types/index';

// 请求去重缓存
const pendingRequests = new Map<string, Promise<unknown>>();

// 创建 axios 实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/', // 使用相对路径，在生产环境中直接使用根路径
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加 API Key
api.interceptors.request.use(
  (config) => {
    const apiKey = localStorage.getItem('tts_api_key');
    if (apiKey) {
      config.headers.Authorization = `Bearer ${apiKey}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
        error.message = 'API Key 无效';
    }
    return Promise.reject(error);
  }
);

// API 服务类
export class TTSApiService {
  // 健康检查
  static async healthCheck(): Promise<unknown> {
    try {
      const response = await api.get('/api/v1/health');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // 获取配置信息
  static async getConfig(): Promise<Config> {
    const cacheKey = 'config';

    // 如果已有请求在进行中，返回相同的 Promise
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey) as Promise<Config>;
    }

    const requestPromise = this.makeConfigRequest();
    pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result as Config;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  }

  // 实际的配置请求方法
  private static async makeConfigRequest(): Promise<Config> {
    try {
      const response = await api.get('/api/v1/config');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // 获取声音列表
  static async getVoices(): Promise<Voice[]> {
    const cacheKey = 'voices-all';

    // 如果已有请求在进行中，返回相同的 Promise
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey) as Promise<Voice[]>;
    }

    const requestPromise = this.makeVoicesRequest();
    pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result as Voice[];
    } finally {
      pendingRequests.delete(cacheKey);
    }
  }

  // 实际的声音列表请求方法
  private static async makeVoicesRequest(): Promise<Voice[]> {
    try {
      const response = await api.get('/api/v1/voices');

      // 映射后端数据到前端类型
      return response.data.map((voice: Record<string, unknown>) => ({
        id: (voice.short_name as string) || (voice.name as string),
        name: voice.name as string,
        locale: voice.locale as string,
        gender: voice.gender as string,
        styles: (voice.style_list as string[]) || (voice.styles as string[]) || [],
        roles: (voice.roles as string[]) || [],
        sampleRate: voice.sample_rate_hertz ? parseInt(voice.sample_rate_hertz as string) : undefined,
        short_name: voice.short_name as string,
        local_name: voice.local_name as string,
        locale_name: voice.locale_name as string,
        display_name: voice.display_name as string,
        style_list: voice.style_list as string[],
        sample_rate_hertz: voice.sample_rate_hertz as string,
      }));
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // 文本转语音
  static async synthesizeSpeech(params: TTSParams): Promise<Blob> {
    try {
        params['api_key'] = localStorage.getItem('tts_api_key') || '';
      const response = await api.get('/api/v1/tts', {
        params,
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // 文本转语音（历史记录重新生成）
  static async regenerateSpeech(historyItem: Record<string, unknown>): Promise<Blob> {
    try {
      const params = {
        text: historyItem.text as string,
        voice: historyItem.voice as string,
        style: (historyItem.style as string) || undefined,
        rate: historyItem.rate as string,
        pitch: historyItem.pitch as string,
        api_key: localStorage.getItem('tts_api_key') || '',
      };
      const response = await api.get('/api/v1/tts', {
        params,
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // OpenAI 兼容接口
  static async openAISpeech(params: {
    model: string;
    input: string;
    voice: string;
    response_format?: string;
    speed?: number;
  }): Promise<Blob> {
    try {
      const response = await api.post('/v1/audio/speech', params, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // 处理错误
  private static handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error || error.message;
      return new Error(message);
    }
    return error instanceof Error ? error : new Error('Unknown error');
  }
}

export default TTSApiService;