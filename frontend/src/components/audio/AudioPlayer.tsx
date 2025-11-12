import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faVolumeUp, faDownload, faCopy } from '@fortawesome/free-solid-svg-icons';
import { useTTSStore } from '../../hooks/useTTSStore';

interface AudioPlayerProps {
  audioUrl: string | null;
  onDownload?: () => void;
  onCopyLink?: () => void;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  onDownload,
  onCopyLink,
  className = ''
}) => {
  const { currentPlayingId, setCurrentPlayingId } = useTTSStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentPlayingId(null);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl, setCurrentPlayingId]);

  // 响应 currentPlayingId 的变化
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const { history } = useTTSStore.getState();
    const currentItem = history.find(item => item.audioUrl === audioUrl);
    const isCurrentPlaying = currentItem && currentPlayingId === currentItem.id;

    if (isCurrentPlaying && !isPlaying) {
      // 如果当前音频应该播放但没在播放，开始播放
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(error => {
        console.error('播放失败:', error);
        setCurrentPlayingId(null);
      });
    } else if (!isCurrentPlaying && isPlaying) {
      // 如果当前音频不应该播放但在播放，停止播放
      audio.pause();
      setIsPlaying(false);
    }
  }, [currentPlayingId, audioUrl, isPlaying, setCurrentPlayingId]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    if (isPlaying) {
      audio.pause();
      setCurrentPlayingId(null);
    } else {
      audio.play();
      // 从历史记录中找到对应的ID并设置
      const { history } = useTTSStore.getState();
      const currentItem = history.find(item => item.audioUrl === audioUrl);
      if (currentItem) {
        setCurrentPlayingId(currentItem.id);
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!audioUrl) return null;

  return (
    <div className={className}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* 主控制器 */}
      <div className="flex items-center space-x-4 mb-6">
        <Button
          onClick={togglePlay}
          variant="default"
          size="icon"
          className="h-16 w-16 shadow-lg hover:shadow-xl"
        >
          <FontAwesomeIcon
            icon={isPlaying ? faPause : faPlay}
            className="text-white"
          />
        </Button>

        <div className="flex-1 space-y-4">
          {/* 进度条 */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-mono text-gray-600 min-w-[45px] text-right">
                {formatTime(currentTime)}
              </span>
              <div className="flex-1 relative">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                  style={{
                    background: `linear-gradient(to right, rgb(34 197 94) 0%, rgb(34 197 94) ${(currentTime / duration) * 100}%, rgb(229 231 235) ${(currentTime / duration) * 100}%, rgb(229 231 235) 100%)`
                  }}
                />
              </div>
              <span className="text-sm font-mono text-gray-600 min-w-[45px]">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* 音量控制 */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-3 flex-1">
              <FontAwesomeIcon
                icon={faVolumeUp}
                className="text-gray-500"
              />
              <div className="flex-1 relative">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                  style={{
                    background: `linear-gradient(to right, rgb(34 197 94) 0%, rgb(34 197 94) ${volume * 100}%, rgb(229 231 235) ${volume * 100}%, rgb(229 231 235) 100%)`
                  }}
                />
              </div>
              <span className="text-sm font-mono text-gray-600 min-w-[35px] text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-3 pt-2">
        {onDownload && (
          <Button onClick={onDownload} variant="default" size="sm" className="flex-1 sm:flex-initial">
            <FontAwesomeIcon icon={faDownload} className="mr-2" />
            下载音频
          </Button>
        )}

        {onCopyLink && (
          <Button onClick={onCopyLink} variant="outline" size="sm" className="flex-1 sm:flex-initial">
            <FontAwesomeIcon icon={faCopy} className="mr-2" />
            复制链接
          </Button>
        )}
      </div>
    </div>
  );
};