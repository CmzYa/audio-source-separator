import type { SeparationTask } from '../types';

interface SeparationProgressProps {
  task: SeparationTask | null;
}

/** 状态文字映射 */
const STATUS_TEXT: Record<SeparationTask['status'], string> = {
  pending: '排队中...',
  processing: '正在分离...',
  completed: '已完成',
  failed: '失败',
};

/** 分离进度组件 */
export default function SeparationProgress({ task }: SeparationProgressProps) {
  if (!task) return null;

  const progress = Math.min(100, Math.max(0, task.progress));
  const isFailed = task.status === 'failed';
  const isCompleted = task.status === 'completed';

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* 状态图标 */}
          {task.status === 'processing' && (
            <svg className="loading-spinner h-5 w-5 text-purple-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {isCompleted && (
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {isFailed && (
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span className={`text-sm font-medium ${
            isFailed ? 'text-red-400' : isCompleted ? 'text-green-400' : 'text-[var(--text-secondary)]'
          }`}>
            {STATUS_TEXT[task.status]}
          </span>
        </div>
        <span className="text-sm font-mono text-[var(--text-muted)]">{progress.toFixed(0)}%</span>
      </div>

      {/* 进度条 */}
      <div className="progress-track h-3 w-full">
        <div
          className="progress-fill h-full"
          style={{
            width: `${progress}%`,
            background: isFailed
              ? 'linear-gradient(90deg, #EF4444, #F87171)'
              : isCompleted
                ? 'linear-gradient(90deg, #10B981, #34D399)'
                : undefined,
          }}
        />
      </div>

      {/* 状态消息 */}
      {task.message && (
        <p className="text-xs text-[var(--text-muted)] truncate">{task.message}</p>
      )}
    </div>
  );
}