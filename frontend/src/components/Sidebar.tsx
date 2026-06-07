import type { CachedTask, TaskStatus } from '../hooks/useTaskManager';
import DeviceStatus from './DeviceStatus';

interface SidebarProps {
  tasks: CachedTask[];
  activeTaskId: string | null;
  onNewTask: () => void;
  onSelectTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onOpenSettings: () => void;
  themeMode: 'dark' | 'light' | 'system';
  onToggleTheme: () => void;
}

/** 状态图标 */
function StatusIcon({ status }: { status: TaskStatus }) {
  switch (status) {
    case 'pending':
      return (
        <svg className="h-4 w-4 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" d="M12 6v6l4 2" />
        </svg>
      );
    case 'processing':
      return (
        <svg className="h-4 w-4 text-purple-400 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      );
    case 'completed':
      return (
        <svg className="h-4 w-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'failed':
      return (
        <svg className="h-4 w-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

/** 主题图标 */
function ThemeIcon({ mode }: { mode: 'dark' | 'light' | 'system' }) {
  if (mode === 'light') {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="5" />
        <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    );
  }
  if (mode === 'system') {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path strokeLinecap="round" d="M8 21h8M12 17v4" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

/** 主题名称 */
function ThemeName({ mode }: { mode: 'dark' | 'light' | 'system' }) {
  if (mode === 'light') return '浅色';
  if (mode === 'system') return '自动';
  return '深色';
}

/** 格式化时间 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return date.toLocaleDateString();
}

/** 侧栏组件 */
export default function Sidebar({
  tasks,
  activeTaskId,
  onNewTask,
  onSelectTask,
  onDeleteTask,
  onOpenSettings,
  themeMode,
  onToggleTheme,
}: SidebarProps) {
  return (
    <aside className="w-64 h-screen flex flex-col sidebar-bg">
      {/* Logo 区域 */}
      <div className="p-5 border-b border-[var(--border-glass-light)]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg shadow-purple-500/20">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 18V6M10 18V10M14 18V4M18 18V8" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[var(--text-primary)]">音频分离器</h1>
            <p className="text-xs text-[var(--text-muted)]">Demucs 引擎</p>
          </div>
        </div>
      </div>

      {/* 设备状态 */}
      <div className="px-4 py-3">
        <DeviceStatus />
      </div>

      {/* 新建任务按钮 */}
      <div className="px-4">
        <button
          onClick={onNewTask}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/30 transition-all"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium">新建任务</span>
        </button>
      </div>

      {/* 任务列表 */}
      <div className="flex-1 overflow-y-auto px-2">
        <div className="px-2 py-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
          最近任务
        </div>
        
        {tasks.length === 0 ? (
          <div className="px-4 py-8 text-center text-[var(--text-muted)] text-sm">
            暂无任务
          </div>
        ) : (
          <div className="space-y-1">
            {tasks.map(task => (
              <div
                key={task.id}
                onClick={() => onSelectTask(task.id)}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                  activeTaskId === task.id
                    ? 'sidebar-task-active'
                    : 'hover:bg-[var(--surface-hover)]'
                }`}
              >
                <StatusIcon status={task.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate">{task.fileName}</p>
                  <p className="text-xs text-[var(--text-muted)]">{formatTime(task.createdAt)}</p>
                </div>
                
                {/* 删除按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTask(task.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 flex h-6 w-6 items-center justify-center rounded-lg hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 transition-all"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                {/* 进度条 */}
                {task.status === 'processing' && (
                  <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-[var(--surface-hover)] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部：主题切换 + 设置 + 作者 */}
      <div className="p-4 border-t border-[var(--border-glass-light)] space-y-2">
        {/* 主题切换 */}
        <button
          onClick={onToggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
        >
          <ThemeIcon mode={themeMode} />
          <span className="text-sm">{ThemeName({ mode: themeMode })}</span>
        </button>

        {/* 设置 */}
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm">设置</span>
        </button>

        {/* 作者信息 */}
        <div className="pt-2 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            作者：<span className="text-purple-400 font-medium">CmzYa</span>
          </p>
        </div>
      </div>
    </aside>
  );
}