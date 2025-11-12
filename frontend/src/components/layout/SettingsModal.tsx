import React, { useState, useEffect } from 'react';
import { useTTSStore } from '../../hooks/useTTSStore';
import { Button } from '../ui/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faKey, faFloppyDisk, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { apiKey, setApiKey, clearError } = useTTSStore();
  const [tempApiKey, setTempApiKey] = useState(apiKey);

  useEffect(() => {
    setTempApiKey(apiKey);
  }, [apiKey]);

  useEffect(() => {
    console.log('SettingsModal isOpen:', isOpen);
  }, [isOpen]);

  const handleSaveApiKey = () => {
    localStorage.setItem('tts_api_key', tempApiKey);
    setApiKey(tempApiKey);
    clearError();
    onClose();
  };

  const handleClearApiKey = () => {
    setTempApiKey('');
    localStorage.removeItem('tts_api_key');
    setApiKey('');
    clearError();
    onClose();
  };

  const handleCancel = () => {
    setTempApiKey(apiKey);
    onClose();
  };

  if (!isOpen) return null;

  return (
    isOpen ? (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faCog} className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">设置</h2>
          </div>
          <button
            onClick={handleCancel}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-8">
          {/* API Key 输入 */}
          <div className="space-y-4">
            <div className="text-center mb-6">
              <FontAwesomeIcon icon={faKey} className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">API Key</h3>
              <p className="text-sm text-gray-500 mt-1">可选：设置您的API密钥以访问所有功能</p>
            </div>

            <input
              id="apiKey"
              type="password"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder="输入您的 API Key（可选）"
              className="block w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400 text-center"
            />

            {tempApiKey && (
              <div className="flex items-center justify-center space-x-2 text-green-600 text-sm">
                <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                <span>API Key 已设置</span>
              </div>
            )}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-center space-x-3 p-6 border-t border-gray-200/50 bg-gray-50/30 rounded-b-xl">
          <Button
            onClick={handleSaveApiKey}
            variant="default"
            size="sm"
            className="flex items-center space-x-2 px-6"
          >
            <FontAwesomeIcon icon={faFloppyDisk} className="w-3 h-3" />
            <span>保存</span>
          </Button>

          {tempApiKey && (
            <Button
              onClick={handleClearApiKey}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 text-red-600 border-red-300 hover:bg-red-50 px-6"
            >
              <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
              <span>清除</span>
            </Button>
          )}

          <Button
            onClick={handleCancel}
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-6"
          >
            取消
          </Button>
        </div>
      </div>
    </div>
    ) : null
  );
};