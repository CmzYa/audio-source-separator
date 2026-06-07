import { useEffect, useState } from 'react';

interface DeviceInfo {
  device: 'cuda' | 'cpu';
  name: string;
  cuda_available: boolean;
  cuda_version: string | null;
  pytorch_version: string | null;
  pytorch_installed: boolean;
  gpu_count: number;
}

/** 设备状态组件 - 显示 CUDA/CPU 信息 */
export default function DeviceStatus() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/device')
      .then(res => res.json())
      .then(data => {
        setDeviceInfo(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-muted)]">
        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>检测中...</span>
      </div>
    );
  }

  if (!deviceInfo) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-red-400">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
        </svg>
        <span>后端离线</span>
      </div>
    );
  }

  // CUDA 模式
  if (deviceInfo.device === 'cuda' && deviceInfo.cuda_available) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
        <svg className="h-4 w-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
        <div className="text-xs">
          <span className="text-green-400 font-medium">CUDA</span>
          <span className="text-[var(--text-muted)] ml-1">{deviceInfo.name}</span>
        </div>
      </div>
    );
  }

  // PyTorch 已安装但 CUDA 不可用
  if (deviceInfo.pytorch_installed && !deviceInfo.cuda_available) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
        <svg className="h-4 w-4 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="text-xs">
          <span className="text-yellow-400 font-medium">CPU</span>
          <span className="text-[var(--text-muted)] ml-1">(较慢)</span>
        </div>
      </div>
    );
  }

  // PyTorch 未安装
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
      <svg className="h-4 w-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-xs text-red-400 font-medium">未安装 PyTorch</span>
    </div>
  );
}