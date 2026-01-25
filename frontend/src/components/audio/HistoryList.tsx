import React, { useState } from 'react';
import { Button } from '../ui/Button';
import type { HistoryItem } from '../../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faTrash, faClock, faVolumeUp, faUpload } from '@fortawesome/free-solid-svg-icons';

interface HistoryListProps {
  items: HistoryItem[];
  currentPlayingId: string | null;
  onDownloadItem: (item: HistoryItem) => void;
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onRegenerateItem: (item: HistoryItem) => void;
  onLoadToForm: (item: HistoryItem) => void;
  onPlayItem?: (item: HistoryItem) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  items,
  currentPlayingId,
  onDownloadItem,
  onRemoveItem,
  onClearAll,
  onRegenerateItem,
  onLoadToForm,
  onPlayItem,
}) => {
  const [playError, setPlayError] = useState<string | null>(null);

  // 自动清除错误信息
  React.useEffect(() => {
    if (playError) {
      const timer = setTimeout(() => {
        setPlayError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [playError]);

  const handlePlayItem = (item: HistoryItem) => {
    try {
      setPlayError(null);
      onPlayItem?.(item);
    } catch (error) {
      console.error('播放历史记录失败:', error);
      setPlayError('播放失败，请重试');
    }
  };

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


  if (items.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-8 text-center">
        <FontAwesomeIcon icon={faClock} className="w-12 h-12 text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2 font-mono">暂无历史记录</h3>
        <p className="text-gray-500 text-sm">生成声音后，历史记录将在这里显示</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {playError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-md text-sm">
          {playError}
        </div>
      )}

      <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
        {items.map((item) => (
          <div
            key={item.id}
            className={`bg-gray-800/80 backdrop-blur-sm border rounded-lg p-4 transition-all duration-200 cursor-pointer group ${
              currentPlayingId === item.id
                ? 'border-green-500 shadow-lg shadow-green-500/20'
                : 'border-gray-700 hover:shadow-lg hover:border-gray-600'
            }`}
            onClick={() => handlePlayItem(item)}
            title="点击播放音频"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    currentPlayingId === item.id
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-700 text-gray-400 group-hover:bg-gray-600'
                  }`}>
                    <FontAwesomeIcon
                      icon={faVolumeUp}
                      className="text-xs"
                    />
                  </div>
                  <span className={`font-medium truncate text-sm font-mono ${
                    currentPlayingId === item.id
                      ? 'text-green-400'
                      : 'text-gray-200 group-hover:text-gray-100'
                  }`}>
                    {item.voiceName}
                  </span>
                  {item.duration && (
                    <span className="text-xs text-gray-500 ml-auto font-mono">
                      {formatTime(item.duration)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mb-2 leading-relaxed" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {item.text}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500 font-mono">
                  <span className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faClock} className="text-[10px]" />
                    {formatDate(item.createdAt)}
                  </span>
                  {item.style && <span className="text-purple-400">风格: {item.style}</span>}
                  {item.rate !== '0' && <span className="text-green-400">语速: {item.rate}%</span>}
                  {item.pitch !== '0' && <span className="text-orange-400">语调: {item.pitch}%</span>}
                </div>
              </div>

              {/* 右侧操作按钮 */}
              <div className="flex flex-col gap-1 flex-shrink-0">
                {/* 加载到表单按钮 */}
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLoadToForm(item);
                  }}
                  variant="ghost"
                  size="sm"
                  className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded transition-all"
                  title="加载到表单"
                >
                  <FontAwesomeIcon icon={faUpload} className="text-xs" />
                </Button>
                {/* 下载按钮 */}
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownloadItem(item);
                  }}
                  variant="ghost"
                  size="sm"
                  className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded transition-all"
                  title="下载"
                >
                  <FontAwesomeIcon icon={faDownload} className="text-xs" />
                </Button>
                {/* 删除按钮 */}
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(item.id);
                  }}
                  variant="ghost"
                  size="sm"
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all"
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
