import type { TrackState } from '../hooks/useAudioMixer';
import WaveformDisplay from './WaveformDisplay';

interface TrackRowProps {
  track: TrackState;
  trackIndex: number;
  progress: number;  // 0-1 当前播放进度
  onMuteChange: (index: number, muted: boolean) => void;
  onVolumeChange: (index: number, volume: number) => void;
  onSolo: (index: number) => void;
  onSeek?: (progress: number) => void;
}

/** 音轨图标 SVG 组件 */
function TrackIcon({ name, color }: { name: string; color: string }) {
  switch (name) {
    case 'vocals':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a4 4 0 00-4 4v4a4 4 0 008 0V5a4 4 0 00-4-4zM4 10a8 8 0 0016 0M12 18v5m-4 0h8" />
        </svg>
      );
    case 'drums':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
          <circle cx="12" cy="12" r="8" />
          <path strokeLinecap="round" d="M4 12h16M12 4v16M8 8l8 8M16 8l-8 8" />
        </svg>
      );
    case 'bass':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h6" />
          <path strokeLinecap="round" d="M18 12l-3 3m3-3l-3-3" />
        </svg>
      );
    case 'piano':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <rect x="6" y="4" width="3" height="9" fill={color} opacity="0.3" />
          <rect x="11" y="4" width="3" height="9" fill={color} opacity="0.3" />
          <rect x="16" y="4" width="3" height="9" fill={color} opacity="0.3" />
        </svg>
      );
    case 'guitar':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v4M9 7h6M12 11c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5z" />
          <circle cx="12" cy="16" r="2" />
        </svg>
      );
    default:
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
        </svg>
      );
  }
}

/** 音轨名称映射 */
const TRACK_NAMES: Record<string, string> = {
  vocals: '人声',
  drums: '鼓',
  bass: '贝斯',
  piano: '钢琴',
  guitar: '吉他',
  other: '其他',
};

/** 纵向排列的音轨行组件（带频谱显示） */
export default function TrackRow({
  track,
  trackIndex,
  progress,
  onMuteChange,
  onVolumeChange,
  onSolo,
  onSeek,
}: TrackRowProps) {
  const { stem, muted, volume, audioBuffer, loaded } = track;
  const color = stem.color;

  return (
    <div
      className={`track-row flex items-center gap-4 rounded-xl p-3 ${muted ? 'muted' : ''}`}
    >
      {/* 左侧：图标 + 名称 */}
      <div className="flex items-center gap-3 w-24 shrink-0">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}15`, boxShadow: `0 0 8px ${color}20` }}
        >
          <TrackIcon name={stem.name} color={color} />
        </div>
        <div>
          <h3 className="font-medium text-[var(--text-primary)] text-sm">
            {TRACK_NAMES[stem.name] || stem.displayName}
          </h3>
        </div>
      </div>

      {/* 中间：频谱显示 */}
      <div className="flex-1 min-w-0">
        {loaded && audioBuffer ? (
          <WaveformDisplay
            audioBuffer={audioBuffer}
            color={color}
            progress={progress}
            height={48}
            onSeek={onSeek}
          />
        ) : (
          <div 
            className="waveform-container w-full rounded flex items-center justify-center"
            style={{ height: '48px' }}
          >
            <svg className="loading-spinner h-4 w-4 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
      </div>

      {/* 右侧：控制按钮 */}
      <div className="track-row-controls flex items-center gap-2 w-32 shrink-0">
        {/* 静音按钮 */}
        <button
          onClick={() => onMuteChange(trackIndex, !muted)}
          disabled={!loaded}
          className={`control-btn flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${muted ? 'muted' : ''}`}
          title={muted ? '取消静音' : '静音'}
        >
          {muted ? (
            <svg className="h-4 w-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="h-4 w-4 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>

        {/* Solo 按钮 */}
        <button
          onClick={() => onSolo(trackIndex)}
          disabled={!loaded}
          className="control-btn flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
          title="单独播放此轨道"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* 音量滑块 */}
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(volume * 100)}
          onChange={e => onVolumeChange(trackIndex, Number(e.target.value) / 100)}
          disabled={!loaded || muted}
          className="h-2 w-14 cursor-pointer appearance-none rounded-full bg-[var(--surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow"
          style={{ accentColor: color }}
        />

        {/* 下载按钮 */}
        <a
          href={stem.downloadUrl}
          download
          className={`control-btn flex h-8 w-8 items-center justify-center rounded-lg ${loaded ? 'text-[var(--text-muted)] hover:text-[var(--text-primary)]' : 'opacity-50 cursor-not-allowed'}`}
          title="下载"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </a>
      </div>
    </div>
  );
}