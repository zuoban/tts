import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const ShortcutsFloatButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // 监听快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd) {
        switch (e.key.toLowerCase()) {
          case '/':
            e.preventDefault();
            setIsOpen(prev => !prev);
            break;
          case 'k':
            e.preventDefault();
            navigate('/voices');
            setIsOpen(false);
            break;
          case 'p':
            e.preventDefault();
            navigate('/favorites');
            setIsOpen(false);
            break;
          case 'i':
            e.preventDefault();
            navigate('/templates');
            setIsOpen(false);
            break;
        }
      }

      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, navigate]);

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
    <>
      {/* 悬浮按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-gray-800 hover:bg-green-600 text-gray-400 hover:text-white rounded-full shadow-lg border border-gray-700 hover:border-green-500 transition-all duration-300 flex items-center justify-center group"
        title="快捷键帮助 (Ctrl+/)"
      >
        <svg className="w-6 h-6 transform group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>
      </button>

      {/* 弹窗 Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 顶部装饰 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>

            {/* 标题栏 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">快捷键列表</h2>
                  <p className="text-sm text-gray-400 font-mono">Keyboard Shortcuts</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 内容区域 */}
            <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {shortcuts.map((group, index) => (
                  <div key={index} className="space-y-4">
                    <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      {group.category}
                    </h3>
                    <div className="space-y-3">
                      {group.shortcuts.map((shortcut, idx) => (
                        <div key={idx} className="group/item flex flex-col p-3 bg-gray-800/30 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
                          <span className="text-gray-400 text-sm mb-2 group-hover/item:text-gray-200 transition-colors">
                            {shortcut.desc}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {shortcut.key.split(' / ').map((k, i, arr) => (
                              <React.Fragment key={i}>
                                <kbd className="px-2 py-1 bg-gray-700 border border-gray-600 rounded-md text-xs font-mono text-gray-200 shadow-sm min-w-[20px] text-center">
                                  {k}
                                </kbd>
                                {i < arr.length - 1 && (
                                  <span className="text-gray-600 text-xs self-center px-1">/</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 底部提示 */}
            <div className="p-4 bg-gray-800/50 border-t border-gray-800 text-center">
              <p className="text-xs text-gray-500">
                按 <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300 font-mono">Esc</kbd> 关闭窗口
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
