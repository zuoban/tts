import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Button } from '../components/ui/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKeyboard, faArrowLeft, faLightbulb, faTerminal, faMicrophone, faFont } from '@fortawesome/free-solid-svg-icons';

export default function Shortcuts() {
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
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      <main className="container max-w-4xl mx-auto px-4 py-12">
        {/* Header - Aligned with other pages */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">快捷键帮助</h1>
            <p className="text-muted-foreground">
              像专业人士一样使用键盘，提高您的工作效率
            </p>
          </div>
          
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
              返回主页
            </Button>
          </Link>
        </div>

        {/* Shortcuts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shortcuts.map((group, index) => (
            <div key={index} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FontAwesomeIcon icon={group.icon} className="text-primary text-sm" />
                </div>
                <h2 className="text-lg font-semibold">{group.category}</h2>
              </div>

              <div className="space-y-6">
                {group.shortcuts.map((shortcut, idx) => (
                  <div key={idx} className="flex flex-col gap-2">
                    <span className="text-sm text-muted-foreground">
                      {shortcut.desc}
                    </span>
                    <div className="flex flex-wrap gap-2 items-center">
                      <div className="flex gap-1">
                        {shortcut.key.map((k, i) => (
                          <React.Fragment key={i}>
                            <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded bg-muted border border-border text-xs font-mono text-foreground shadow-sm">
                              {k}
                            </kbd>
                            {i < shortcut.key.length - 1 && <span className="text-xs text-muted-foreground self-center">+</span>}
                          </React.Fragment>
                        ))}
                      </div>
                      
                      {shortcut.macKey && (
                        <>
                          <span className="text-xs text-muted-foreground/30 mx-1">|</span>
                          <div className="flex gap-1">
                            {shortcut.macKey.map((k, i) => (
                              <React.Fragment key={i}>
                                <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded bg-muted border border-border text-xs font-mono text-foreground shadow-sm">
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

        {/* Tips Section */}
        <div className="mt-8">
          <div className="bg-muted/50 border border-border rounded-xl p-6 flex gap-4">
            <div className="flex-shrink-0 mt-1">
              <FontAwesomeIcon icon={faLightbulb} className="text-primary w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-foreground">使用技巧</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                  Windows/Linux 用户请使用 <span className="text-foreground font-mono bg-muted px-1 rounded">Ctrl</span> 键
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                  macOS 用户请使用 <span className="text-foreground font-mono bg-muted px-1 rounded">Cmd (⌘)</span> 键
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                  文本输入时，按 <span className="text-foreground font-mono bg-muted px-1 rounded">Ctrl/Cmd + Enter</span> 可立即生成语音
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
