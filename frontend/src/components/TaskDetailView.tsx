import { useEffect, useRef, useCallback, useState } from 'react';
import AudioMixer from './AudioMixer';
import TrackRow from './TrackRow';
import SeparationProgress from './SeparationProgress';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAudioMixer } from '../hooks/useAudioMixer';
import type { CachedTask } from '../hooks/useTaskManager';
import type { SeparationTask, StemInfo } from '../types';

interface TaskDetailViewProps {
  task: CachedTask;
  onTaskUpdate: (id: string, updates: Partial<CachedTask>) => void;
  onBack?: () => void;
}

/** 任务详情视图 */
export default function TaskDetailView({
  task,
  onTaskUpdate,
  onBack,
}: TaskDetailViewProps) {
  const progressLineRef = useRef<HTMLDivElement>(null);
  const [isDraggingProgressLine, setIsDraggingProgressLine] = useState(false);

  // WebSocket 连接获取实时进度
  const { task: wsTask } = useWebSocket({ taskId: task.status === 'processing' ? task.id : null });

  const {
    mixerState,
    play,
    pause,
    stop,
    seek,
    setTrackMute,
    setTrackVolume,
    setMasterVolume,
    soloTrack,
    unsoloAll,
    loadTracks,
  } = useAudioMixer();

  // 合并 WebSocket 数据
  const currentTask: SeparationTask | null = wsTask ? {
    taskId: wsTask.taskId,
    status: wsTask.status,
    progress: wsTask.progress ?? task.progress,
    message: wsTask.message ?? '',
    stems: wsTask.stems ?? [],
  } : {
    taskId: task.id,
    status: task.status,
    progress: task.progress,
    message: '',
    stems: task.stems ?? [],
  };

  // 更新任务状态
  useEffect(() => {
    if (wsTask && wsTask.status !== task.status) {
      onTaskUpdate(task.id, {
        status: wsTask.status,
        progress: wsTask.progress,
        stems: wsTask.stems,
      });
    }
  }, [wsTask, task.id, task.status, onTaskUpdate]);

  // 加载音轨
  useEffect(() => {
    if (currentTask?.status === 'completed' && currentTask.stems && currentTask.stems.length > 0) {
      loadTracks(currentTask.stems as StemInfo[]);
    }
  }, [currentTask?.status, currentTask?.stems, loadTracks]);

  // 进度线拖拽（仅在点击波形区域时触发）
  const handleProgressLineMouseDown = useCallback((e: React.MouseEvent) => {
    // 检查点击目标是否是控件元素（按钮、滑块、链接等），如果是则不处理
    const target = e.target as HTMLElement;
    const isControlElement = 
      target.closest('button') || 
      target.closest('input[type="range"]') || 
      target.closest('a') ||
      target.closest('.track-row-controls');
    
    if (isControlElement || !progressLineRef.current || mixerState.duration <= 0) return;
    
    setIsDraggingProgressLine(true);
    const rect = progressLineRef.current.getBoundingClientRect();
    const progress = (e.clientX - rect.left) / rect.width;
    seek(progress * mixerState.duration);
  }, [mixerState.duration, seek]);

  useEffect(() => {
    if (!isDraggingProgressLine || !progressLineRef.current || mixerState.duration <= 0) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = progressLineRef.current!.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      seek(progress * mixerState.duration);
    };

    const handleMouseUp = () => setIsDraggingProgressLine(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingProgressLine, mixerState.duration, seek]);

  const handleTrackSeek = useCallback((progress: number) => {
    if (mixerState.duration > 0) seek(progress * mixerState.duration);
  }, [mixerState.duration, seek]);

  const isProcessing = currentTask?.status === 'processing' || currentTask?.status === 'pending';
  const isCompleted = currentTask?.status === 'completed';
  const isFailed = currentTask?.status === 'failed';

  return (
    <div className="flex-1 flex flex-col">
      {/* 头部 */}
      <header className="px-8 py-6 border-b border-[var(--border-glass-light)] flex items-center gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{task.fileName}</h2>
          <p className="text-sm text-[var(--text-muted)]">模型：{task.model}</p>
        </div>
      </header>

      {/* 内容 */}
      <main className="flex-1 px-8 py-8 overflow-y-auto">
        {/* 处理中状态 */}
        {isProcessing && currentTask && (
          <div className="max-w-2xl">
            <SeparationProgress task={currentTask} />
          </div>
        )}

        {/* 失败状态 */}
        {isFailed && (
          <div className="max-w-2xl space-y-6">
            <div className="message-error rounded-xl px-4 py-4">
              <p className="text-red-400 font-medium">分离失败</p>
              <p className="text-red-400/70 text-sm mt-1">请尝试使用其他文件或模型</p>
            </div>
          </div>
        )}

        {/* 完成状态 */}
        {isCompleted && currentTask?.stems && currentTask.stems.length > 0 && (
          <div className="space-y-6">
            {/* 完成提示 */}
            <div className="message-success rounded-xl px-4 py-3 flex items-center gap-3">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-400 text-sm font-medium">分离完成</span>
            </div>

            {/* 混音控制器 */}
            <AudioMixer
              mixerState={mixerState}
              onPlay={play}
              onPause={pause}
              onStop={stop}
              onSeek={seek}
              onMasterVolumeChange={setMasterVolume}
            />

            {/* 音轨列表 */}
            <div
              ref={progressLineRef}
              className="relative"
              onMouseDown={handleProgressLineMouseDown}
              style={{ cursor: mixerState.duration > 0 ? 'pointer' : 'default' }}
            >
              {/* 进度线 */}
              {mixerState.duration > 0 && (
                <div
                  className="progress-line absolute top-0 bottom-0 w-0.5 z-10 pointer-events-none"
                  style={{
                    left: `calc(7rem + (100% - 16rem) * ${mixerState.currentTime / mixerState.duration})`,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg shadow-purple-500/50" />
                </div>
              )}

              {/* 音轨 */}
              <div className="space-y-2">
                {mixerState.tracks.map((track, index) => (
                  <TrackRow
                    key={track.stem.name}
                    track={track}
                    trackIndex={index}
                    progress={mixerState.duration > 0 ? mixerState.currentTime / mixerState.duration : 0}
                    onMuteChange={setTrackMute}
                    onVolumeChange={setTrackVolume}
                    onSolo={soloTrack}
                    onSeek={handleTrackSeek}
                  />
                ))}
              </div>

              {/* 取消 Solo */}
              {mixerState.tracks.some(t => t.muted) && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={unsoloAll}
                    className="btn-secondary rounded-xl px-5 py-2.5 text-sm text-[var(--text-secondary)] flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    重置所有轨道
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}