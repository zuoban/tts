/**
 * 数据迁移工具
 *
 * 用于从旧的单一 Store 迁移到新的拆分 Store
 */

import { storageStats } from './storage';

/**
 * 旧 Store 状态接口
 */
interface OldTTSStore {
  text?: string;
  voice?: string;
  style?: string;
  rate?: string;
  pitch?: string;
  locale?: string;
  apiKey?: string;
  history?: any[];
  [key: string]: any;
}

/**
 * 迁移结果
 */
interface MigrationResult {
  success: boolean;
  message: string;
  oldStoreSize: number;
  newStoresSize: number;
  migratedItems: string[];
  errors: string[];
}

/**
 * 从旧的 tts-store 迁移数据到新的拆分 Store
 */
export function migrateFromOldStore(): MigrationResult {
  const result: MigrationResult = {
    success: false,
    message: '',
    oldStoreSize: 0,
    newStoresSize: 0,
    migratedItems: [],
    errors: [],
  };

  try {
    // 1. 检查旧 Store 是否存在
    const oldStoreData = localStorage.getItem('tts-store');
    if (!oldStoreData) {
      result.message = '未找到旧版本的 tts-store，无需迁移';
      result.success = true;
      return result;
    }

    // 2. 解析旧 Store 数据
    let oldStore: OldTTSStore;
    try {
      oldStore = JSON.parse(oldStoreData);
      result.oldStoreSize = oldStoreData.length;
    } catch (error) {
      result.errors.push('解析旧 Store 数据失败');
      result.message = '迁移失败：无法解析旧数据';
      return result;
    }

    // 3. 迁移表单数据到 formStore
    if (oldStore.text || oldStore.voice || oldStore.style) {
      const formData = {
        text: oldStore.text || '',
        voice: oldStore.voice || '',
        style: oldStore.style || '',
        rate: oldStore.rate || '0',
        pitch: oldStore.pitch || '0',
        locale: oldStore.locale || '',
        apiKey: oldStore.apiKey || '',
      };

      localStorage.setItem('tts-form-store', JSON.stringify(formData));
      result.migratedItems.push('formStore');
      console.log('✅ 已迁移表单数据到 formStore');
    }

    // 4. 迁移历史记录到 dataStore
    if (oldStore.history && Array.isArray(oldStore.history) && oldStore.history.length > 0) {
      const dataStoreData = {
        history: oldStore.history.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
        })),
      };

      localStorage.setItem('tts-data-store', JSON.stringify(dataStoreData));
      result.migratedItems.push('dataStore (history)');
      console.log(`✅ 已迁移 ${oldStore.history.length} 条历史记录到 dataStore`);
    }

    // 5. 计算新 Store 大小
    result.newStoresSize =
      (localStorage.getItem('tts-form-store')?.length || 0) +
      (localStorage.getItem('tts-data-store')?.length || 0);

    // 6. 备份旧 Store（重命名为 .backup）
    const timestamp = Date.now();
    localStorage.setItem(`tts-store.backup.${timestamp}`, oldStoreData);
    result.migratedItems.push(`旧 Store 已备份为 tts-store.backup.${timestamp}`);

    // 7. 删除旧 Store
    localStorage.removeItem('tts-store');
    result.migratedItems.push('已删除旧 Store');

    result.success = true;
    result.message = `迁移成功！已迁移 ${result.migratedItems.length} 项数据`;
    console.log('✅ 数据迁移完成:', result);
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : '未知错误');
    result.message = '迁移过程中发生错误';
    console.error('❌ 数据迁移失败:', error);
  }

  return result;
}

/**
 * 检查是否需要迁移
 */
export function needsMigration(): boolean {
  // 检查是否存在旧版本的 tts-store
  const hasOldStore = localStorage.getItem('tts-store') !== null;

  // 检查是否已经有新的 Store
  const hasNewStores =
    localStorage.getItem('tts-form-store') !== null ||
    localStorage.getItem('tts-data-store') !== null;

  // 如果有旧 Store 且没有新 Store，需要迁移
  return hasOldStore && !hasNewStores;
}

/**
 * 回滚迁移（从备份恢复旧 Store）
 */
export function rollbackMigration(backupTimestamp?: number): boolean {
  try {
    // 查找备份文件
    let backupKey: string | null;

    if (backupTimestamp) {
      backupKey = `tts-store.backup.${backupTimestamp}`;
    } else {
      // 查找最新的备份
      const backups = Object.keys(localStorage)
        .filter((key) => key.startsWith('tts-store.backup.'))
        .sort()
        .reverse();

      if (backups.length === 0) {
        console.error('未找到备份文件');
        return false;
      }

      backupKey = backups[0];
    }

    const backupData = localStorage.getItem(backupKey);
    if (!backupData) {
      console.error('备份文件为空');
      return false;
    }

    // 恢复旧 Store
    localStorage.setItem('tts-store', backupData);

    // 删除新的 Store
    localStorage.removeItem('tts-form-store');
    localStorage.removeItem('tts-data-store');

    console.log('✅ 已回滚到旧版本 Store');
    return true;
  } catch (error) {
    console.error('❌ 回滚失败:', error);
    return false;
  }
}

/**
 * 清理所有备份文件
 */
export function cleanupBackups(): number {
  let cleaned = 0;

  const backups = Object.keys(localStorage).filter((key) =>
    key.startsWith('tts-store.backup.')
  );

  backups.forEach((key) => {
    localStorage.removeItem(key);
    cleaned++;
  });

  if (cleaned > 0) {
    console.log(`✅ 已清理 ${cleaned} 个备份文件`);
  }

  return cleaned;
}

/**
 * 获取迁移状态
 */
export function getMigrationStatus(): {
  hasOldStore: boolean;
  hasNewStores: boolean;
  hasBackup: boolean;
  backups: string[];
  storageUsage: ReturnType<typeof storageStats.getUsage>;
  ttsStorageSize: number;
} {
  const backups = Object.keys(localStorage).filter((key) =>
    key.startsWith('tts-store.backup.')
  );

  return {
    hasOldStore: localStorage.getItem('tts-store') !== null,
    hasNewStores:
      localStorage.getItem('tts-form-store') !== null ||
      localStorage.getItem('tts-data-store') !== null,
    hasBackup: backups.length > 0,
    backups,
    storageUsage: storageStats.getUsage(),
    ttsStorageSize: storageStats.getTTSStorageSize(),
  };
}

/**
 * 在控制台显示迁移状态
 */
export function logMigrationStatus(): void {
  const status = getMigrationStatus();

  console.group('📊 TTS Store 迁移状态');
  console.log('旧版本 Store:', status.hasOldStore ? '✅ 存在' : '❌ 不存在');
  console.log('新版本 Stores:', status.hasNewStores ? '✅ 存在' : '❌ 不存在');
  console.log('备份文件:', status.hasBackup ? `✅ ${status.backups.length} 个` : '❌ 无');

  console.group('💾 存储使用情况');
  console.log(`已使用: ${(status.storageUsage.used / 1024).toFixed(2)} KB`);
  console.log(`总容量: ${(status.storageUsage.total / 1024 / 1024).toFixed(2)} MB`);
  console.log(`使用率: ${status.storageUsage.percentage.toFixed(2)}%`);
  console.log(`TTS 数据: ${(status.ttsStorageSize / 1024).toFixed(2)} KB`);
  console.groupEnd();

  console.groupEnd();
}
