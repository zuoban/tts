import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faVolumeUp, faDownload, faCopy } from '@fortawesome/free-solid-svg-icons';
import { useTTSStore } from '../../hooks/useTTSStore';
import type { HistoryItem } from '../../types';

export interface UnifiedAudioPlayerProps {
  // 音频源
  audioUrl?: string | null;
  historyItem?: HistoryItem | null;

  // 播放控制
  autoPlay?: boolean;
  itemId?: string; // 用于标识当前播放项目的唯一ID

  // 显示选项
  showControls?: boolean;
  showProgress?: boolean;
  showDownload?: boolean;
  showCopyLink?: boolean;

  // 操作回调
  onDownload?: (audioUrl: string, text: string) => void;
  onCopyLink?: (item: HistoryItem) => void;
  onPlayStateChange?: (isPlaying: boolean, itemId?: string) => void;

  // 样式
  variant?: 'full' | 'compact' | 'minimal';
  className?: string;
}

export const UnifiedAudioPlayer: React.FC<UnifiedAudioPlayerProps> = ({
  audioUrl,
  historyItem,
  autoPlay = false,
  itemId,
  showControls = true,
  showProgress = true,
  showDownload = true,
  showCopyLink = false,
  onDownload,
  onCopyLink,
  onPlayStateChange,
  variant = 'full',
  className = ''
}) => {
  const { currentPlayingId, setCurrentPlayingId } = useTTSStore();

  // 音频状态
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 自动清除错误信息
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000); // 3秒后自动清除
      return () => clearTimeout(timer);
    }
  }, [error]);

  // 引用
  const audioRef = useRef<HTMLAudioElement>(null);

  // 计算实际的音频URL和项目ID
  const currentAudioUrl = audioUrl || historyItem?.audioUrl || null;
  const currentItemId = itemId || historyItem?.id || null;

  // 清理函数
  const cleanup = useCallback(() => {
    if (currentAudioUrl?.startsWith('blob:') && audioRef.current?.src) {
      URL.revokeObjectURL(currentAudioUrl);
    }
  }, [currentAudioUrl]);

  // 音频事件处理
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentAudioUrl) return;

    setIsLoading(true);
    setError(null);

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = (e: Event) => {
      console.error('音频加载失败:', e);
      setError('音频加载失败');
      setIsLoading(false);
      setIsPlaying(false);
    };

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      const audioDuration = audio.duration;
      if (!isNaN(audioDuration)) {
        setDuration(audioDuration);
        // 如果历史记录没有时长信息，更新它
        if (historyItem && !historyItem.duration && audioDuration > 0) {
          // 这里可以调用store更新历史记录的时长
        }
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentPlayingId(null);
      onPlayStateChange?.(false, currentItemId || undefined);

      // 延迟清理 blob URL，给用户重新播放的机会
      setTimeout(() => {
        cleanup();
      }, 5000); // 5秒后清理
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setCurrentPlayingId(currentItemId);
      onPlayStateChange?.(true, currentItemId || undefined);
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPlayStateChange?.(false, currentItemId || undefined);
    };

    // 添加事件监听器
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [currentAudioUrl, currentItemId, historyItem, setCurrentPlayingId, onPlayStateChange, cleanup]);

  
  // 自动播放
  useEffect(() => {
    if (autoPlay && currentAudioUrl && audioRef.current) {
      // 延迟一下确保音频已加载
      const timer = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch(error => {
            console.error('自动播放失败:', error);
            // 自动播放失败不算错误，浏览器可能阻止自动播放
          });
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [autoPlay, currentAudioUrl]);

  // 播放/暂停切换
  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !currentAudioUrl) return;

    try {
      setError(null);

      if (isPlaying) {
        audio.pause();
        setCurrentPlayingId(null);
      } else {
        // 设置当前播放状态
        setCurrentPlayingId(currentItemId);
        await audio.play();
      }
    } catch (error) {
      console.error('播放控制失败:', error);
      if (currentAudioUrl.startsWith('blob:')) {
        setError('音频已过期，请重新生成');
      } else {
        setError('播放失败');
      }
    }
  }, [isPlaying, currentAudioUrl, isLoading, currentPlayingId, currentItemId, setCurrentPlayingId]);

  // 进度控制
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  // 下载处理
  const handleDownload = useCallback(() => {
    if (!currentAudioUrl) return;

    const text = historyItem?.text || 'tts_audio';
    onDownload?.(currentAudioUrl, text);
  }, [currentAudioUrl, historyItem, onDownload]);

  // 复制链接处理
  const handleCopyLink = useCallback(() => {
    if (historyItem && onCopyLink) {
      onCopyLink(historyItem);
    }
  }, [historyItem, onCopyLink]);

  // 格式化时间
  const formatTime = useCallback((time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const minutes = Math.floor(Math.max(0, time) / 60);
    const seconds = Math.floor(Math.max(0, time) % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      // 确保在组件卸载时清理 blob URL
      cleanup();
    };
  }, [cleanup]);

  // 如果没有音频URL，不渲染
  if (!currentAudioUrl) return null;

  // 渲染不同变体
  const renderMinimal = () => (
    <div className={className}>
      <audio ref={audioRef} src={currentAudioUrl} preload="metadata" />
      <Button
        onClick={togglePlay}
        variant="ghost"
        size="sm"
        className={`p-1.5 h-7 w-7 ${isPlaying ? 'text-green-600' : 'text-gray-600'} hover:text-green-700`}
        disabled={!currentAudioUrl}
        title={isPlaying ? "暂停" : "播放"}
      >
        <FontAwesomeIcon
          icon={isPlaying ? faPause : faPlay}
          className="text-xs"
        />
      </Button>
    </div>
  );

  const renderCompact = () => (
    <div className={`flex items-center gap-2 ${className}`}>
      <audio ref={audioRef} src={currentAudioUrl} preload="metadata" />

      <Button
        onClick={togglePlay}
        variant={isPlaying ? "default" : "ghost"}
        size="sm"
        className={`p-1.5 h-8 w-8 ${isPlaying ? 'bg-green-500 hover:bg-green-600 text-white' : 'text-gray-600 hover:text-gray-800'}`}
        disabled={!currentAudioUrl}
      >
        <FontAwesomeIcon
          icon={isPlaying ? faPause : faPlay}
          className="text-xs"
        />
      </Button>

      {showProgress && duration > 0 && (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-green-500"
            style={{
              background: `linear-gradient(to right, rgb(34 197 94) 0%, rgb(34 197 94) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgb(229 231 235) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgb(229 231 235) 100%)`
            }}
          />
          <div className="flex items-center gap-1 text-xs text-gray-500 min-w-[60px] font-mono">
            <span>{formatTime(currentTime)}</span>
            <span className="text-gray-400">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}

      {showDownload && (
        <Button
          onClick={handleDownload}
          variant="ghost"
          size="sm"
          className="p-1.5 h-8 w-8 text-gray-600 hover:text-green-600"
          title="下载"
        >
          <FontAwesomeIcon icon={faDownload} className="text-xs" />
        </Button>
      )}
    </div>
  );

  const renderFull = () => (
    <div className={`${className}`}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm mb-3">
          {error}
        </div>
      )}

      <audio ref={audioRef} src={currentAudioUrl} preload="metadata" />

      {/* 紧凑的播放控制器 */}
      <div className="flex items-center gap-3">
        {/* 左侧播放和下载按钮 */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            disabled={!currentAudioUrl}
            className="h-8 w-8 flex items-center justify-center text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 hover:text-gray-800 transition-colors duration-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            title={isPlaying ? "暂停" : "播放"}
          >
            <FontAwesomeIcon
              icon={isPlaying ? faPause : faPlay}
              className="w-3.5 h-3.5"
            />
          </button>

          {showDownload && (
            <button
              onClick={handleDownload}
              className="h-8 w-8 flex items-center justify-center text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 hover:text-gray-800 transition-colors duration-200"
              title="下载音频"
            >
              <FontAwesomeIcon icon={faDownload} className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 中间进度条 */}
        {showProgress && duration > 0 && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-600 min-w-[35px] text-right">
                {formatTime(currentTime)}
              </span>
              <div className="flex-1 relative">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-green-500"
                  style={{
                    background: `linear-gradient(to right, rgb(34 197 94) 0%, rgb(34 197 94) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgb(229 231 235) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgb(229 231 235) 100%)`
                  }}
                />
              </div>
              <span className="text-xs font-mono text-gray-600 min-w-[35px]">
                {formatTime(duration)}
              </span>
            </div>
          </div>
        )}

  
        {/* 其他操作按钮 */}
        {showCopyLink && historyItem && onCopyLink && (
          <Button
            onClick={handleCopyLink}
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
          >
            <FontAwesomeIcon icon={faCopy} className="mr-1" />
            复制
          </Button>
        )}
      </div>
    </div>
  );

  // 根据变体渲染不同样式
  switch (variant) {
    case 'minimal':
      return renderMinimal();
    case 'compact':
      return renderCompact();
    case 'full':
    default:
      return renderFull();
  }
};