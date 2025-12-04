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

  // 清理函数 - 不立即撤销，只是标记为可清理
  const markForCleanup = useCallback(() => {
    if (currentAudioUrl?.startsWith('blob:')) {
      console.log('标记 Blob URL 为可清理状态:', currentAudioUrl);
      // 不立即撤销，让垃圾回收自然处理
      const activeBlobs = (window as any).__activeBlobs;
      if (activeBlobs && activeBlobs.has(currentAudioUrl)) {
        activeBlobs.delete(currentAudioUrl);
        console.log('Blob 对象已从全局映射中移除，但不立即撤销 URL');
      }
    }
  }, [currentAudioUrl]);

  // 音频事件处理
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentAudioUrl) return;

    setIsLoading(true);
    setError(null);

    // 验证音频URL的有效性（使用更兼容的方式）
    if (currentAudioUrl.startsWith('blob:')) {
      // 对于 blob URL，不使用 HEAD 方法，而是直接设置
      // 浏览器会在实际加载时验证 blob URL 的有效性
      console.log('设置 Blob URL:', currentAudioUrl);
    }

    const handleLoadStart = () => {
      console.log('音频开始加载');
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      console.log('音频可以播放');
      setIsLoading(false);
    };

    const handleLoadedData = () => {
      console.log('音频数据加载完成');
      // 这里可以添加额外的验证逻辑
    };

    const handleLoadedMetadata = () => {
      console.log('音频元数据加载完成');
      // 验证音频元数据
      const audio = audioRef.current;
      if (audio && audio.duration && !isNaN(audio.duration)) {
        console.log('音频验证通过 - 时长:', audio.duration, '秒');
      } else {
        console.warn('音频元数据验证失败');
      }
    };
    const handleError = (e: Event) => {
      console.error('音频加载失败:', e);
      const audio = e.target as HTMLAudioElement;
      let errorMessage = '音频加载失败';

      // 详细调试信息
      console.error('音频元素调试信息:', {
        src: audio.src,
        currentSrc: audio.currentSrc,
        readyState: audio.readyState,
        networkState: audio.networkState,
        error: audio.error,
        errorCode: audio.error?.code,
        errorMessage: audio.error?.message,
      });

      // 检查具体错误类型
      if (audio.error) {
        switch (audio.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = '音频加载被中断';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = '网络错误，音频加载失败';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = '音频格式错误或文件损坏';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = '音频源不支持或已过期';
            // 检查是否是 blob URL 问题
            if (audio.src.startsWith('blob:')) {
              errorMessage += ' (Blob URL 可能已失效)';
            }
            break;
          default:
            errorMessage = `音频加载失败 (错误代码: ${audio.error.code})`;
        }
        console.error('详细音频错误:', audio.error);
      }

      setError(errorMessage);
      setIsLoading(false);
      setIsPlaying(false);
    };

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      const audioDuration = audio.duration;
      if (!isNaN(audioDuration)) {
        setDuration(audioDuration);
        console.log('音频时长:', audioDuration, '秒');

        // 验证音频数据有效性
        if (audioDuration <= 0) {
          console.error('音频时长异常:', audioDuration);
          setError('音频数据无效');
          return;
        }

        // 如果历史记录没有时长信息，更新它
        if (historyItem && !historyItem.duration && audioDuration > 0) {
          // 这里可以调用store更新历史记录的时长
        }
      } else {
        console.warn('无法获取音频时长');
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentPlayingId(null);
      onPlayStateChange?.(false, currentItemId || undefined);

      // 暂时不清理 Blob URL，让浏览器自然处理
      console.log('音频播放结束，但不立即清理 Blob URL');
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
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      // 移除所有事件监听器
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);

      // 暂时禁用清理，让浏览器自然管理 Blob 生命周期
      // console.log('组件清理，但不立即撤销 Blob URL');
    };
  }, [currentAudioUrl, currentItemId, historyItem, setCurrentPlayingId, onPlayStateChange, markForCleanup]);

  
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
      // 组件卸载时的清理工作
      // 目前让浏览器自然管理 Blob 生命周期
    };
  }, []);

  // 如果没有音频URL，不渲染
  if (!currentAudioUrl) return null;

  // 渲染不同变体
  const renderMinimal = () => (
    <div className={className}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-2 py-1 rounded text-xs mb-2">
          {error}
        </div>
      )}
      <audio
        ref={audioRef}
        src={currentAudioUrl}
        preload="metadata"
        crossOrigin="anonymous"
        controls={false}
        playsInline
      />
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
      <audio
        ref={audioRef}
        src={currentAudioUrl}
        preload="metadata"
        crossOrigin="anonymous"
        controls={false}
        playsInline
      />

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
          <div className="flex items-center justify-between">
            <span>{error}</span>
            {error.includes('已过期') && historyItem && (
              <button
                onClick={() => {
                  // 清除错误并触发重新生成
                  setError(null);
                  // 这里可以触发重新生成逻辑，但需要父组件处理
                  if (onPlayStateChange) {
                    onPlayStateChange(false, 'regenerate:' + historyItem.id);
                  }
                }}
                className="ml-3 text-red-600 hover:text-red-800 underline text-xs"
              >
                重新生成
              </button>
            )}
          </div>
        </div>
      )}

      <audio
        ref={audioRef}
        src={currentAudioUrl}
        preload="metadata"
        crossOrigin="anonymous"
        controls={false}
        playsInline
      />

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