import React, { useState } from 'react';
import { Button } from '../ui/Button';
import type { HistoryItem } from '../../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faTrash, faClock, faVolumeUp, faPlay, faPause, faRedo, faUpload } from '@fortawesome/free-solid-svg-icons';

interface HistoryListProps {
  items: HistoryItem[];
  currentPlayingId: string | null;
  onPlayItem: (item: HistoryItem) => void;
  onDownloadItem: (item: HistoryItem) => void;
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onRegenerateItem: (item: HistoryItem) => void;
  onPlayHistoryItemDirectly: (item: HistoryItem) => void;
  onLoadToForm: (item: HistoryItem) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  items,
  currentPlayingId,
  onPlayItem,
  onDownloadItem,
  onRemoveItem,
  onClearAll,
  onRegenerateItem,
  onPlayHistoryItemDirectly,
  onLoadToForm,
}) => {
  
    const formatDate = (date: Date | string) => {
    const now = new Date();
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // 检查日期是否有效
    if (isNaN(dateObj.getTime())) {
      return '未知时间';
    }

    const diff = now.getTime() - dateObj.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return dateObj.toLocaleDateString('zh-CN');
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTogglePlayback = (item: HistoryItem) => {
    // 调用父组件的播放/暂停切换方法
    onPlayHistoryItemDirectly(item);
  };

  if (items.length === 0) {
    return (
      <div className="bg-gray-50/50 backdrop-blur-sm border border-gray-200/50 rounded-lg p-8 text-center">
        <FontAwesomeIcon icon={faClock} className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无历史记录</h3>
        <p className="text-gray-500 text-sm">生成声音后，历史记录将在这里显示</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between py-1">
        <h3 className="text-base font-semibold text-gray-800">
          历史记录 ({items.length})
        </h3>
        {items.length > 0 && (
          <Button
            onClick={onClearAll}
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 px-2 py-1 text-xs"
          >
            <FontAwesomeIcon icon={faTrash} className="mr-1" />
            清空
          </Button>
        )}
      </div>

      
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.id}
            className={`bg-white/80 backdrop-blur-sm border rounded-md p-3 transition-all duration-200 ${
              currentPlayingId === item.id
                ? 'border-green-300 shadow-sm'
                : 'border-gray-200/50 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FontAwesomeIcon
                    icon={faVolumeUp}
                    className="text-gray-400 flex-shrink-0 text-xs"
                  />
                  <span className="font-medium text-gray-800 truncate text-sm">
                    {item.voiceName}
                  </span>
                  {item.duration && (
                    <span className="text-xs text-gray-500 ml-auto">
                      {formatTime(item.duration)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mb-1" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {item.text}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{formatDate(item.createdAt)}</span>
                  {item.style && <span>风格: {item.style}</span>}
                  {item.rate !== '0' && <span>语速: {item.rate}%</span>}
                  {item.pitch !== '0' && <span>语调: {item.pitch}%</span>}
                </div>
              </div>

              {/* 右侧操作按钮 */}
              <div className="flex gap-1 flex-shrink-0">
                {/* 播放/暂停按钮 - 支持播放和暂停功能 */}
                <Button
                  onClick={() => handleTogglePlayback(item)}
                  variant={currentPlayingId === item.id ? "default" : "ghost"}
                  size="sm"
                  className={`p-1.5 ${
                    currentPlayingId === item.id
                      ? 'text-white bg-green-500 hover:bg-green-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  title={currentPlayingId === item.id ? "暂停" : "播放"}
                >
                  <FontAwesomeIcon
                    icon={currentPlayingId === item.id ? faPause : faPlay}
                    className="text-xs"
                  />
                </Button>
                {/* 加载到表单按钮 */}
                <Button
                  onClick={() => onLoadToForm(item)}
                  variant="ghost"
                  size="sm"
                  className="p-1.5 text-blue-600 hover:text-blue-800"
                  title="加载到表单"
                >
                  <FontAwesomeIcon icon={faUpload} className="text-xs" />
                </Button>
                <Button
                  onClick={() => onDownloadItem(item)}
                  variant="ghost"
                  size="sm"
                  className="p-1.5 text-gray-600 hover:text-gray-800"
                  title="下载"
                >
                  <FontAwesomeIcon icon={faDownload} className="text-xs" />
                </Button>
                <Button
                  onClick={() => onRemoveItem(item.id)}
                  variant="ghost"
                  size="sm"
                  className="p-1.5 text-red-500 hover:text-red-600"
                  title="删除"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-xs" />
                </Button>
              </div>
            </div>
            </div>
        ))}
      </div>
    </div>
  );
};