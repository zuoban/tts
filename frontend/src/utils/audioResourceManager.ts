/**
 * 音频资源管理器
 *
 * 职责：
 * - 管理 Blob URL 的生命周期
 * - 自动清理过期的音频资源
 * - 防止内存泄漏
 * - 提供音频资源池
 */

/**
 * 音频资源信息
 */
interface AudioResource {
  blob: Blob;
  url: string;
  createdAt: number;
  lastAccessedAt: number;
  accessCount: number;
}

/**
 * 音频资源管理器配置
 */
interface AudioResourceManagerConfig {
  maxCacheSize: number; // 最大缓存数量
  maxAge: number; // 最大缓存时间（毫秒）
  cleanupInterval: number; // 清理间隔（毫秒）
}

/**
 * 音频资源管理器类
 */
export class AudioResourceManager {
  private resourcePool = new Map<string, AudioResource>();
  private config: AudioResourceManagerConfig;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<AudioResourceManagerConfig> = {}) {
    this.config = {
      maxCacheSize: config.maxCacheSize || 10,
      maxAge: config.maxAge || 30 * 60 * 1000, // 默认 30 分钟
      cleanupInterval: config.cleanupInterval || 5 * 60 * 1000, // 默认 5 分钟
    };

    // 启动定期清理
    this.startPeriodicCleanup();
  }

  /**
   * 创建 Blob URL 并管理其生命周期
   */
  createBlobUrl(blob: Blob, metadata?: Partial<AudioResource>): string {
    // 检查缓存大小限制
    this.enforceCacheLimit();

    // 创建 Blob URL
    const url = URL.createObjectURL(blob);

    // 记录资源信息
    const now = Date.now();
    const resource: AudioResource = {
      blob,
      url,
      createdAt: now,
      lastAccessedAt: now,
      accessCount: 0,
    };

    this.resourcePool.set(url, resource);

    console.log(`[AudioManager] 创建 Blob URL: ${url.substring(0, 30)}... (总缓存: ${this.resourcePool.size})`);

    return url;
  }

  /**
   * 获取音频资源（更新访问时间）
   */
  getAudioResource(url: string): AudioResource | null {
    const resource = this.resourcePool.get(url);
    if (resource) {
      resource.lastAccessedAt = Date.now();
      resource.accessCount++;
      return resource;
    }
    return null;
  }

  /**
   * 释放指定的 Blob URL
   */
  revokeBlobUrl(url: string): boolean {
    const resource = this.resourcePool.get(url);
    if (!resource) {
      console.warn(`[AudioManager] Blob URL 不存在: ${url.substring(0, 30)}...`);
      return false;
    }

    try {
      URL.revokeObjectURL(url);
      this.resourcePool.delete(url);
      console.log(`[AudioManager] 释放 Blob URL: ${url.substring(0, 30)}... (剩余缓存: ${this.resourcePool.size})`);
      return true;
    } catch (error) {
      console.error('[AudioManager] 释放 Blob URL 失败:', error);
      return false;
    }
  }

  /**
   * 释放所有 Blob URL
   */
  revokeAll(): void {
    console.log(`[AudioManager] 开始清理所有音频资源... (总数: ${this.resourcePool.size})`);

    let successCount = 0;
    let failCount = 0;

    this.resourcePool.forEach((resource, url) => {
      try {
        URL.revokeObjectURL(url);
        successCount++;
      } catch (error) {
        console.error(`[AudioManager] 释放 Blob URL 失败: ${url.substring(0, 30)}...`, error);
        failCount++;
      }
    });

    this.resourcePool.clear();

    console.log(`[AudioManager] 清理完成: 成功 ${successCount}, 失败 ${failCount}`);
  }

  /**
   * 清理过期的资源
   */
  cleanupExpired(): number {
    const now = Date.now();
    const expiredUrls: string[] = [];

    this.resourcePool.forEach((resource, url) => {
      const age = now - resource.lastAccessedAt;
      if (age > this.config.maxAge) {
        expiredUrls.push(url);
      }
    });

    expiredUrls.forEach((url) => this.revokeBlobUrl(url));

    if (expiredUrls.length > 0) {
      console.log(`[AudioManager] 清理过期资源: ${expiredUrls.length} 个`);
    }

    return expiredUrls.length;
  }

  /**
   * 强制执行缓存大小限制
   * 使用 LRU (Least Recently Used) 策略
   */
  private enforceCacheLimit(): void {
    if (this.resourcePool.size < this.config.maxCacheSize) {
      return;
    }

    console.log(`[AudioManager] 缓存已满 (${this.resourcePool.size}/${this.config.maxCacheSize})，清理最旧的资源...`);

    // 按最后访问时间排序
    const sortedResources = Array.from(this.resourcePool.entries()).sort(
      (a, b) => a[1].lastAccessedAt - b[1].lastAccessedAt
    );

    // 删除最旧的资源，直到缓存大小在限制内
    const toRemove = sortedResources.slice(0, this.resourcePool.size - this.config.maxCacheSize + 1);
    toRemove.forEach(([url]) => this.revokeBlobUrl(url));
  }

  /**
   * 启动定期清理
   */
  private startPeriodicCleanup(): void {
    if (this.cleanupTimer) {
      return;
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired();
    }, this.config.cleanupInterval);

    console.log(`[AudioManager] 启动定期清理 (间隔: ${this.config.cleanupInterval / 1000}秒)`);
  }

  /**
   * 停止定期清理
   */
  stopPeriodicCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
      console.log('[AudioManager] 停止定期清理');
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalResources: number;
    totalAccessCount: number;
    oldestResourceAge: number;
    newestResourceAge: number;
  } {
    if (this.resourcePool.size === 0) {
      return {
        totalResources: 0,
        totalAccessCount: 0,
        oldestResourceAge: 0,
        newestResourceAge: 0,
      };
    }

    const now = Date.now();
    const ages = Array.from(this.resourcePool.values()).map(r => now - r.createdAt);
    const totalAccessCount = Array.from(this.resourcePool.values()).reduce((sum, r) => sum + r.accessCount, 0);

    return {
      totalResources: this.resourcePool.size,
      totalAccessCount,
      oldestResourceAge: Math.max(...ages),
      newestResourceAge: Math.min(...ages),
    };
  }

  /**
   * 打印统计信息
   */
  logStats(): void {
    const stats = this.getStats();
    console.log('[AudioManager] 统计信息:', {
      总资源数: stats.totalResources,
      总访问次数: stats.totalAccessCount,
      最旧资源: `${Math.round(stats.oldestResourceAge / 1000)}秒前`,
      最新资源: `${Math.round(stats.newestResourceAge / 1000)}秒前`,
    });
  }

  /**
   * 销毁管理器（清理所有资源）
   */
  destroy(): void {
    this.stopPeriodicCleanup();
    this.revokeAll();
    console.log('[AudioManager] 管理器已销毁');
  }
}

/**
 * 全局单例音频资源管理器
 */
export const audioManager = new AudioResourceManager({
  maxCacheSize: 10,
  maxAge: 30 * 60 * 1000, // 30 分钟
  cleanupInterval: 5 * 60 * 1000, // 5 分钟
});

/**
 * 页面卸载时自动清理
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    audioManager.destroy();
  });
}
