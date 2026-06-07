import { useState } from 'react';

interface SettingsPanelProps {
  onClose: () => void;
  maxTasks: number;
  onMaxTasksChange: (value: number) => void;
}

/** 设置面板组件 */
export default function SettingsPanel({
  onClose,
  maxTasks,
  onMaxTasksChange,
}: SettingsPanelProps) {
  const [localMaxTasks, setLocalMaxTasks] = useState(maxTasks);

  const handleSave = () => {
    onMaxTasksChange(localMaxTasks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md glass-card rounded-2xl p-6">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">设置</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 设置项 */}
        <div className="space-y-6">
          {/* 任务缓存数量 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--text-secondary)]">最大缓存任务数</label>
              <span className="text-sm text-purple-400 font-medium">{localMaxTasks}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={localMaxTasks}
              onChange={e => setLocalMaxTasks(Number(e.target.value))}
              className="w-full h-2 cursor-pointer appearance-none rounded-full bg-[var(--surface-hover)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-purple-500 [&::-webkit-slider-thumb]:to-indigo-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-purple-500/30"
            />
            <p className="text-xs text-[var(--text-muted)]">
              侧栏历史记录中保留的最近任务数量
            </p>
          </div>

          {/* 分隔线 */}
          <div className="border-t border-[var(--border-glass-light)]" />

          {/* 关于 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">关于</h3>
            <div className="p-4 rounded-xl bg-[var(--surface-hover)]">
              <p className="text-sm text-[var(--text-primary)] font-medium mb-1">
                音频源分离器
              </p>
              <p className="text-xs text-[var(--text-muted)] mb-3">
                基于 Demucs (Meta AI) 的高质量音频源分离工具。
                支持6轨和高精度4轨分离模式。
              </p>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <span>版本：</span>
                <span className="text-purple-400">1.0.0</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-1">
                <span>作者：</span>
                <span className="text-purple-400 font-medium">CmzYa</span>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-[var(--border-glass-light)]">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)]"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 btn-primary rounded-xl px-4 py-2.5 text-sm font-medium text-white"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}