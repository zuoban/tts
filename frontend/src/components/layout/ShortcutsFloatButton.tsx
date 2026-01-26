import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKeyboard, faTimes, faMicrophone, faFont, faTerminal, faQuestion } from '@fortawesome/free-solid-svg-icons';

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
      icon: faFont,
      shortcuts: [
        { key: ['Ctrl', 'E'], macKey: ['Cmd', 'E'], desc: '聚焦文本输入框' },
        { key: ['Ctrl', 'Enter'], macKey: ['Cmd', 'Enter'], desc: '生成语音（输入框中）' },
      ]
    },
    {
      category: '语音操作',
      icon: faMicrophone,
      shortcuts: [
        { key: ['Ctrl', 'K'], macKey: ['Cmd', 'K'], desc: '打开声音库' },
        { key: ['Ctrl', 'P'], macKey: ['Cmd', 'P'], desc: '打开收藏管理' },
        { key: ['Ctrl', 'I'], macKey: ['Cmd', 'I'], desc: '打开文本模板' },
      ]
    },
    {
      category: '其他操作',
      icon: faTerminal,
      shortcuts: [
        { key: ['Ctrl', '/'], macKey: ['Cmd', '/'], desc: '显示快捷键帮助' },
        { key: ['Esc'], desc: '关闭弹窗/对话框' },
      ]
    }
  ];

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
        title="快捷键帮助 (Ctrl+/)"
      >
        <FontAwesomeIcon icon={faQuestion} className="w-5 h-5" />
      </button>

      {/* 弹窗 Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FontAwesomeIcon icon={faKeyboard} className="text-primary w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">快捷键列表</h2>
                  <p className="text-sm text-muted-foreground">Keyboard Shortcuts</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
              </Button>
            </div>

            {/* 内容区域 */}
            <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {shortcuts.map((group, index) => (
                  <div key={index} className="space-y-4">
                    <h3 className="text-sm font-medium text-primary uppercase tracking-wider flex items-center gap-2">
                        <FontAwesomeIcon icon={group.icon} className="w-3 h-3" />
                        {group.category}
                    </h3>
                    <div className="space-y-2">
                      {group.shortcuts.map((shortcut, idx) => (
                        <div key={idx} className="flex flex-col p-3 bg-muted/30 rounded-lg border border-border/50 hover:border-border transition-colors">
                          <span className="text-muted-foreground text-sm mb-2">
                            {shortcut.desc}
                          </span>
                          <div className="flex flex-wrap gap-2 items-center">
                            <div className="flex gap-1">
                                {shortcut.key.map((k, i) => (
                                <React.Fragment key={i}>
                                    <kbd className="inline-flex items-center justify-center min-w-[20px] h-6 px-1.5 rounded bg-background border border-border text-xs font-mono text-foreground shadow-sm">
                                    {k}
                                    </kbd>
                                    {i < shortcut.key.length - 1 && <span className="text-xs text-muted-foreground self-center">+</span>}
                                </React.Fragment>
                                ))}
                            </div>
                            
                            {shortcut.macKey && (
                                <>
                                <span className="text-xs text-muted-foreground/30">|</span>
                                <div className="flex gap-1">
                                    {shortcut.macKey.map((k, i) => (
                                    <React.Fragment key={i}>
                                        <kbd className="inline-flex items-center justify-center min-w-[20px] h-6 px-1.5 rounded bg-background border border-border text-xs font-mono text-foreground shadow-sm">
                                        {k}
                                        </kbd>
                                        {i < shortcut.macKey.length - 1 && <span className="text-xs text-muted-foreground self-center">+</span>}
                                    </React.Fragment>
                                    ))}
                                </div>
                                </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 底部提示 */}
            <div className="p-4 bg-muted/50 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                按 <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-foreground font-mono shadow-sm">Esc</kbd> 关闭窗口
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
