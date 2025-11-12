import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause } from '@fortawesome/free-solid-svg-icons';

interface SimpleAudioPlayerProps {
  audioUrl: string | null;
  isPlaying: boolean;
  onPlayStateChange: (playing: boolean) => void;
  className?: string;
}

export const SimpleAudioPlayer: React.FC<SimpleAudioPlayerProps> = ({
  audioUrl,
  isPlaying,
  onPlayStateChange,
  className = ''
}) => {
  const [internalPlaying, setInternalPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // 同步外部播放状态
  useEffect(() => {
    if (isPlaying !== internalPlaying) {
      setInternalPlaying(isPlaying);
      const audio = audioRef.current;
      if (audio) {
        if (isPlaying) {
          audio.play().catch(console.error);
        } else {
          audio.pause();
        }
      }
    }
  }, [isPlaying, internalPlaying]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const newPlayingState = !internalPlaying;
    setInternalPlaying(newPlayingState);
    onPlayStateChange(newPlayingState);

    if (newPlayingState) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  };

  const handleEnded = () => {
    setInternalPlaying(false);
    onPlayStateChange(false);
  };

  if (!audioUrl) return null;

  return (
    <div className={className}>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onEnded={handleEnded}
      />
      <Button
        onClick={togglePlay}
        variant="default"
        size="sm"
        className="w-full text-xs py-1 h-7"
      >
        <FontAwesomeIcon
          icon={internalPlaying ? faPause : faPlay}
          className="text-xs"
        />
      </Button>
    </div>
  );
};