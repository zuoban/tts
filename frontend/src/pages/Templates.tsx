import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { TextTemplatesService } from '../services/textTemplates';
import type { TextTemplate } from '../types/index';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import ConfirmModal from '../components/ui/ConfirmModal';
import { Navbar } from '../components/layout/Navbar';
import { showSuccess, showWarning, showInfo } from '../components/ui/Toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faPen, faGripVertical, faCheck } from '@fortawesome/free-solid-svg-icons';

export default function Templates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<TextTemplate[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TextTemplate | null>(null);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [removingTemplate, setRemovingTemplate] = useState<TextTemplate | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '' });

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
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    if (sourceIndex === destinationIndex) return;

    const reordered = [...templates];
    const [removed] = reordered.splice(sourceIndex, 1);
    reordered.splice(destinationIndex, 0, removed);

    setTemplates(reordered);
    TextTemplatesService.reorderTemplates(sourceIndex, destinationIndex);
    showSuccess('顺序已更新');
  };

  const handleSaveTemplate = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      showWarning('标题和内容不能为空');
      return;
    }

    if (editingTemplate) {
      TextTemplatesService.updateTemplate(editingTemplate.id, formData);
      showSuccess('模板已更新');
    } else {
      TextTemplatesService.addTemplate(formData);
      showSuccess('模板已添加');
    }

    loadTemplates();
    setAddModalOpen(false);
    setEditModalOpen(false);
    setEditingTemplate(null);
  };

  const handleSelect = (template: TextTemplate) => {
    sessionStorage.setItem('selected_template', template.content);
    showSuccess(`已选择: ${template.title}`);
    navigate('/');
  };

  const handleRemove = (template: TextTemplate) => {
    setRemovingTemplate(template);
    setRemoveConfirmOpen(true);
  };

  const confirmRemove = () => {
    if (removingTemplate) {
      TextTemplatesService.deleteTemplate(removingTemplate.id);
      showSuccess('模板已删除');
      loadTemplates();
    }
    setRemoveConfirmOpen(false);
  };

  const openAddModal = () => {
      setFormData({ title: '', content: '' });
      setEditingTemplate(null);
      setAddModalOpen(true);
  }

  const openEditModal = (t: TextTemplate) => {
      setEditingTemplate(t);
      setFormData({ title: t.title, content: t.content });
      setEditModalOpen(true);
  }

  const filteredTemplates = searchKeyword.trim()
    ? templates.filter(t => t.title.toLowerCase().includes(searchKeyword.toLowerCase()))
    : templates;

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      <main className="container max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">文本模板</h1>
            <p className="text-muted-foreground">
              管理常用文本 <span className="text-primary/50 mx-2">/</span> {templates.length} 个模板
            </p>
          </div>
          <div className="flex gap-3">
             <Input 
                placeholder="搜索模板..." 
                value={searchKeyword} 
                onChange={e => setSearchKeyword(e.target.value)} 
                className="w-full md:w-64"
             />
             <Button onClick={openAddModal}>
                <FontAwesomeIcon icon={faPlus} className="mr-2" /> 新建
             </Button>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm min-h-[400px] p-6">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="templates-list">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {filteredTemplates.map((template, index) => (
                      <Draggable key={template.id} draggableId={template.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`group relative rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md ${snapshot.isDragging ? 'shadow-xl z-50' : ''}`}
                            style={provided.draggableProps.style}
                          >
                            <div className="flex items-start gap-4">
                                <div {...provided.dragHandleProps} className="mt-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing">
                                    <FontAwesomeIcon icon={faGripVertical} />
                                </div>
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleSelect(template)}>
                                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{template.title}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{template.content}</p>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" onClick={() => openEditModal(template)}>
                                        <FontAwesomeIcon icon={faPen} className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemove(template)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                        <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" onClick={() => handleSelect(template)}>
                                        选择
                                    </Button>
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
        </div>
      </main>

      <ConfirmModal
        isOpen={removeConfirmOpen}
        title="删除模板"
        message="确定要删除这个模板吗？"
        confirmText="删除"
        type="danger"
        onConfirm={confirmRemove}
        onCancel={() => setRemoveConfirmOpen(false)}
      />

      {(addModalOpen || editModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg">
                <h3 className="text-lg font-bold mb-4">{editingTemplate ? '编辑模板' : '新建模板'}</h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">标题</label>
                        <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="模板标题" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">内容</label>
                        <Textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="模板内容..." rows={6} />
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="outline" onClick={() => { setAddModalOpen(false); setEditModalOpen(false); }}>取消</Button>
                    <Button onClick={handleSaveTemplate}>保存</Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
