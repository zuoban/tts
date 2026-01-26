import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTTSStore } from "../hooks/useTTSStore";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Navbar } from "../components/layout/Navbar";
import { showSuccess, showInfo } from "../components/ui/Toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faKey, faSave, faTrash, faArrowLeft, faInfoCircle, faCheck } from "@fortawesome/free-solid-svg-icons";

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
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      
      <main className="container max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">系统设置</h1>
          <p className="text-muted-foreground">
            管理 API 密钥和其他系统配置
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <FontAwesomeIcon icon={faKey} />
                  <span>API 密钥配置</span>
                </div>
                
                <div className="relative">
                  <Input
                    id="apiKey"
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="font-mono text-center tracking-widest pr-20"
                  />
                  
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {tempApiKey ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        ACTIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                        EMPTY
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-muted/50 border border-border rounded-lg p-4 flex gap-3">
                  <FontAwesomeIcon icon={faInfoCircle} className="text-primary mt-0.5" />
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    若服务端未启用鉴权，此项可留空。若服务端配置了 API Key，请在此处填入以确保服务可用。
                  </div>
                </div>
              </div>

              <div className="pt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-border">
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  className="w-full sm:w-auto"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                  返回
                </Button>

                {tempApiKey && (
                  <Button 
                    variant="destructive" 
                    onClick={handleClearApiKey}
                    className="w-full sm:w-auto"
                  >
                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                    清除密钥
                  </Button>
                )}

                <Button 
                  onClick={handleSaveApiKey}
                  className="w-full sm:w-auto min-w-[120px]"
                >
                  <FontAwesomeIcon icon={faSave} className="mr-2" />
                  保存配置
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
