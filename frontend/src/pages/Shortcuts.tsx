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
    <div className="page-bg">
      <Navbar showShortcutsHelp={() => {}} />

      <div className="page-container">
        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">快捷键帮助</h1>
          <p className="text-lg text-gray-600">提高您的工作效率，快速访问常用功能</p>
        </div>

        {/* 快捷键列表 */}
        <div className="space-y-6">
          {shortcuts.map((group, index) => (
            <div key={index} className="card">
              {/* 分类标题 */}
              <div className="card-header-primary">
                <h2 className="text-xl font-bold text-white">{group.category}</h2>
              </div>

              {/* 快捷键列表 */}
              <div className="card-body">
                <div className="space-y-4">
                  {group.shortcuts.map((shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <kbd className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg font-mono text-sm font-semibold text-gray-700 shadow-sm">
                          {shortcut.key}
                        </kbd>
                        <span className="text-gray-700 font-medium">{shortcut.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 提示信息 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">小提示</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Windows/Linux 用户使用 <kbd className="px-2 py-1 bg-white border border-gray-300 rounded font-mono text-xs">Ctrl</kbd></li>
                <li>• Mac 用户使用 <kbd className="px-2 py-1 bg-white border border-gray-300 rounded font-mono text-xs">Cmd</kbd></li>
                <li>• 在文本输入框中按 <kbd className="px-2 py-1 bg-white border border-gray-300 rounded font-mono text-xs">Ctrl+Enter</kbd> 可以快速生成语音</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 返回按钮 */}
        <div className="mt-8 text-center">
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回主页
          </Link>
        </div>
      </div>
    </div>
  );
}
