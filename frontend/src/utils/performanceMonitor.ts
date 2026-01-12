/**
 * 性能监控工具
 *
 * 用于监控和记录应用性能指标
 */

/**
 * 性能标记信息
 */
interface PerformanceMark {
  name: string;
  startTime: number;
  metadata?: Record<string, unknown>;
}

/**
 * 性能测量结果
 */
export interface PerformanceMeasurement {
  name: string;
  duration: number;
  metadata?: Record<string, unknown>;
}

/**
 * 性能监控配置
 */
interface PerformanceMonitorConfig {
  /**
   * 是否启用性能监控
   */
  enabled: boolean;

  /**
   * 是否在控制台输出日志
   */
  logToConsole: boolean;

  /**
   * 是否发送到分析服务
   */
  sendToAnalytics: boolean;

  /**
   * 自定义分析处理器
   */
  analyticsHandler?: (measurement: PerformanceMeasurement) => void;
}

/**
 * 性能监控类
 */
export class PerformanceMonitor {
  private marks: Map<string, PerformanceMark> = new Map();
  private measurements: PerformanceMeasurement[] = [];
  private config: PerformanceMonitorConfig;

  constructor(config: Partial<PerformanceMonitorConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? process.env.NODE_ENV === 'development',
      logToConsole: config.logToConsole ?? true,
      sendToAnalytics: config.sendToAnalytics ?? false,
      analyticsHandler: config.analyticsHandler,
    };
  }

  /**
   * 开始性能标记
   */
  startMark(name: string, metadata?: Record<string, unknown>): void {
    if (!this.config.enabled) return;

    const mark: PerformanceMark = {
      name,
      startTime: performance.now(),
      metadata,
    };

    this.marks.set(name, mark);

    if (this.config.logToConsole) {
      console.log(`[Performance] ▶️ 开始标记: ${name}`, metadata || '');
    }
  }

  /**
   * 结束性能标记并记录测量结果
   */
  endMark(name: string, metadata?: Record<string, unknown>): number {
    if (!this.config.enabled) return 0;

    const mark = this.marks.get(name);
    if (!mark) {
      console.warn(`[Performance] ⚠️ 未找到标记: ${name}`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - mark.startTime;

    const measurement: PerformanceMeasurement = {
      name,
      duration,
      metadata: { ...mark.metadata, ...metadata },
    };

    this.measurements.push(measurement);
    this.marks.delete(name);

    if (this.config.logToConsole) {
      const durationStr = `${duration.toFixed(2)}ms`;
      const emoji = duration < 100 ? '✅' : duration < 500 ? '⚠️' : '❌';
      console.log(
        `[Performance] ${emoji} ${name}: ${durationStr}`,
        measurement.metadata || ''
      );
    }

    if (this.config.sendToAnalytics && this.config.analyticsHandler) {
      this.config.analyticsHandler(measurement);
    }

    return duration;
  }

  /**
   * 测量异步函数的性能
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    this.startMark(name, metadata);
    try {
      const result = await fn();
      this.endMark(name);
      return result;
    } catch (error) {
      this.endMark(name, { error: true });
      throw error;
    }
  }

  /**
   * 测量同步函数的性能
   */
  measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, unknown>
  ): T {
    this.startMark(name, metadata);
    try {
      const result = fn();
      this.endMark(name);
      return result;
    } catch (error) {
      this.endMark(name, { error: true });
      throw error;
    }
  }

  /**
   * 获取所有测量结果
   */
  getMeasurements(): PerformanceMeasurement[] {
    return [...this.measurements];
  }

  /**
   * 获取指定名称的测量结果
   */
  getMeasurementByName(name: string): PerformanceMeasurement[] {
    return this.measurements.filter((m) => m.name === name);
  }

  /**
   * 获取性能统计信息
   */
  getStats(name?: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    total: number;
  } {
    const filtered = name
      ? this.getMeasurementByName(name)
      : this.measurements;

    if (filtered.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0, total: 0 };
    }

    const durations = filtered.map((m) => m.duration);
    const total = durations.reduce((sum, d) => sum + d, 0);

    return {
      count: filtered.length,
      average: total / filtered.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      total,
    };
  }

  /**
   * 清除所有标记和测量结果
   */
  clear(): void {
    this.marks.clear();
    this.measurements = [];
    console.log('[Performance] 🧹 已清除所有标记和测量结果');
  }

  /**
   * 打印性能统计报告
   */
  logReport(name?: string): void {
    const stats = this.getStats(name);

    if (stats.count === 0) {
      console.log('[Performance] 📊 没有可用的统计数据');
      return;
    }

    console.log(`[Performance] 📊 性能统计报告${name ? ` (${name})` : ''}:`, {
      总次数: stats.count,
      平均耗时: `${stats.average.toFixed(2)}ms`,
      最小耗时: `${stats.min.toFixed(2)}ms`,
      最大耗时: `${stats.max.toFixed(2)}ms`,
      总耗时: `${stats.total.toFixed(2)}ms`,
    });
  }

  /**
   * 检查是否有未结束的标记
   */
  checkPendingMarks(): void {
    if (this.marks.size === 0) {
      console.log('[Performance] ✅ 没有未结束的标记');
      return;
    }

    console.warn('[Performance] ⚠️ 发现未结束的标记:');
    this.marks.forEach((mark, name) => {
      const elapsed = performance.now() - mark.startTime;
      console.warn(`  - ${name}: 已运行 ${elapsed.toFixed(2)}ms`);
    });
  }
}

/**
 * 全局单例性能监控器
 */
export const perfMonitor = new PerformanceMonitor({
  enabled: process.env.NODE_ENV === 'development',
  logToConsole: true,
  sendToAnalytics: false,
});

/**
 * 性能监控装饰器（用于类方法）
 *
 * @example
 * ```typescript
 * class MyClass {
 *   @PerformanceDecorator()
 *   myMethod() {
 *     // 方法实现
 *   }
 * }
 * ```
 */
export function PerformanceDecorator(name?: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const methodName = name || `${String(propertyKey)}`;

    descriptor.value = function (...args: unknown[]) {
      perfMonitor.startMark(methodName);
      try {
        const result = originalMethod.apply(this, args);
        // 如果是 Promise，等待完成后再结束标记
        if (result instanceof Promise) {
          return result
            .then((res) => {
              perfMonitor.endMark(methodName);
              return res;
            })
            .catch((err) => {
              perfMonitor.endMark(methodName, { error: true });
              throw err;
            });
        }
        perfMonitor.endMark(methodName);
        return result;
      } catch (error) {
        perfMonitor.endMark(methodName, { error: true });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Web Vitals 监控
 *
 * 监控 Core Web Vitals 指标
 */
export function setupWebVitals(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  // 监控 FCP (First Contentful Paint)
  try {
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          perfMonitor.startMark('FCP');
          perfMonitor.endMark('FCP', {
            value: entry.startTime,
            rating: entry.startTime < 1800 ? 'good' : 'needs-improvement',
          });
        }
      }
    });

    fcpObserver.observe({ entryTypes: ['paint'] });
  } catch (e) {
    console.warn('Failed to observe FCP:', e);
  }

  // 监控 LCP (Largest Contentful Paint)
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];

      perfMonitor.startMark('LCP');
      perfMonitor.endMark('LCP', {
        value: lastEntry.startTime,
        rating:
          lastEntry.startTime < 2500
            ? 'good'
            : lastEntry.startTime < 4000
            ? 'needs-improvement'
            : 'poor',
      });
    });

    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    console.warn('Failed to observe LCP:', e);
  }

  // 监控 FID (First Input Delay)
  try {
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceEventTiming[]) {
        perfMonitor.startMark('FID');
        perfMonitor.endMark('FID', {
          value: entry.processingStart - entry.startTime,
          rating:
            entry.processingStart - entry.startTime < 100
              ? 'good'
              : entry.processingStart - entry.startTime < 300
              ? 'needs-improvement'
              : 'poor',
        });
      }
    });

    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch (e) {
    console.warn('Failed to observe FID:', e);
  }

  console.log('[Performance] ✅ Web Vitals 监控已启动');
}

/**
 * 页面卸载时检查未结束的标记
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    perfMonitor.checkPendingMarks();
  });
}
