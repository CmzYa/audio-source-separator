import { useCallback, useEffect, useRef, useState } from 'react';
import type { MixerState } from '../hooks/useAudioMixer';

interface AudioMixerProps {
  mixerState: MixerState;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onMasterVolumeChange: (volume: number) => void;
}

/** 格式化时间为 mm:ss */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/** 主混音控制器组件 */
export default function AudioMixer({
  mixerState,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onMasterVolumeChange,
}: AudioMixerProps) {
  const { isPlaying, currentTime, duration, masterVolume, tracks } = mixerState;
  const allLoaded = tracks.length > 0 && tracks.every(t => t.loaded);
  
  // 进度条拖拽状态
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  /** 处理进度条点击/拖拽开始 */
  const handleProgressMouseDown = useCallback((e: React.MouseEvent) => {
    if (!progressRef.current || duration <= 0) return;
    setIsDragging(true);
    
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    onSeek(percent * duration);
  }, [duration, onSeek]);

  /** 拖拽时更新进度 */
  useEffect(() => {
    if (!isDragging || !progressRef.current || duration <= 0) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = progressRef.current!.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(percent * duration);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, duration, onSeek]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="glass-card rounded-2xl p-6">
      {/* 主控制按钮 */}
      <div className="flex items-center gap-5 mb-6">
        {/* 播放/暂停按钮 */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={!allLoaded}
          className="play-btn flex h-14 w-14 items-center justify-center rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isPlaying ? (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="h-6 w-6 ml-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* 停止按钮 */}
        <button
          onClick={onStop}
          disabled={!allLoaded}
          className="control-btn flex h-11 w-11 items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        </button>

        {/* 时间显示 */}
        <div className="flex items-center gap-2 text-sm font-mono">
          <span className="text-[var(--text-primary)] font-medium">{formatTime(currentTime)}</span>
          <span className="text-[var(--text-muted)]">/</span>
          <span className="text-[var(--text-muted)]">{formatTime(duration)}</span>
        </div>

        {/* 加载状态 */}
        {!allLoaded && (
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <svg className="loading-spinner h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            加载音频...
          </div>
        )}

        {/* 主音量控制 */}
        <div className="ml-auto flex items-center gap-3">
          <svg className="h-5 w-5 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
          </svg>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(masterVolume * 100)}
            onChange={e => onMasterVolumeChange(Number(e.target.value) / 100)}
            className="h-2 w-24 cursor-pointer appearance-none rounded-full bg-[var(--surface-hover)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-purple-500 [&::-webkit-slider-thumb]:to-indigo-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-purple-500/30"
          />
          <span className="text-xs text-[var(--text-muted)] w-8">{Math.round(masterVolume * 100)}%</span>
        </div>
      </div>

      {/* 进度条 */}
      <div
        ref={progressRef}
        onMouseDown={handleProgressMouseDown}
        className="progress-track relative h-3 cursor-pointer"
        style={{ cursor: duration > 0 ? 'pointer' : 'default' }}
      >
        {/* 已播放部分 */}
        <div
          className="progress-fill absolute left-0 top-0 h-full"
          style={{ width: `${progressPercent}%` }}
        />
        {/* 播放位置指示器 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-lg shadow-purple-500/30 border-2 border-purple-500"
          style={{ left: `${progressPercent}%`, marginLeft: '-10px' }}
        />
      </div>
    </div>
  );
}