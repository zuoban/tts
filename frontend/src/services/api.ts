import axios from 'axios';
import type { Voice, TTSParams, Config } from '../types/index';

// 请求去重缓存
const pendingRequests = new Map<string, Promise<unknown>>();

// 创建 axios 实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/', // 使用相对路径
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
      console.log('API 请求认证:', {
        url: config.url,
        method: config.method,
        hasApiKey: !!apiKey,
        authHeader: config.headers.Authorization ? '已设置' : '未设置'
      });
    } else {
      console.warn('API 请求缺少认证密钥:', config.url);
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
        console.error('API 认证失败:', {
            url: error.config?.url,
            status: error.response.status,
            statusText: error.response.statusText,
            hasApiKey: !!localStorage.getItem('tts_api_key')
        });
        error.message = 'API Key 无效或已过期，请检查认证设置';
    } else if (error.response?.status === 403) {
        console.error('API 访问被拒绝:', error.config?.url);
        error.message = '访问被拒绝，权限不足';
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
      // 移除 api_key 参数，使用 Authorization 头认证
      const { api_key, ...cleanParams } = params as any;

      const response = await api.post('/api/v1/tts', cleanParams, {
        responseType: 'blob',
      });

      // 调试响应信息
      console.log('API 响应调试信息:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        dataType: response.data.constructor.name,
        dataSize: response.data.size,
        contentType: response.data.type,
      });

      // 验证响应数据
      if (!(response.data instanceof Blob)) {
        throw new Error('服务器返回的不是音频数据');
      }

      if (response.data.size === 0) {
        throw new Error('音频数据为空');
      }

      // 验证音频数据的头部字节
      const audioBlob = response.data;
      try {
        const headerBytes = await audioBlob.slice(0, 12).arrayBuffer();
        const header = new Uint8Array(headerBytes);
        console.log('音频文件头部字节:', Array.from(header).map(b => b.toString(16).padStart(2, '0')).join(' '));

        // 检查是否为有效的音频文件格式
        const isValidMp3 = header[0] === 0xFF && (header[1] & 0xE0) === 0xE0; // MP3 sync bytes
        const isValidWav = header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46; // "RIFF"
        const isValidMpeg = header[0] === 0x49 && header[1] === 0x44 && header[2] === 0x33; // "ID3"

        console.log('音频格式验证:', {
          isMp3: isValidMp3,
          isWav: isValidWav,
          isMpeg: isValidMpeg,
          type: audioBlob.type
        });

        if (!isValidMp3 && !isValidWav && !isValidMpeg) {
          console.warn('警告: 音频文件格式可能不正确');
        }
      } catch (headerError) {
        console.warn('无法读取音频文件头部:', headerError);
      }

      return audioBlob;
    } catch (error) {
      console.error('API 请求失败:', error);
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
      };
      const response = await api.post('/api/v1/tts', params, {
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