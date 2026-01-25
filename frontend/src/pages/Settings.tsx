import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTTSStore } from "../hooks/useTTSStore";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Navbar } from "../components/layout/Navbar";
import { showSuccess, showInfo } from "../components/ui/Toast";

export default function Settings() {
  const navigate = useNavigate();
  const { apiKey, setApiKey, clearError } = useTTSStore();
  const [tempApiKey, setTempApiKey] = useState(apiKey);

  useEffect(() => {
    setTempApiKey(apiKey);
  }, [apiKey]);

  const handleSaveApiKey = () => {
    localStorage.setItem("tts_api_key", tempApiKey);
    setApiKey(tempApiKey);
    clearError();
    showSuccess("设置已保存");
    navigate(-1);
  };

  const handleClearApiKey = () => {
    setTempApiKey("");
    localStorage.removeItem("tts_api_key");
    setApiKey("");
    clearError();
    showInfo("API Key 已清除");
    navigate(-1);
  };

  const handleCancel = () => {
    setTempApiKey(apiKey);
    navigate(-1);
  };

  return (
    <div className="page-bg">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="card overflow-hidden">
          <div className="card-header-secondary">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-xl p-3">
                <svg
                  className="w-8 h-8 text-white"
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
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">设置</h1>
                <p className="text-purple-100 text-lg mt-1">
                  配置您的 TTS 服务参数
                </p>
              </div>
            </div>
          </div>

          <div className="card-body space-y-8">
            {/* API Key 配置 */}
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg
                    className="w-8 h-8 text-white"
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
                <h2 className="text-2xl font-semibold text-gray-900">API 密钥</h2>
                <p className="text-gray-600 mt-2">
                  可选：设置您的服务器中设置的 API_KEY
                </p>
              </div>

              <Input
                id="apiKey"
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="输入您的 API Key（可选）"
                className="text-center text-lg"
              />

              {tempApiKey && (
                <div className="flex items-center justify-center space-x-2 text-green-600 bg-green-50 py-3 px-6 rounded-xl border border-green-200">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium">API Key 已配置</span>
                </div>
              )}

              {!tempApiKey && (
                <div className="flex items-center justify-center space-x-2 text-gray-500 bg-gray-50 py-3 px-6 rounded-xl border border-gray-200">
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
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium">API Key 未配置</span>
                </div>
              )}
            </div>

            {/* 说明信息 */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-blue-500"
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
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    关于 API 密钥
                  </h3>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    若服务端未配置 API KEY，可以任意填写。若服务端配置了 API
                    KEY，则必须填写正确的 API KEY。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card-footer">
            <div className="flex justify-center space-x-4">
              <Button
                onClick={handleSaveApiKey}
                className="flex items-center space-x-2 px-8 py-3 text-base"
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
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2"
                  />
                </svg>
                <span>保存设置</span>
              </Button>

              {tempApiKey && (
                <Button
                  onClick={handleClearApiKey}
                  variant="ghost"
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-8 py-3 text-base"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span>清除密钥</span>
                </Button>
              )}

              <Button
                onClick={handleCancel}
                variant="outline"
                className="px-8 py-3 text-base"
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
