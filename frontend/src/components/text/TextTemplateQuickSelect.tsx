import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { TextTemplatesService } from '../../services/textTemplates';
import type { TextTemplate } from '../../types/index';
import { Input } from '../ui/Input';
import { showSuccess } from '../ui/Toast';

interface TextTemplateQuickSelectProps {
  onSelectTemplate: (content: string) => void;
  onOpenManager: () => void;
}

const TextTemplateQuickSelect: React.FC<TextTemplateQuickSelectProps> = ({
  onSelectTemplate,
  onOpenManager
}) => {
  const [templates, setTemplates] = useState<TextTemplate[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
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
  };

  const handleSelect = (template: TextTemplate) => {
    onSelectTemplate(template.content);

    showSuccess(`已填充模板: ${template.title}`);
  };

  const filteredTemplates = searchKeyword.trim()
    ? templates.filter(t =>
      t.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      t.content.toLowerCase().includes(searchKeyword.toLowerCase())
    )
    : templates;

  if (templates.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z" />
            </svg>
            快速文本模板
          </h3>
          <button
            onClick={onOpenManager}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            管理
          </button>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>暂无模板，点击"管理"添加模板</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z" />
          </svg>
          快速文本模板
          <span className="text-sm font-normal text-gray-500">({templates.length})</span>
        </h3>
        <button
          onClick={onOpenManager}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          管理
        </button>
      </div>

      <Input
        type="text"
        placeholder="搜索模板..."
        value={searchKeyword}
        onChange={(e) => setSearchKeyword(e.target.value)}
        className="mb-3"
      />

      {filteredTemplates.length === 0 ? (
        <div className="text-center py-4 text-gray-500 text-sm">
          未找到匹配的模板
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="templates-list">
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
                        className={`group flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                          snapshot.isDragging
                            ? 'bg-purple-50 border-purple-300 shadow-xl opacity-80'
                            : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-md'
                        }`}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                          </svg>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm truncate">
                            {template.title}
                          </h4>
                          <p className="text-xs text-gray-600 truncate mt-0.5">
                            {template.content}
                          </p>
                        </div>

                        <svg className="w-4 h-4 text-purple-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
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
  );
};

export default TextTemplateQuickSelect;
