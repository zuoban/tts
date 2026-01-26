import React, { useState, useEffect } from "react";
import { useTTSStore } from "../../hooks/useTTSStore";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { showSuccess, showInfo } from "../ui/Toast";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { apiKey, setApiKey, clearError } = useTTSStore();
  const [tempApiKey, setTempApiKey] = useState(apiKey);

  useEffect(() => {
    if (isOpen) {
      setTempApiKey(apiKey);
    }
  }, [apiKey, isOpen]);

  const handleSaveApiKey = () => {
    localStorage.setItem("tts_api_key", tempApiKey);
    setApiKey(tempApiKey);
    clearError();
    showSuccess('设置已保存');
    onClose();
  };

  const handleClearApiKey = () => {
    setTempApiKey("");
    localStorage.removeItem("tts_api_key");
    setApiKey("");
    clearError();
    showInfo('API Key 已清除');
    onClose();
  };

  const handleCancel = () => {
    setTempApiKey(apiKey);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
        {/* 顶部装饰条 */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500"></div>

        {/* 头部 */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
              系统设置
            </h2>
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-400 text-sm ml-3.5 pl-0">
             配置您的 TTS 服务连接参数
          </p>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* API Key 配置 */}
          <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wider font-mono">
                 API 密钥
               </label>
               <div className="relative">
                 <Input
                    id="apiKey"
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-600 focus:border-blue-500 focus:ring-blue-500/20 pr-10"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {tempApiKey ? (
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                    ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                    )}
                  </div>
               </div>
             </div>

            {/* 说明信息 */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex gap-3">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <div className="text-xs text-blue-300 leading-relaxed">
                若服务端未启用鉴权，此项可留空。若服务端配置了 API Key，请在此处填入。
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-700 flex justify-end gap-3">
            {tempApiKey && (
              <button
                onClick={handleClearApiKey}
                className="px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
              >
                清除密钥
              </button>
            )}
            
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              取消
            </button>
            
            <button
              onClick={handleSaveApiKey}
              className="px-6 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
            >
              保存更改
            </button>
        </div>
      </div>
    </div>
  );
};
