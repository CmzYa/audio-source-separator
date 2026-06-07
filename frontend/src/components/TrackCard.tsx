import type { StemInfo } from '../types';

interface TrackCardProps {
  stem: StemInfo;
}

/** 音轨图标 SVG 组件，根据音轨名称显示不同图标 */
function TrackIcon({ name, color }: { name: string; color: string }) {
  switch (name) {
    case 'vocals':
      return (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a4 4 0 00-4 4v4a4 4 0 008 0V5a4 4 0 00-4-4zM4 10a8 8 0 0016 0M12 18v5m-4 0h8" />
        </svg>
      );
    case 'drums':
      return (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
          <circle cx="12" cy="12" r="8" />
          <path strokeLinecap="round" d="M4 12h16M12 4v16M8 8l8 8M16 8l-8 8" />
        </svg>
      );
    case 'bass':
      return (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h6" />
          <path strokeLinecap="round" d="M18 12l-3 3m3-3l-3-3" />
        </svg>
      );
    case 'piano':
      return (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <rect x="6" y="4" width="3" height="9" fill={color} opacity="0.3" />
          <rect x="11" y="4" width="3" height="9" fill={color} opacity="0.3" />
          <rect x="16" y="4" width="3" height="9" fill={color} opacity="0.3" />
        </svg>
      );
    case 'guitar':
      return (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v4M9 7h6M12 11c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5z" />
          <circle cx="12" cy="16" r="2" />
        </svg>
      );
    default:
      return (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
        </svg>
      );
  }
}

/** 音轨卡片组件 */
export default function TrackCard({ stem }: TrackCardProps) {
  return (
    <div
      className="group rounded-xl border border-gray-700/50 bg-gray-800/40 p-5 backdrop-blur-sm transition-all duration-200 hover:border-gray-600 hover:bg-gray-800/60"
    >
      {/* 头部：图标 + 名称 */}
      <div className="mb-4 flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${stem.color}20` }}
        >
          <TrackIcon name={stem.name} color={stem.color} />
        </div>
        <div>
          <h3 className="font-semibold text-white">{stem.displayName}</h3>
          <p className="text-xs text-gray-500">{stem.name}</p>
        </div>
      </div>

      {/* 音频播放器 */}
      <audio
        controls
        preload="metadata"
        className="mb-3 w-full"
        style={{ filter: `hue-rotate(${getHueRotate(stem.color)})` }}
      >
        <source src={stem.downloadUrl} type="audio/wav" />
      </audio>

      {/* 下载按钮 */}
      <a
        href={stem.downloadUrl}
        download
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150"
        style={{
          backgroundColor: `${stem.color}20`,
          color: stem.color,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.backgroundColor = `${stem.color}30`;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.backgroundColor = `${stem.color}20`;
        }}
      >
        {/* 下载图标 */}
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        Download
      </a>
    </div>
  );
}

/** 根据颜色计算 hue-rotate 值，用于音频播放器色调 */
function getHueRotate(color: string): number {
  const hueMap: Record<string, number> = {
    '#8B5CF6': 240,  // vocals - purple
    '#EF4444': 0,    // drums - red
    '#3B82F6': 200,  // bass - blue
    '#10B981': 150,  // piano - green
    '#F97316': 30,   // guitar - orange
    '#F59E0B': 40,   // other - amber
  };
  return hueMap[color] ?? 0;
}