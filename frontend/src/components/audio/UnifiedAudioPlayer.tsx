import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faDownload, faCopy } from '@fortawesome/free-solid-svg-icons';
import { useTTSStore } from '../../hooks/useTTSStore';
import type { HistoryItem } from '../../types';

export interface UnifiedAudioPlayerProps {
  audioUrl?: string | null;
  historyItem?: HistoryItem | null;
  autoPlay?: boolean;
  itemId?: string;
  showControls?: boolean;
  showProgress?: boolean;
  showDownload?: boolean;
  showCopyLink?: boolean;
  onDownload?: (audioUrl: string, text: string) => void;
  onCopyLink?: (item: HistoryItem) => void;
  onPlayStateChange?: (isPlaying: boolean, itemId?: string) => void;
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
  const { setCurrentPlayingId } = useTTSStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const hasAutoPlayed = useRef(false);

  const currentAudioUrl = audioUrl || historyItem?.audioUrl || null;
  const currentItemId = itemId || historyItem?.id || null;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentAudioUrl) return;

    setError(null);

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
        if (!isNaN(audio.duration) && audio.duration !== Infinity) {
            setDuration(audio.duration);
        }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentPlayingId(null);
      onPlayStateChange?.(false, currentItemId || undefined);
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
    const handleError = () => {
        setIsPlaying(false);
        setError('音频加载失败');
    }

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, [currentAudioUrl, currentItemId, setCurrentPlayingId, onPlayStateChange]);

  useEffect(() => {
    hasAutoPlayed.current = false;
  }, [currentAudioUrl]);

  useEffect(() => {
    if (autoPlay && currentAudioUrl && audioRef.current && !hasAutoPlayed.current) {
      hasAutoPlayed.current = true;
      setTimeout(() => {
        audioRef.current?.play().catch(console.error);
      }, 100);
    }
  }, [autoPlay, currentAudioUrl]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !currentAudioUrl) return;

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        await audio.play();
      }
    } catch (error) {
      console.error('播放控制失败:', error);
      setError('播放失败');
    }
  }, [isPlaying, currentAudioUrl]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  const handleDownload = useCallback(() => {
    if (!currentAudioUrl) return;
    const text = historyItem?.text || 'tts_audio';
    onDownload?.(currentAudioUrl, text);
  }, [currentAudioUrl, historyItem, onDownload]);

  const formatTime = useCallback((time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const minutes = Math.floor(Math.max(0, time) / 60);
    const seconds = Math.floor(Math.max(0, time) % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  if (!currentAudioUrl) return null;

  return (
    <div className={`${className} bg-card border border-border rounded-xl p-4 shadow-sm`}>
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded mb-3">
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

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={togglePlay}
            disabled={!currentAudioUrl}
            variant={isPlaying ? 'default' : 'outline'}
            size="icon"
            className={`h-10 w-10 rounded-full ${isPlaying ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-accent'}`}
            title={isPlaying ? "暂停" : "播放"}
          >
            <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="h-4 w-4" />
          </Button>

          {showDownload && (
             <Button
                onClick={handleDownload}
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground hover:text-foreground"
                title="下载"
            >
                <FontAwesomeIcon icon={faDownload} className="h-4 w-4" />
            </Button>
          )}
        </div>

        {showProgress && (
          <div className="flex-1 min-w-0 flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground min-w-[35px] text-right">
                {formatTime(currentTime)}
            </span>
            <div className="flex-1 relative h-1.5 group cursor-pointer">
               <div className="absolute inset-0 bg-secondary rounded-full" />
               <div 
                    className="absolute inset-y-0 left-0 bg-primary rounded-full" 
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
               />
               <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
               />
            </div>
             <span className="text-xs font-mono text-muted-foreground min-w-[35px]">
                {formatTime(duration)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
