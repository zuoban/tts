import React, { useState } from 'react';
import { Button } from '../ui/Button';
import type { HistoryItem } from '../../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faClock, faVolumeUp } from '@fortawesome/free-solid-svg-icons';
import { cn } from '../../utils/utils'; // Assuming existence or I'll use inline

interface HistoryListProps {
  items: HistoryItem[];
  currentPlayingId: string | null;
  onRemoveItem: (id: string) => void;
  onPlayItem?: (item: HistoryItem) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  items,
  currentPlayingId,
  onRemoveItem,
  onPlayItem,
}) => {
  const [playError, setPlayError] = useState<string | null>(null);

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
    if (isNaN(dateObj.getTime())) return '未知时间';

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
      <div className="bg-muted/30 border border-border border-dashed rounded-lg p-8 text-center">
        <FontAwesomeIcon icon={faClock} className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">暂无历史记录</h3>
        <p className="text-muted-foreground text-sm">生成声音后，历史记录将在这里显示</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {playError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded-md text-sm">
          {playError}
        </div>
      )}

      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {items.map((item) => (
          <div
            key={item.id}
            className={`relative rounded-lg p-4 border transition-all duration-200 cursor-pointer group hover:shadow-md ${
              currentPlayingId === item.id
                ? 'bg-primary/5 border-primary shadow-sm'
                : 'bg-card border-border hover:border-primary/50'
            }`}
            onClick={() => handlePlayItem(item)}
            title="点击播放音频"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    currentPlayingId === item.id
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                  }`}>
                    <FontAwesomeIcon icon={faVolumeUp} className="text-xs" />
                  </div>
                  <span className={`font-medium truncate text-sm ${
                    currentPlayingId === item.id
                      ? 'text-primary'
                      : 'text-foreground'
                  }`}>
                    {item.voiceName}
                  </span>
                  {item.duration && (
                    <span className="text-xs text-muted-foreground ml-auto font-mono">
                      {formatTime(item.duration)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2 leading-relaxed line-clamp-2">
                  {item.text}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground/80 font-mono">
                  <span className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faClock} className="text-[10px]" />
                    {formatDate(item.createdAt)}
                  </span>
                  {item.style && <span className="text-purple-500">风格: {item.style}</span>}
                  {item.rate !== '0' && <span className="text-green-500">语速: {item.rate}%</span>}
                  {item.pitch !== '0' && <span className="text-orange-500">语调: {item.pitch}%</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1 flex-shrink-0">
                <Button
                  onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }}
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
