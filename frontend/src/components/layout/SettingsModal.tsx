import React, { useState, useEffect } from "react";
import { useTTSStore } from "../../hooks/useTTSStore";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

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

    // 显示保存成功提示
    const successMessage = document.createElement("div");
    successMessage.className =
      "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm animate-pulse";
    successMessage.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>设置已保存</span>
      </div>
    `;
    document.body.appendChild(successMessage);

    setTimeout(() => {
      successMessage.remove();
    }, 2000);

    onClose();
  };

  const handleClearApiKey = () => {
    setTempApiKey("");
    localStorage.removeItem("tts_api_key");
    setApiKey("");
    clearError();

    // 显示清除成功提示
    const clearMessage = document.createElement("div");
    clearMessage.className =
      "fixed top-4 right-4 bg-gray-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm animate-pulse";
    clearMessage.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>API Key 已清除</span>
      </div>
    `;
    document.body.appendChild(clearMessage);

    setTimeout(() => {
      clearMessage.remove();
    }, 2000);

    onClose();
  };

  const handleCancel = () => {
    setTempApiKey(apiKey);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white backdrop-blur-xl rounded-2xl shadow-2xl border-0 w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center">
                <svg
                  className="w-6 h-6 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                设置
              </h2>
              <p className="text-purple-100 text-sm mt-1">
                配置您的 TTS 服务参数
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* API Key 配置 */}
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 7h2a5 5 0 015 5v5a5 5 0 01-5 5h-4a5 5 0 01-5-5v-5a5 5 0 015-5h2m-2 4h8m-8 4h8"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">API 密钥</h3>
              <p className="text-sm text-gray-600 mt-1">
                可选：设置您的服务器中设置的 API_KEY
              </p>
            </div>

            <Input
              id="apiKey"
              type="password"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder="输入您的 API Key（可选）"
              className="text-center"
            />

            {tempApiKey && (
              <div className="flex items-center justify-center space-x-2 text-green-600 text-sm bg-green-50 py-2 px-4 rounded-lg">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>API Key 已配置</span>
              </div>
            )}

            {!tempApiKey && (
              <div className="flex items-center justify-center space-x-2 text-gray-500 text-sm bg-gray-50 py-2 px-4 rounded-lg">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>API Key 未配置</span>
              </div>
            )}
          </div>

          {/* 说明信息 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-blue-500 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  关于 API 密钥
                </h4>
                <p className="text-xs text-blue-700 leading-relaxed">
                  若服务端未配置 API KEY，可以任意填写。若服务端配置了 API
                  KEY，则必须填写正确的 API KEY。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-200/50 bg-gray-50/30">
          <div className="flex justify-center space-x-3">
            <Button
              onClick={handleSaveApiKey}
              className="flex items-center space-x-2 px-6"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2"
                />
              </svg>
              <span>保存设置</span>
            </Button>

            {tempApiKey && (
              <Button
                onClick={handleClearApiKey}
                variant="ghost"
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-6"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span>清除密钥</span>
              </Button>
            )}

            <Button onClick={handleCancel} variant="outline" className="px-6">
              取消
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
