import { useEffect, useState } from 'react';

interface Warning {
  type: string;
  message: string;
  solution: string;
  link: string;
  severity: string;
}

interface EnvironmentCheck {
  device_info: {
    device: 'cuda' | 'cpu';
    pytorch_installed: boolean;
    cuda_available: boolean;
    builtin_pytorch: boolean;
  };
  warnings: Warning[];
  ready: boolean;
}

interface EnvironmentModalProps {
  onClose: () => void;
}

/** 启动检测模态框 - 检测 CUDA（内置 PyTorch，无需安装） */
export default function EnvironmentModal({ onClose }: EnvironmentModalProps) {
  const [envCheck, setEnvCheck] = useState<EnvironmentCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [shouldClose, setShouldClose] = useState(false);

  useEffect(() => {
    fetch('/api/environment')
      .then(res => res.json())
      .then(data => {
        setEnvCheck(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // 环境就绪时延迟关闭
  useEffect(() => {
    if (envCheck?.ready && envCheck.warnings.length === 0) {
      setShouldClose(true);
    }
  }, [envCheck]);

  useEffect(() => {
    if (shouldClose) {
      onClose();
    }
  }, [shouldClose, onClose]);

  // 加载中
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="glass-card rounded-2xl p-8 text-center">
          <svg className="h-8 w-8 animate-spin text-purple-400 mx-auto" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="mt-4 text-[var(--text-secondary)]">正在检测环境...</p>
        </div>
      </div>
    );
  }

  // 后端离线
  if (!envCheck) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="glass-card rounded-2xl p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">后端离线</h2>
          </div>
          
          <p className="text-sm text-[var(--text-muted)] mb-6">
            无法连接到后端服务器，请确保后端正在运行。
          </p>
          
          <button
            onClick={onClose}
            className="w-full btn-secondary rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)]"
          >
            关闭
          </button>
        </div>
      </div>
    );
  }

  // CUDA 未检测到（仅提示，不阻止）
  const hasCudaWarning = envCheck.warnings.some(w => w.type === 'cuda_missing');
  const isCudaAvailable = envCheck.device_info.cuda_available;

  if (isCudaAvailable) {
    // CUDA 可用，直接关闭
    onClose();
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card rounded-2xl p-6 max-w-lg">
        {/* 头部 */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">运行模式提示</h2>
        </div>

        {/* CUDA 未检测到 */}
        {hasCudaWarning && (
          <div className="mb-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-2 mb-2">
              <svg className="h-4 w-4 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-yellow-400">CUDA 驱动未检测到</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              将使用 CPU 模式运行，处理速度较慢。安装 CUDA 驱动可获得 GPU 加速。
            </p>
            <a
              href="https://developer.nvidia.com/cuda-downloads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-purple-400 hover:text-purple-300 underline"
            >
              下载 CUDA 驱动
            </a>
          </div>
        )}

        {/* 说明 */}
        <div className="p-3 rounded-xl bg-[var(--surface-hover)] mb-6">
          <p className="text-xs text-[var(--text-muted)]">
            本软件已内置 PyTorch，无需额外安装。检测到 CUDA 驱动时将自动启用 GPU 加速。
          </p>
        </div>

        {/* 按钮 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 btn-primary rounded-xl px-4 py-2.5 text-sm font-medium text-white"
          >
            继续使用
          </button>
        </div>
      </div>
    </div>
  );
}