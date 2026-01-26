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
    <div className="min-h-screen bg-gray-950 relative overflow-hidden font-sans selection:bg-green-500/30">
      {/* 动态背景网格 */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
            backgroundImage: `
                linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px),
                linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* 音频波形装饰 */}
      <div className="fixed top-20 left-0 right-0 h-32 opacity-20 pointer-events-none">
          <div className="h-full flex items-center justify-around">
              {[...Array(20)].map((_, i) => (
                  <div
                      key={i}
                      className="w-1 bg-gradient-to-t from-green-500 to-transparent rounded-full"
                      style={{
                          height: `${20 + Math.random() * 60}%`,
                          animationName: 'wave',
                          animationDuration: `${1 + Math.random()}s`,
                          animationTimingFunction: 'ease-in-out',
                          animationIterationCount: 'infinite',
                          animationDelay: `${i * 0.1}s`
                      }}
                  />
              ))}
          </div>
      </div>

      <style>{`
          @keyframes wave {
              0%, 100% { transform: scaleY(1); }
              50% { transform: scaleY(1.5); }
          }
      `}</style>

      <div className="relative z-10">
        <Navbar />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 头部区域 - 与其他页面一致 */}
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="relative group">
               <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
               
               <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 tracking-tight mb-2">
                 系统设置
               </h1>
               <p className="text-gray-400 font-mono text-sm tracking-wide">
                 CONFIGURATION & PARAMETERS
               </p>
            </div>
          </div>

          <div className="relative group">
             {/* 边框流光效果 - 调整为更柔和 */}
             <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-1000"></div>
             
             {/* 卡片容器 - 与 Templates 列表背景一致 */}
             <div className="relative bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-8 md:p-10">
                   {/* 设置表单 */}
                   <div className="space-y-8 max-w-2xl mx-auto">
                      <div className="space-y-4">
                         <label className="block text-sm font-medium text-gray-300 uppercase tracking-wider font-mono flex items-center gap-2">
                           <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                           API 密钥配置
                         </label>
                         
                         <div className="relative">
                            <Input
                              id="apiKey"
                              type="password"
                              value={tempApiKey}
                              onChange={(e) => setTempApiKey(e.target.value)}
                              placeholder="sk-..."
                              className="text-center text-lg bg-gray-800/50 border-gray-700 text-white placeholder-gray-600 focus:border-green-500 focus:ring-green-500/20 py-4 tracking-widest font-mono"
                            />
                            
                            {/* 状态指示灯 */}
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                               {tempApiKey ? (
                                 <div className="flex items-center gap-1.5 text-green-400 bg-green-500/10 px-2 py-1 rounded-md border border-green-500/20">
                                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                   <span className="text-[10px] font-mono font-bold">ACTIVE</span>
                                 </div>
                               ) : (
                                 <div className="flex items-center gap-1.5 text-gray-500 bg-gray-800 px-2 py-1 rounded-md border border-gray-700">
                                   <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
                                   <span className="text-[10px] font-mono font-bold">EMPTY</span>
                                 </div>
                               )}
                            </div>
                         </div>

                         {/* 说明信息 */}
                         <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                            </svg>
                            <div className="text-sm text-gray-400 leading-relaxed">
                               若服务端未启用鉴权，此项可留空。若服务端配置了 API Key，请在此处填入以确保服务可用。
                            </div>
                         </div>
                      </div>

                      {/* 按钮组 */}
                      <div className="pt-6 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-gray-800">
                         {tempApiKey && (
                           <button
                             onClick={handleClearApiKey}
                             className="w-full sm:w-auto px-6 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 font-medium rounded-lg hover:bg-red-500/20 hover:text-red-300 transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                           >
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                             </svg>
                             清除密钥
                           </button>
                         )}

                         <button
                           onClick={handleCancel}
                           className="w-full sm:w-auto px-6 py-2.5 bg-gray-800 text-gray-300 border border-gray-700 font-medium rounded-lg hover:bg-gray-700 hover:text-white transition-all duration-300 text-sm"
                         >
                           返回
                         </button>

                         <button
                           onClick={handleSaveApiKey}
                           className="w-full sm:w-auto px-8 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
                         >
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                           </svg>
                           保存配置
                         </button>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </main>
      </div>
    </div>
  );
}
