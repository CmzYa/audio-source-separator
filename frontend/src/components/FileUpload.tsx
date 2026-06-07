import { useState, useCallback, useRef, type DragEvent } from 'react';

/** 支持的音频格式 */
const ACCEPTED_FORMATS = '.mp3,.wav,.flac,.ogg,.wma,.aac';
const ACCEPTED_TYPES = [
  'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg',
  'audio/x-ms-wma', 'audio/aac',
];

interface FileUploadProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
}

/** 文件上传组件，支持拖拽和点击选择 */
export default function FileUpload({ file, onFileSelect, disabled }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  /** 校验文件类型 */
  const validateFile = useCallback((f: File): boolean => {
    if (ACCEPTED_TYPES.includes(f.type)) return true;
    const ext = f.name.split('.').pop()?.toLowerCase();
    return ['mp3', 'wav', 'flac', 'ogg', 'wma', 'aac'].includes(ext ?? '');
  }, []);

  /** 处理文件选择 */
  const handleFile = useCallback((f: File) => {
    if (!validateFile(f)) {
      alert('不支持的文件格式，请上传 MP3、WAV、FLAC、OGG、WMA 或 AAC 文件');
      return;
    }
    onFileSelect(f);
  }, [onFileSelect, validateFile]);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [disabled, handleFile]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  /** 格式化文件大小 */
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`upload-zone glass-card rounded-2xl p-10 text-center cursor-pointer ${file ? 'has-file' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${dragOver ? 'border-purple-500/60 bg-purple-500/10' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FORMATS}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {file ? (
        <div className="flex flex-col items-center gap-3">
          {/* 文件图标 */}
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
            <svg className="h-7 w-7 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6m-6 4h6m-6 4h4M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-[var(--text-primary)]">{file.name}</p>
          <p className="text-sm text-[var(--text-muted)]">{formatSize(file.size)}</p>
          <p className="text-xs text-[var(--text-muted)]">点击或拖拽更换文件</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {/* 上传图标 */}
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10">
            <svg className="h-8 w-8 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-medium text-[var(--text-secondary)]">拖拽音频文件到这里</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">或点击选择文件</p>
          </div>
          <p className="text-xs text-[var(--text-muted)]">支持格式：MP3、WAV、FLAC、OGG、WMA、AAC</p>
        </div>
      )}
    </div>
  );
}