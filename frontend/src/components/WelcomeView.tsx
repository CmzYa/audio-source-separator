interface WelcomeViewProps {
  onNewTask: () => void;
}

/** 欢迎视图（空状态） */
export default function WelcomeView({ onNewTask }: WelcomeViewProps) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 mb-6">
          <svg className="h-10 w-10 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 18V6M10 18V10M14 18V4M18 18V8" strokeLinecap="round" />
          </svg>
        </div>

        <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">音频源分离器</h2>
        <p className="text-[var(--text-muted)] mb-8">
          将音频文件分离为人声、鼓、贝斯、钢琴、吉他等独立音轨
        </p>

        <button
          onClick={onNewTask}
          className="btn-primary rounded-xl px-8 py-3 text-white font-medium inline-flex items-center gap-2"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          创建新任务
        </button>

        {/* 特性列表 */}
        <div className="mt-12 grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <svg className="h-4 w-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            6轨分离模式
          </div>
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <svg className="h-4 w-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            高精度模式
          </div>
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <svg className="h-4 w-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            实时预览播放
          </div>
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <svg className="h-4 w-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            单轨下载
          </div>
        </div>
      </div>
    </div>
  );
}