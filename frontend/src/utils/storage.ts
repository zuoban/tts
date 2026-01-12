/**
 * 防抖存储工具
 *
 * 用于优化 Zustand persist 中间件的 localStorage 写入性能
 * 通过防抖减少频繁的写入操作
 */

/**
 * 防抖存储配置
 */
interface DebouncedStorageConfig {
  /** 防抖延迟时间（毫秒），默认 1000ms */
  delay?: number;
  /** 是否立即写入第一次变化，默认 false */
  immediate?: boolean;
}

/**
 * 防抖存储实现
 */
class DebouncedStorage {
  private delay: number;
  private immediate: boolean;
  private timers: Map<string, ReturnType<typeof setTimeout>>;
  private pendingValues: Map<string, string>;

  constructor(config: DebouncedStorageConfig = {}) {
    this.delay = config.delay || 1000;
    this.immediate = config.immediate || false;
    this.timers = new Map();
    this.pendingValues = new Map();
  }

  /**
   * 获取项
   */
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('读取 localStorage 失败:', error);
      return null;
    }
  }

  /**
   * 设置项（防抖）
   */
  setItem(key: string, value: string): void {
    // 保存待写入的值
    this.pendingValues.set(key, value);

    // 如果设置为立即写入，并且是第一次写入
    if (this.immediate && !this.timers.has(key)) {
      this.flush(key);
      return;
    }

    // 清除之前的定时器
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
    }

    // 设置新的防抖定时器
    const timer = setTimeout(() => {
      this.flush(key);
    }, this.delay);

    this.timers.set(key, timer);
  }

  /**
   * 移除项（立即执行，不防抖）
   */
  removeItem(key: string): void {
    // 取消防抖
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
      this.timers.delete(key);
    }

    // 移除待写入的值
    this.pendingValues.delete(key);

    // 立即从 localStorage 删除
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('删除 localStorage 失败:', error);
    }
  }

  /**
   * 立即将所有待写入的值写入 localStorage
   */
  flush(key?: string): void {
    if (key) {
      // 刷新单个 key
      this.flushKey(key);
    } else {
      // 刷新所有待写入的 key
      const keys = Array.from(this.pendingValues.keys());
      keys.forEach((k) => this.flushKey(k));
    }
  }

  /**
   * 刷新单个 key
   */
  private flushKey(key: string): void {
    const value = this.pendingValues.get(key);
    if (value !== undefined) {
      try {
        localStorage.setItem(key, value);
        this.pendingValues.delete(key);
      } catch (error) {
        console.error('写入 localStorage 失败:', error);
      }
    }

    // 清除定时器
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
      this.timers.delete(key);
    }
  }

  /**
   * 清理所有待写入的值和定时器
   */
  cleanup(): void {
    // 刷新所有待写入的值
    this.flush();

    // 清空 Map
    this.pendingValues.clear();
    this.timers.clear();
  }
}

/**
 * 创建防抖存储实例
 */
export const createDebouncedStorage = (config?: DebouncedStorageConfig) => {
  return new DebouncedStorage(config);
};

/**
 * 默认的防抖存储实例（1秒延迟）
 */
export const debouncedStorage = createDebouncedStorage({
  delay: 1000,
  immediate: false,
});

/**
 * 快速写入的防抖存储实例（100ms延迟）
 */
export const fastDebouncedStorage = createDebouncedStorage({
  delay: 100,
  immediate: true,
});

/**
 * 存储统计工具
 */
export const storageStats = {
  /**
   * 获取存储使用情况
   */
  getUsage(): { used: number; total: number; percentage: number } {
    let used = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }

    // localStorage 通常限制为 5-10MB
    const total = 5 * 1024 * 1024; // 5MB
    const percentage = (used / total) * 100;

    return { used, total, percentage };
  },

  /**
   * 清理所有 TTS 相关的存储
   */
  clearTTSStorage(): void {
    const keysToRemove: string[] = [];

    for (let key in localStorage) {
      if (key.startsWith('tts-')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });

    console.log(`已清理 ${keysToRemove.length} 个 TTS 存储项`);
  },

  /**
   * 获取所有 TTS 相关的存储大小
   */
  getTTSStorageSize(): number {
    let size = 0;

    for (let key in localStorage) {
      if (key.startsWith('tts-')) {
        size += key.length + (localStorage[key]?.length || 0);
      }
    }

    return size;
  },
};
