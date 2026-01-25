import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { TextTemplatesService } from '../../services/textTemplates';
import type { TextTemplate } from '../../types/index';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import ConfirmModal from '../ui/ConfirmModal';
import { showSuccess, showWarning, showInfo } from '../ui/Toast';

interface TextTemplatesManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplatesChange?: () => void;
  onSelectTemplate?: (content: string) => void;
}

const TextTemplatesManager: React.FC<TextTemplatesManagerProps> = ({
  isOpen,
  onClose,
  onTemplatesChange,
  onSelectTemplate
}) => {
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
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

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
        onTemplatesChange?.();
      }
    }
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
    onTemplatesChange?.();
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
      onTemplatesChange?.();
      setAddModalOpen(false);
      setEditModalOpen(false);
      setEditingTemplate(null);
  };

  const handleSelect = (template: TextTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(template.content);

      showSuccess(`已填充模板: ${template.title}`);

      onClose();
    }
  };

  const filteredTemplates = searchKeyword.trim()
    ? templates.filter(t =>
      t.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      t.content.toLowerCase().includes(searchKeyword.toLowerCase())
    )
    : templates;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[65] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z" />
                </svg>
                文本模板管理
              </h2>
              <p className="text-purple-100 mt-1">
                拖动调整顺序，管理您的文本模板（共 {templates.length} 个）
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-4 flex items-center gap-3">
            <Input
              type="text"
              placeholder="搜索模板..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleAdd}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              添加
            </Button>
          </div>

          {templates.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无模板</h3>
              <p className="text-gray-500">点击"添加"按钮创建您的第一个文本模板</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="templates-manager-list">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                     {filteredTemplates.map((template, index) => (
                       <Draggable key={template.id} draggableId={template.id} index={index}>
                         {(provided, snapshot) => (
                           <div
                             ref={provided.innerRef}
                             {...provided.draggableProps}
                             onClick={() => handleSelect(template)}
                             className={`group flex items-center gap-3 px-4 py-3 border rounded-lg transition-all duration-200 cursor-pointer ${
                               snapshot.isDragging
                                 ? 'bg-purple-50 border-purple-300 shadow-xl opacity-80'
                                 : 'bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                             }`}
                           >
                             <div
                               {...provided.dragHandleProps}
                               onClick={(e) => e.stopPropagation()}
                               className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                             >
                               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                               </svg>
                             </div>

                             <div className="flex-1 min-w-0">
                               <h4 className="font-semibold text-gray-900 text-sm truncate">
                                 {template.title}
                               </h4>
                               <p className="text-xs text-gray-600 truncate mt-0.5">
                                 {template.content}
                               </p>
                               <p className="text-[10px] text-gray-400 mt-1">
                                 {new Date(template.createdAt).toLocaleString('zh-CN')}
                               </p>
                             </div>

                             <div className="flex items-center gap-2">
                               <button
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleEdit(template);
                                 }}
                                 className="flex items-center justify-center w-8 h-8 bg-blue-50 border border-blue-200 text-blue-600 rounded hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
                                 title="编辑"
                               >
                                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                 </svg>
                               </button>
                               <button
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleRemove(template);
                                 }}
                                 className="flex items-center justify-center w-8 h-8 bg-red-50 border border-red-200 text-red-600 rounded hover:bg-red-100 hover:border-red-300 transition-all duration-200"
                                 title="删除"
                               >
                                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                清空所有模板
              </button>
            </div>
          )}
        </div>

        <ConfirmModal
          isOpen={removeConfirmOpen}
          title="删除模板"
          message={`确定要删除模板：${removingTemplate?.title}？`}
          confirmText="删除"
          cancelText="取消"
          type="danger"
          onConfirm={confirmRemove}
          onCancel={() => {
            setRemoveConfirmOpen(false);
            setRemovingTemplate(null);
          }}
        />

        <ConfirmModal
          isOpen={clearConfirmOpen}
          title="清空"
          message="确定要清空所有模板吗？此操作不可恢复。"
          confirmText="清空"
          cancelText="取消"
          type="danger"
          onConfirm={confirmClearAll}
          onCancel={() => setClearConfirmOpen(false)}
        />

        {(addModalOpen || editModalOpen) && (
          <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-4 text-white">
                <h3 className="text-xl font-bold">
                  {editingTemplate ? '编辑模板' : '添加新模板'}
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      标题
                    </label>
                    <Input
                      type="text"
                      placeholder="输入模板标题"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      内容
                    </label>
                    <textarea
                      placeholder="输入模板内容"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                  </div>
                  {formError && (
                    <p className="text-sm text-red-600">{formError}</p>
                  )}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAddModalOpen(false);
                      setEditModalOpen(false);
                      setEditingTemplate(null);
                      setFormError('');
                    }}
                  >
                    取消
                  </Button>
                  <Button onClick={handleSaveTemplate}>
                    {editingTemplate ? '保存' : '添加'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextTemplatesManager;
