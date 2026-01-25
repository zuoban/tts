import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { TextTemplatesService } from '../services/textTemplates';
import type { TextTemplate } from '../types/index';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import ConfirmModal from '../components/ui/ConfirmModal';
import { Navbar } from '../components/layout/Navbar';
import { showSuccess, showWarning, showInfo } from '../components/ui/Toast';

export default function Templates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<TextTemplate[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TextTemplate | null>(null);

  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [removingTemplate, setRemovingTemplate] = useState<TextTemplate | null>(null);

  const [formData, setFormData] = useState({ title: '', content: '' });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    TextTemplatesService.initializeDefaultTemplates();
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const loadedTemplates = TextTemplatesService.getTemplates()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    setTemplates(loadedTemplates);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) {
      return;
    }

    const reordered = [...templates];
    const [removed] = reordered.splice(sourceIndex, 1);
    reordered.splice(destinationIndex, 0, removed);

    setTemplates(reordered);
    TextTemplatesService.reorderTemplates(sourceIndex, destinationIndex);

    showSuccess('顺序已更新');
  };

  const handleAdd = () => {
    setFormData({ title: '', content: '' });
    setFormError('');
    setAddModalOpen(true);
  };

  const handleEdit = (template: TextTemplate) => {
    setEditingTemplate(template);
    setFormData({ title: template.title, content: template.content });
    setFormError('');
    setEditModalOpen(true);
  };

  const handleRemove = (template: TextTemplate) => {
    setRemovingTemplate(template);
    setRemoveConfirmOpen(true);
  };

  const confirmRemove = () => {
    if (removingTemplate) {
      const result = TextTemplatesService.deleteTemplate(removingTemplate.id);

      if (result) {
        showWarning(`已删除模板: ${removingTemplate.title}`);
        loadTemplates();
      }
    }
    setRemoveConfirmOpen(false);
    setRemovingTemplate(null);
  };

  const cancelRemove = () => {
    setRemoveConfirmOpen(false);
    setRemovingTemplate(null);
  };

  const handleClearAll = () => {
    setClearConfirmOpen(true);
  };

  const confirmClearAll = () => {
    TextTemplatesService.clearTemplates();
    showInfo('已清空所有模板');
    loadTemplates();
    setClearConfirmOpen(false);
  };

  const cancelClearAll = () => {
    setClearConfirmOpen(false);
  };

  const handleSaveTemplate = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setFormError('标题和内容不能为空');
      return;
    }

    if (editingTemplate) {
      TextTemplatesService.updateTemplate(editingTemplate.id, {
        title: formData.title,
        content: formData.content
      });
      showSuccess('模板已更新');
    } else {
      TextTemplatesService.addTemplate({
        title: formData.title,
        content: formData.content
      });
      showSuccess('模板已添加');
    }

    loadTemplates();
    setAddModalOpen(false);
    setEditModalOpen(false);
    setEditingTemplate(null);
  };

  const handleSelect = (template: TextTemplate) => {
    sessionStorage.setItem('selected_template', template.content);
    showSuccess(`已填充模板: ${template.title}`);
    navigate(-1);
  };

  const filteredTemplates = searchKeyword.trim()
    ? templates.filter(t =>
      t.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      t.content.toLowerCase().includes(searchKeyword.toLowerCase())
    )
    : templates;

  return (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden font-sans selection:bg-purple-500/30">
      {/* 动态背景网格 */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
            backgroundImage: `
                linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px),
                linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* 装饰性光晕 */}
      <div className="fixed top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
      <div className="fixed bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none translate-y-1/2"></div>

      <div className="relative z-10">
        <Navbar />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 头部区域 */}
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="relative group">
               <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
               
               <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 tracking-tight mb-2">
                 文本模板
               </h1>
               <p className="text-gray-400 font-mono text-sm tracking-wide">
                 管理您的常用文本 <span className="text-purple-500/50">///</span> {templates.length} 个模板
               </p>
            </div>
            
            <div className="flex gap-3">
                {templates.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40 transition-all duration-300 backdrop-blur-sm"
                  >
                    <span className="text-sm font-medium">清空</span>
                  </button>
                )}
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-purple-500 text-white font-medium hover:bg-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] transition-all duration-300"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    添加模板
                </button>
            </div>
          </div>

          {/* 搜索栏 */}
          <div className="mb-8 relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索模板标题或内容..."
                className="block w-full pl-11 pr-4 py-4 bg-gray-900/50 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
            />
          </div>

          {/* 列表区域 */}
          <div className="relative min-h-[400px]">
             {/* 背景层 */}
             <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-gray-800/50 shadow-2xl pointer-events-none"></div>

             {/* 内容层 */}
             <div className="relative z-10 p-6">
                {templates.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 mb-6 rounded-full bg-gray-800/50 flex items-center justify-center relative group">
                    <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-pulse"></div>
                    <svg className="w-10 h-10 text-gray-500 group-hover:text-purple-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    </div>
                    <h3 className="text-xl font-medium text-gray-200 mb-2 font-mono">暂无模板</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">
                    创建您的第一个文本模板，以便快速复用。
                    </p>
                </div>
                ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="templates-manager-list">
                    {(provided) => (
                        <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="flex flex-col gap-4"
                        >
                        {filteredTemplates.map((template, index) => (
                            <Draggable key={template.id} draggableId={template.id} index={index}>
                            {(provided, snapshot) => (
                                <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                onClick={() => handleSelect(template)}
                                className={`
                                    group relative rounded-xl border cursor-pointer overflow-hidden transition-all duration-300
                                    ${snapshot.isDragging 
                                        ? 'shadow-2xl ring-1 ring-purple-500/50 z-50 bg-gray-800' 
                                        : 'bg-gray-800/40 border-gray-700/50 hover:bg-gray-800/80 hover:border-gray-600 hover:shadow-lg hover:shadow-black/20'
                                    }
                                `}
                                style={{
                                    ...provided.draggableProps.style,
                                    transition: snapshot.isDragging ? 'none' : provided.draggableProps.style?.transition,
                                }}
                                >
                                {/* 装饰线 */}
                                <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                
                                <div className="flex items-start p-5 gap-4">
                                    {/* 拖拽手柄 */}
                                    <div
                                        {...provided.dragHandleProps}
                                        className="mt-1 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded text-gray-600 group-hover:text-gray-400 hover:bg-gray-700/50 transition-colors cursor-grab active:cursor-grabbing"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                                        </svg>
                                    </div>

                                    {/* 内容区 */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h4 className="text-lg font-bold text-gray-200 group-hover:text-purple-400 transition-colors truncate mb-1">
                                                    {template.title}
                                                </h4>
                                                <div className="text-xs font-mono text-gray-500 mb-3">
                                                    {new Date(template.createdAt).toLocaleDateString('zh-CN')}
                                                </div>
                                            </div>
                                            {/* 操作按钮 - 桌面端Hover显示 */}
                                            <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                                                <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(template);
                                                }}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-500/10 hover:text-blue-400 text-gray-500 transition-colors"
                                                title="编辑"
                                                >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                </svg>
                                                </button>
                                                <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemove(template);
                                                }}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 hover:text-red-400 text-gray-500 transition-colors"
                                                title="删除"
                                                >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                                            {template.content}
                                        </p>
                                    </div>
                                </div>
                                </div>
                            )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                        </div>
                    )}
                    </Droppable>
                </DragDropContext>
                )}
             </div>
          </div>
        </main>
      </div>

      <ConfirmModal
        isOpen={removeConfirmOpen}
        title="删除模板"
        message={`确定要删除模板：${removingTemplate?.title}？`}
        confirmText="删除"
        cancelText="取消"
        type="danger"
        onConfirm={confirmRemove}
        onCancel={cancelRemove}
      />

      <ConfirmModal
        isOpen={clearConfirmOpen}
        title="清空所有"
        message="确定要清空所有模板吗？此操作不可恢复。"
        confirmText="清空"
        cancelText="取消"
        type="danger"
        onConfirm={confirmClearAll}
        onCancel={cancelClearAll}
      />

      {(addModalOpen || editModalOpen) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative">
             {/* 模态框顶部装饰 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500"></div>
            
            <div className="p-8">
              <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                <span className="w-2 h-8 bg-purple-500 rounded-full"></span>
                {editingTemplate ? '编辑模板' : '添加新模板'}
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider font-mono">
                    标题
                  </label>
                  <Input
                    type="text"
                    placeholder="为模板起个名字..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-600 focus:border-purple-500 focus:ring-purple-500/20 text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider font-mono">
                    内容
                  </label>
                  <textarea
                    placeholder="在此输入文本内容..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={8}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 resize-none transition-all duration-200"
                  />
                </div>
                {formError && (
                  <div className="flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-3 rounded-lg border border-red-500/20">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    {formError}
                  </div>
                )}
              </div>
              
              <div className="mt-10 flex justify-end gap-4">
                <button
                  onClick={() => {
                    setAddModalOpen(false);
                    setEditModalOpen(false);
                    setEditingTemplate(null);
                    setFormError('');
                  }}
                  className="px-6 py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors font-medium"
                >
                  取消
                </button>
                <button 
                    onClick={handleSaveTemplate} 
                    className="px-8 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  {editingTemplate ? '保存更改' : '确认添加'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
