import type { TrackState } from '../hooks/useAudioMixer';

interface TrackMixerCardProps {
  track: TrackState;
  trackIndex: number;
  onMuteChange: (index: number, muted: boolean) => void;
  onVolumeChange: (index: number, volume: number) => void;
}

/** 音轨图标 SVG 组件 */
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

/** 单音轨控制卡片组件 */
export default function TrackMixerCard({
  track,
  trackIndex,
  onMuteChange,
  onVolumeChange,
}: TrackMixerCardProps) {
  const { stem, muted, volume, loaded } = track;
  const color = stem.color;

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        muted 
          ? 'border-gray-600/30 bg-gray-800/20 opacity-60' 
          : 'border-gray-700/50 bg-gray-800/40'
      }`}
      style={{ borderColor: muted ? undefined : `${color}30` }}
    >
      {/* 头部：图标 + 名称 + 静音按钮 */}
      <div className="flex items-center gap-3 mb-3">
        {/* 音轨图标 */}
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <TrackIcon name={stem.name} color={color} />
        </div>

        {/* 音轨名称 */}
        <div className="flex-1">
          <h3 className="font-semibold text-white">{stem.displayName}</h3>
          <p className="text-xs text-gray-500">{stem.name}</p>
        </div>

        {/* 静音按钮 */}
        <button
          onClick={() => onMuteChange(trackIndex, !muted)}
          disabled={!loaded}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
            muted 
              ? 'bg-red-500/20 text-red-400' 
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
      </div>

      {/* 音量控制 */}
      <div className="flex items-center gap-2 mb-3">
        <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072" />
        </svg>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(volume * 100)}
          onChange={e => onVolumeChange(trackIndex, Number(e.target.value) / 100)}
          disabled={!loaded || muted}
          className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          style={{ accentColor: color }}
        />
        <span className="text-xs text-gray-400 w-8">{Math.round(volume * 100)}%</span>
      </div>

      {/* 加载状态指示 */}
      {!loaded && (
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
          <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </div>
      )}

      {/* 下载按钮 */}
      <a
        href={stem.downloadUrl}
        download
        className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
          loaded 
            ? 'hover:opacity-80' 
            : 'opacity-50 cursor-not-allowed'
        }`}
        style={{
          backgroundColor: `${color}20`,
          color: color,
        }}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        Download
      </a>
    </div>
  );
}