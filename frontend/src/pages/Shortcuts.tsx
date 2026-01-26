import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';

export default function Shortcuts() {
  const shortcuts = [
    {
      category: '文本操作',
      shortcuts: [
        { key: 'Ctrl+E / Cmd+E', desc: '聚焦文本输入框' },
        { key: 'Ctrl+Enter / Cmd+Enter', desc: '生成语音（输入框中）' },
      ]
    },
    {
      category: '语音操作',
      shortcuts: [
        { key: 'Ctrl+K / Cmd+K', desc: '打开声音库' },
        { key: 'Ctrl+P / Cmd+P', desc: '打开收藏管理' },
        { key: 'Ctrl+I / Cmd+I', desc: '打开文本模板' },
      ]
    },
    {
      category: '其他操作',
      shortcuts: [
        { key: 'Ctrl+/ / Cmd+/', desc: '显示快捷键帮助' },
        { key: 'Esc', desc: '关闭弹窗/对话框' },
      ]
    }
  ];

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
        <Navbar showShortcutsHelp={() => {}} />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* 标题 */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 mb-6 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                </svg>
            </div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 mb-4 tracking-tight">
                快捷键帮助
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto font-light">
                像专业人士一样使用键盘，提高您的工作效率
            </p>
          </div>

          {/* 快捷键列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shortcuts.map((group, index) => (
              <div key={index} className="group relative">
                {/* 卡片背景 */}
                <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800/50 shadow-xl transition-all duration-300 group-hover:bg-gray-800/60 group-hover:border-green-500/30 group-hover:shadow-green-500/10 group-hover:shadow-2xl"></div>
                
                {/* 装饰线 */}
                <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative p-6">
                   {/* 分类标题 */}
                   <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                      {group.category}
                   </h2>

                   {/* 列表项 */}
                   <div className="space-y-4">
                     {group.shortcuts.map((shortcut, idx) => (
                       <div key={idx} className="flex flex-col gap-2">
                          <div className="flex items-center">
                             <span className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">
                                {shortcut.desc}
                             </span>
                          </div>
                          <div className="flex">
                             {shortcut.key.split(' / ').map((k, i, arr) => (
                                <React.Fragment key={i}>
                                   <kbd className="px-2.5 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs font-mono text-green-300 shadow-lg shadow-black/20 group-hover:border-green-500/30 group-hover:text-green-200 transition-all duration-300">
                                      {k}
                                   </kbd>
                                   {i < arr.length - 1 && (
                                      <span className="mx-2 text-gray-600 text-xs self-center">/</span>
                                   )}
                                </React.Fragment>
                             ))}
                          </div>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            ))}
          </div>

          {/* 提示信息 */}
          <div className="mt-12 max-w-2xl mx-auto">
             <div className="bg-green-500/5 border border-green-500/10 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-green-500/10 rounded-full blur-2xl"></div>
                
                <div className="flex items-start gap-4 relative z-10">
                   <div className="bg-green-500/10 rounded-xl p-2.5 flex-shrink-0">
                      <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                      </svg>
                   </div>
                   <div>
                      <h3 className="text-lg font-bold text-white mb-2">使用技巧</h3>
                      <ul className="space-y-2 text-sm text-gray-400">
                         <li className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                            Windows/Linux 用户请使用 <span className="text-green-400 font-mono">Ctrl</span> 键
                         </li>
                         <li className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                            macOS 用户请使用 <span className="text-green-400 font-mono">Cmd (⌘)</span> 键
                         </li>
                         <li className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                            文本输入时，按 <span className="text-green-400 font-mono">Ctrl/Cmd + Enter</span> 可立即生成语音
                         </li>
                      </ul>
                   </div>
                </div>
             </div>
          </div>

          {/* 返回按钮 */}
          <div className="mt-12 text-center">
            <Link 
                to="/" 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 hover:text-white hover:border-gray-600 transition-all duration-300 group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回主页
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
