import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTTSStore } from './hooks/useTTSStore';
import { SettingsModal } from './components/layout/SettingsModal';
import Home from './pages/Home';
import './styles/globals.css';

function App() {
  const { apiKey } = useTTSStore();
  const [showSettings, setShowSettings] = useState(false);

  // 从 localStorage 恢复 API Key
  React.useEffect(() => {
    const savedApiKey = localStorage.getItem('tts_api_key');
    if (savedApiKey && !apiKey) {
      useTTSStore.getState().setApiKey(savedApiKey);
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
        </Routes>

        {/* 设置弹窗 - 全局级别 */}
        <SettingsModal isOpen={showSettings} onClose={handleCloseSettings} />
      </div>
    </Router>
  );
}

export default App;
