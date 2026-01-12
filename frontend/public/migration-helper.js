/**
 * TTS Store 迁移助手脚本
 *
 * 使用方法：
 * 1. 打开浏览器控制台
 * 2. 粘贴此脚本内容
 * 3. 执行对应的迁移命令
 */

(function() {
  'use strict';

  console.group('🚀 TTS Store 迁移助手');

  // ========== 迁移函数 ==========

  /**
   * 检查是否需要迁移
   */
  function checkMigrationNeeded() {
    const hasOldStore = localStorage.getItem('tts-store') !== null;
    const hasNewStores =
      localStorage.getItem('tts-form-store') !== null ||
      localStorage.getItem('tts-data-store') !== null;

    return hasOldStore && !hasNewStores;
  }

  /**
   * 显示迁移状态
   */
  function showMigrationStatus() {
    const backups = Object.keys(localStorage).filter((key) =>
      key.startsWith('tts-store.backup.')
    );

    const status = {
      旧版本Store: localStorage.getItem('tts-store') ? '✅ 存在' : '❌ 不存在',
      新版本Stores:
        localStorage.getItem('tts-form-store') ||
        localStorage.getItem('tts-data-store')
          ? '✅ 存在'
          : '❌ 不存在',
      备份文件: backups.length > 0 ? `✅ ${backups.length} 个` : '❌ 无',
      存储使用: (() => {
        let used = 0;
        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            used += localStorage[key].length + key.length;
          }
        }
        return `${(used / 1024).toFixed(2)} KB`;
      })(),
    };

    console.table(status);
    return status;
  }

  /**
   * 执行迁移
   */
  function migrateStore() {
    console.log('📦 开始迁移...');

    const oldStoreData = localStorage.getItem('tts-store');
    if (!oldStoreData) {
      console.log('⚠️  未找到旧版本的 tts-store，无需迁移');
      return false;
    }

    try {
      const oldStore = JSON.parse(oldStoreData);
      let migratedCount = 0;

      // 1. 迁移表单数据
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
        migratedCount++;
        console.log('✅ 已迁移表单数据到 formStore');
      }

      // 2. 迁移历史记录
      if (oldStore.history && Array.isArray(oldStore.history) && oldStore.history.length > 0) {
        const dataStoreData = {
          history: oldStore.history.map((item) => ({
            ...item,
            createdAt: new Date(item.createdAt),
          })),
        };
        localStorage.setItem('tts-data-store', JSON.stringify(dataStoreData));
        migratedCount++;
        console.log(`✅ 已迁移 ${oldStore.history.length} 条历史记录到 dataStore`);
      }

      // 3. 备份旧 Store
      const timestamp = Date.now();
      localStorage.setItem(`tts-store.backup.${timestamp}`, oldStoreData);
      console.log(`✅ 已备份旧 Store 为 tts-store.backup.${timestamp}`);

      // 4. 删除旧 Store
      localStorage.removeItem('tts-store');
      console.log('✅ 已删除旧 Store');

      console.log(`🎉 迁移完成！共迁移 ${migratedCount} 项数据`);
      return true;
    } catch (error) {
      console.error('❌ 迁移失败:', error);
      return false;
    }
  }

  /**
   * 回滚迁移
   */
  function rollbackMigration() {
    console.log('⏪ 开始回滚...');

    // 查找备份
    const backups = Object.keys(localStorage)
      .filter((key) => key.startsWith('tts-store.backup.'))
      .sort()
      .reverse();

    if (backups.length === 0) {
      console.log('❌ 未找到备份文件');
      return false;
    }

    const backupKey = backups[0];
    const backupData = localStorage.getItem(backupKey);

    if (!backupData) {
      console.log('❌ 备份文件为空');
      return false;
    }

    try {
      // 恢复旧 Store
      localStorage.setItem('tts-store', backupData);
      console.log(`✅ 已从 ${backupKey} 恢复旧 Store`);

      // 删除新的 Store
      localStorage.removeItem('tts-form-store');
      localStorage.removeItem('tts-data-store');
      console.log('✅ 已删除新版本 Stores');

      console.log('🎉 回滚完成！');
      return true;
    } catch (error) {
      console.error('❌ 回滚失败:', error);
      return false;
    }
  }

  /**
   * 清理备份
   */
  function cleanupBackups() {
    console.log('🧹 开始清理备份...');

    const backups = Object.keys(localStorage).filter((key) =>
      key.startsWith('tts-store.backup.')
    );

    backups.forEach((key) => {
      localStorage.removeItem(key);
    });

    console.log(`✅ 已清理 ${backups.length} 个备份文件`);
    return backups.length;
  }

  /**
   * 清理所有 TTS 数据（危险操作）
   */
  function clearAllTTSData() {
    if (!confirm('⚠️  警告：这将删除所有 TTS 相关数据，是否继续？')) {
      console.log('❌ 操作已取消');
      return;
    }

    console.log('🗑️  清理所有 TTS 数据...');

    const keysToRemove: string[] = [];

    for (let key in localStorage) {
      if (key.startsWith('tts-') || key.startsWith('tts_')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });

    console.log(`✅ 已清理 ${keysToRemove.length} 个存储项`);
    console.log('📝 清理的键：', keysToRemove);

    return keysToRemove;
  }

  // ========== 导出命令 ==========

  window.TTSMigration = {
    /**
     * 检查是否需要迁移
     */
    check: () => {
      const needed = checkMigrationNeeded();
      console.log(needed ? '⚠️  需要迁移' : '✅ 无需迁移');
      return needed;
    },

    /**
     * 显示当前状态
     */
    status: () => {
      return showMigrationStatus();
    },

    /**
     * 执行迁移
     */
    migrate: () => {
      return migrateStore();
    },

    /**
     * 回滚到旧版本
     */
    rollback: () => {
      return rollbackMigration();
    },

    /**
     * 清理备份文件
     */
    cleanup: () => {
      return cleanupBackups();
    },

    /**
     * 清理所有 TTS 数据（危险）
     */
    clearAll: () => {
      return clearAllTTSData();
    },

    /**
     * 显示帮助信息
     */
    help: () => {
      console.log(`
📖 可用命令：

  TTSMigration.check()      - 检查是否需要迁移
  TTSMigration.status()     - 显示当前存储状态
  TTSMigration.migrate()    - 执行数据迁移
  TTSMigration.rollback()   - 回滚到旧版本
  TTSMigration.cleanup()    - 清理备份文件
  TTSMigration.clearAll()   - 清理所有 TTS 数据（危险）
  TTSMigration.help()       - 显示此帮助信息

📝 使用示例：
  1. 检查状态：TTSMigration.status()
  2. 执行迁移：TTSMigration.migrate()
  3. 如有问题回滚：TTSMigration.rollback()
      `);
    },
  };

  console.groupEnd();

  // ========== 初始提示 ==========

  console.log('✅ 迁移助手已加载！');
  console.log('');
  console.log('📖 快速开始：');
  console.log('  1. TTSMigration.status()  - 查看当前状态');
  console.log('  2. TTSMigration.migrate() - 执行迁移');
  console.log('  3. TTSMigration.help()    - 查看所有命令');
  console.log('');

  // 自动检查是否需要迁移
  if (checkMigrationNeeded()) {
    console.log('⚠️  检测到需要迁移的数据');
    console.log('💡 执行 TTSMigration.migrate() 开始迁移');
  } else {
    console.log('✅ 当前无需迁移');
  }

})();
