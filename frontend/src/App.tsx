import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTTSStore } from './hooks/useTTSStore';
import { Navbar } from './components/layout/Navbar';
import { SettingsModal } from './components/layout/SettingsModal';
import Home from './pages/Home';
import VoiceLibrary from './pages/VoiceLibrary';
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

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  return (
    <Router>
      <div className="App">
        {/* 导航栏 */}
        <Navbar onOpenSettings={handleOpenSettings} />

        {/* 路由内容 */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/voice-library" element={<VoiceLibrary />} />
        </Routes>

        {/* 设置弹窗 - 全局级别 */}
        <SettingsModal isOpen={showSettings} onClose={handleCloseSettings} />
      </div>
    </Router>
  );
}

export default App;
