import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AudioPlayer({ audioUrl, fileName = 'audio.mp3' }) {
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateDuration = () => setDuration(audio.duration);
    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnd = () => setPlaying(false);

    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnd);

    return () => {
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnd);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    if (audioRef.current) {
      audioRef.current.currentTime = percent * duration;
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg max-w-xs">
      <audio ref={audioRef} src={audioUrl} />
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={togglePlay}
        className="shrink-0 text-teal-500 hover:text-teal-600"
      >
        {playing ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5" />
        )}
      </Button>

      <div className="flex-1 min-w-0">
        <div
          onClick={handleProgressClick}
          className="w-full h-1.5 bg-slate-300 rounded-full cursor-pointer relative group"
        >
          <div
            className="h-full bg-teal-500 rounded-full"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-teal-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <a
        href={audioUrl}
        download={fileName}
        className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <Download className="w-4 h-4" />
      </a>
    </div>
  );
}
