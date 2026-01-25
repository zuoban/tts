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
    <div className="min-h-screen bg-gray-950 relative overflow-hidden font-sans selection:bg-blue-500/30">
      {/* 动态背景网格 */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
            backgroundImage: `
                linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* 装饰性光晕 */}
      <div className="fixed top-1/2 left-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>

      <div className="relative z-10">
        <Navbar />
        
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="relative group">
             {/* 边框流光效果 */}
             <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl opacity-30 group-hover:opacity-60 blur transition duration-1000"></div>
             
             <div className="relative bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                {/* 头部装饰 */}
                <div className="h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500"></div>
                
                <div className="p-8 md:p-12">
                   {/* 标题区域 */}
                   <div className="text-center mb-10">
                      <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-gray-700 relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                         <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                         <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                           <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                         </svg>
                      </div>
                      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">系统设置</h1>
                      <p className="text-gray-400 mt-2 font-mono text-sm">CONFIGURATION & PARAMETERS</p>
                   </div>

                   {/* 设置表单 */}
                   <div className="space-y-8 max-w-lg mx-auto">
                      <div className="space-y-4">
                         <label className="block text-sm font-medium text-gray-300 uppercase tracking-wider font-mono">
                           API 密钥配置
                         </label>
                         
                         <div className="relative">
                            <Input
                              id="apiKey"
                              type="password"
                              value={tempApiKey}
                              onChange={(e) => setTempApiKey(e.target.value)}
                              placeholder="sk-..."
                              className="text-center text-lg bg-gray-800/50 border-gray-700 text-white placeholder-gray-600 focus:border-blue-500 focus:ring-blue-500/20 py-4 tracking-widest"
                            />
                            
                            {/* 状态指示灯 */}
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                               {tempApiKey ? (
                                 <div className="flex items-center gap-1.5 text-green-400">
                                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                   <span className="text-xs font-mono">ACTIVE</span>
                                 </div>
                               ) : (
                                 <div className="flex items-center gap-1.5 text-gray-500">
                                   <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                                   <span className="text-xs font-mono">EMPTY</span>
                                 </div>
                               )}
                            </div>
                         </div>

                         {/* 说明信息 */}
                         <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                            <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                            </svg>
                            <div className="text-sm text-blue-300 leading-relaxed">
                               若服务端未启用鉴权，此项可留空。若服务端配置了 API Key，请在此处填入以确保服务可用。
                            </div>
                         </div>
                      </div>

                      {/* 按钮组 */}
                      <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                         <button
                           onClick={handleSaveApiKey}
                           className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-xl hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                         >
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                           </svg>
                           保存配置
                         </button>

                         {tempApiKey && (
                           <button
                             onClick={handleClearApiKey}
                             className="w-full sm:w-auto px-8 py-3 bg-red-500/10 text-red-400 border border-red-500/20 font-medium rounded-xl hover:bg-red-500/20 hover:text-red-300 transition-all duration-300 flex items-center justify-center gap-2"
                           >
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                             </svg>
                             清除密钥
                           </button>
                         )}

                         <button
                           onClick={handleCancel}
                           className="w-full sm:w-auto px-8 py-3 bg-gray-800 text-gray-300 border border-gray-700 font-medium rounded-xl hover:bg-gray-700 hover:text-white transition-all duration-300"
                         >
                           返回
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
