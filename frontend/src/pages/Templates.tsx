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
    // 将内容存储到 sessionStorage，以便主页可以使用
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
    <div className="page-bg">
      <Navbar />
      <div className="page-container">

        {/* 主卡片 */}
        <div className="card">
          {/* 头部 */}
          <div className="card-header-primary">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 rounded-xl p-3">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z" />
                </svg>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold">文本模板管理</h1>
                <p className="text-purple-100 text-lg mt-1">
                  拖动调整顺序，管理您的文本模板（共 {templates.length} 个）
                </p>
              </div>
            </div>
          </div>

          <div className="card-body">
            <div className="mb-6 flex items-center gap-4">
              <Input
                type="text"
                placeholder="搜索模板..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="flex-1 text-base"
              />
              <Button
                onClick={handleAdd}
                className="btn-primary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                添加模板
              </Button>
            </div>

            {templates.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-24 h-24 text-gray-300 mx-auto mb-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z" />
                </svg>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">暂无模板</h3>
                <p className="text-gray-500 text-lg">点击"添加模板"按钮创建您的第一个文本模板</p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="templates-manager-list">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {filteredTemplates.map((template, index) => (
                        <Draggable key={template.id} draggableId={template.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              onClick={() => handleSelect(template)}
                              className={`group flex items-center gap-4 px-6 py-4 border rounded-xl transition-all duration-200 cursor-pointer ${
                                snapshot.isDragging
                                  ? 'bg-purple-50 border-purple-300 shadow-xl opacity-80'
                                  : 'bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:shadow-lg'
                              }`}
                            >
                              <div
                                {...provided.dragHandleProps}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                              >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                                </svg>
                              </div>

                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 text-lg truncate">
                                  {template.title}
                                </h4>
                                <p className="text-sm text-gray-600 truncate mt-1">
                                  {template.content}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {new Date(template.createdAt).toLocaleString('zh-CN')}
                                </p>
                              </div>

                              <div className="flex items-center gap-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(template);
                                  }}
                                  className="btn-icon text-blue-600 hover:text-blue-700"
                                  title="编辑"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove(template);
                                  }}
                                  className="btn-icon-danger"
                                  title="删除"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
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

            {templates.length > 0 && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleClearAll}
                  className="btn-ghost flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  清空所有模板
                </button>
              </div>
            )}
          </div>
        </div>
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
        title="清空"
        message="确定要清空所有模板吗？此操作不可恢复。"
        confirmText="清空"
        cancelText="取消"
        type="danger"
        onConfirm={confirmClearAll}
        onCancel={cancelClearAll}
      />

      {(addModalOpen || editModalOpen) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl">
            <div className="card-header-primary">
              <h3 className="text-2xl font-bold">
                {editingTemplate ? '编辑模板' : '添加新模板'}
              </h3>
            </div>
            <div className="p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    标题
                  </label>
                  <Input
                    type="text"
                    placeholder="输入模板标题"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="text-base"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    内容
                  </label>
                  <textarea
                    placeholder="输入模板内容"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={8}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>
                {formError && (
                  <p className="text-base text-red-600 bg-red-50 px-4 py-3 rounded-lg">{formError}</p>
                )}
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAddModalOpen(false);
                    setEditModalOpen(false);
                    setEditingTemplate(null);
                    setFormError('');
                  }}
                  className="btn-secondary"
                >
                  取消
                </Button>
                <Button onClick={handleSaveTemplate} className="btn-primary">
                  {editingTemplate ? '保存' : '添加'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
