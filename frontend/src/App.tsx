import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTTSStore } from './hooks/useTTSStore';
import { needsMigration, migrateFromOldStore } from './utils/migration';
import { setupWebVitals, perfMonitor } from './utils/performanceMonitor';
import { audioManager } from './utils/audioResourceManager';
import { SettingsModal } from './components/layout/SettingsModal';
import Home from './pages/Home';
import Landing from './pages/Landing';
import './styles/globals.css';

function App() {
  const { apiKey } = useTTSStore();
  const [showSettings, setShowSettings] = useState(false);

  // ========== 性能监控和 Web Vitals ==========
  // 应用启动时初始化性能监控
  useEffect(() => {
    // 仅在开发环境启用详细性能监控
    if (process.env.NODE_ENV === 'development') {
      setupWebVitals();
      console.log('[Performance] ✅ 性能监控已启动');
    }

    // 开发环境：定期打印音频资源管理器统计
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        audioManager.logStats();
      }, 60000); // 每分钟打印一次

      return () => clearInterval(interval);
    }
  }, []);

  // ========== 数据迁移逻辑 ==========
  // 应用启动时自动执行数据迁移
  useEffect(() => {
    perfMonitor.startMark('app-initialization');

    const runMigration = async () => {
      if (needsMigration()) {
        perfMonitor.startMark('data-migration');
        console.log('🔄 检测到需要迁移的数据...');
        const result = migrateFromOldStore();
        console.log(result.message);
        perfMonitor.endMark('data-migration');

        if (result.success) {
          console.log('✅ 数据迁移成功！');
          console.log('💡 建议刷新页面以使用新的 Store 架构');
        } else {
          console.error('❌ 数据迁移失败:', result.errors);
        }
      }
    };

    runMigration();
    perfMonitor.endMark('app-initialization');
  }, []);

  // 从 localStorage 恢复 API Key
  React.useEffect(() => {
    const savedApiKey = localStorage.getItem('tts_api_key');
    if (savedApiKey && !apiKey) {
      perfMonitor.startMark('api-key-restore');
      useTTSStore.getState().setApiKey(savedApiKey);
      perfMonitor.endMark('api-key-restore');
    }
  }, [apiKey]);

  // 全局键盘事件处理
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC 键关闭设置弹窗
      if (event.key === 'Escape' && showSettings) {
        setShowSettings(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSettings]);

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  return (
    <Router>
      <div className="App">
        {/* 路由内容 */}
        <Routes>
          <Route path="/" element={<Home onOpenSettings={handleOpenSettings} />} />
          <Route path="/landing" element={<Landing />} />
        </Routes>

        {/* 设置弹窗 - 全局级别 */}
        <SettingsModal isOpen={showSettings} onClose={handleCloseSettings} />
      </div>
    </Router>
  );
}

export default App;
