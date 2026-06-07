import { useState, useCallback } from 'react';
import FileUpload from './FileUpload';
import ModelSelector from './ModelSelector';
import type { ModelType } from '../types';

interface NewTaskViewProps {
  onSubmit: (file: File, model: ModelType) => Promise<void>;
  onCancel?: () => void;
}

/** 新任务视图 */
export default function NewTaskView({ onSubmit, onCancel }: NewTaskViewProps) {
  const [file, setFile] = useState<File | null>(null);
  const [model, setModel] = useState<ModelType>('htdemucs_6s');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!file) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(file, model);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
      setIsSubmitting(false);
    }
  }, [file, model, onSubmit]);

  return (
    <div className="flex-1 flex flex-col">
      {/* 头部 */}
      <header className="px-8 py-6 border-b border-[var(--border-glass-light)]">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">新建分离任务</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">上传音频文件，分离为独立音轨</p>
      </header>

      {/* 内容 */}
      <main className="flex-1 px-8 py-8 overflow-y-auto">
        <div className="max-w-2xl space-y-8">
          {/* 文件上传 */}
          <FileUpload file={file} onFileSelect={setFile} disabled={isSubmitting} />

          {/* 配置区域 */}
          <div className="glass-card rounded-2xl p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <ModelSelector model={model} onModelChange={setModel} disabled={isSubmitting} />

              <div className="flex items-end">
                <button
                  onClick={handleSubmit}
                  disabled={!file || isSubmitting}
                  className="btn-primary w-full rounded-xl px-6 py-3 font-medium text-white"
                >
                  {isSubmitting ? '处理中...' : '开始分离'}
                </button>
              </div>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="message-error rounded-xl px-4 py-3 flex items-center gap-3">
              <svg className="h-5 w-5 text-red-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {/* 取消按钮 */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="btn-secondary rounded-xl px-6 py-2.5 text-sm font-medium text-[var(--text-secondary)]"
            >
              取消
            </button>
          )}
        </div>
      </main>
    </div>
  );
}