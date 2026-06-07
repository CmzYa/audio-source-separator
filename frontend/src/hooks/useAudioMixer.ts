import { useCallback, useEffect, useRef, useState } from 'react';
import type { StemInfo } from '../types';

/** 单个音轨的状态 */
export interface TrackState {
  stem: StemInfo;
  muted: boolean;
  volume: number;      // 0-1
  audioBuffer: AudioBuffer | null;
  sourceNode: AudioBufferSourceNode | null;
  gainNode: GainNode | null;
  loaded: boolean;
}

/** 混音器状态 */
export interface MixerState {
  tracks: TrackState[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  masterVolume: number;  // 0-1
}

/** 混音器 Hook 返回值 */
export interface UseAudioMixerReturn {
  mixerState: MixerState;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setTrackMute: (trackIndex: number, muted: boolean) => void;
  setTrackVolume: (trackIndex: number, volume: number) => void;
  setMasterVolume: (volume: number) => void;
  soloTrack: (trackIndex: number) => void;
  unsoloAll: () => void;
  loadTracks: (stems: StemInfo[]) => Promise<void>;
}

/**
 * Web Audio API 多音轨混音器 Hook
 * 支持同步播放、独立静音、音量调节
 */
export function useAudioMixer(): UseAudioMixerReturn {
  // AudioContext 引用
  const audioContextRef = useRef<AudioContext | null>(null);
  // 各音轨状态
  const [tracks, setTracks] = useState<TrackState[]>([]);
  const tracksRef = useRef<TrackState[]>([]);
  
  // 播放状态（使用 ref 存储实际状态，state 仅用于渲染）
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  
  // 当前播放时间（ref 存储实际值，state 用于渲染）
  const [currentTime, setCurrentTime] = useState(0);
  const currentTimeRef = useRef(0);
  
  // 总时长
  const [duration, setDuration] = useState(0);
  const durationRef = useRef(0);
  
  // 主音量
  const [masterVolume, setMasterVolume] = useState(0.8);
  const masterVolumeRef = useRef(0.8);
  
  // 主 GainNode
  const masterGainRef = useRef<GainNode | null>(null);
  // 播放开始时间（用于计算当前时间）
  const startTimeRef = useRef<number>(0);
  // 动画帧 ID
  const animationFrameRef = useRef<number | null>(null);

  // 同步 tracks 到 ref
  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  /** 初始化 AudioContext */
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.connect(audioContextRef.current.destination);
      masterGainRef.current.gain.value = masterVolumeRef.current;
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  /** 清理当前播放状态和音频节点 */
  const cleanupPlayback = useCallback(() => {
    // 停止所有 SourceNode
    tracksRef.current.forEach(track => {
      if (track.sourceNode) {
        try { track.sourceNode.stop(); } catch {}
      }
      // 断开旧 GainNode，避免残留连接
      if (track.gainNode) {
        try { track.gainNode.disconnect(); } catch {}
      }
    });

    // 取消动画帧
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // 重置播放状态
    isPlayingRef.current = false;
    setIsPlaying(false);
    currentTimeRef.current = 0;
    setCurrentTime(0);
  }, []);

  /** 加载所有音轨音频 */
  const loadTracks = useCallback(async (stems: StemInfo[]) => {
    // 先清理旧的播放状态和音频节点
    cleanupPlayback();

    const ctx = initAudioContext();
    
    const initialTracks: TrackState[] = stems.map(stem => ({
      stem,
      muted: false,
      volume: 0.8,
      audioBuffer: null,
      sourceNode: null,
      gainNode: null,
      loaded: false,
    }));
    setTracks(initialTracks);
    tracksRef.current = initialTracks;

    const loadPromises = stems.map(async (stem, index) => {
      try {
        const response = await fetch(stem.downloadUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        
        const gainNode = ctx.createGain();
        gainNode.connect(masterGainRef.current!);
        gainNode.gain.value = initialTracks[index].volume;

        setTracks(prev => {
          const newTracks = [...prev];
          newTracks[index] = {
            ...newTracks[index],
            audioBuffer,
            gainNode,
            loaded: true,
          };
          tracksRef.current = newTracks;
          return newTracks;
        });

        return audioBuffer;
      } catch (error) {
        console.error(`Failed to load track ${stem.name}:`, error);
        return null;
      }
    });

    const buffers = await Promise.all(loadPromises);
    
    const maxDuration = buffers.reduce((max, buffer) => 
      buffer ? Math.max(max, buffer.duration) : max, 0
    );
    setDuration(maxDuration);
    durationRef.current = maxDuration;
  }, [initAudioContext, cleanupPlayback]);

  /** 创建 AudioBufferSourceNode 并开始播放 */
  const createAndStartSource = useCallback((track: TrackState, offset: number, ctx: AudioContext) => {
    if (!track.audioBuffer || !track.gainNode) return null;

    const source = ctx.createBufferSource();
    source.buffer = track.audioBuffer;
    source.connect(track.gainNode);
    
    source.loop = true;
    source.loopStart = 0;
    source.loopEnd = track.audioBuffer.duration;

    source.start(0, offset % track.audioBuffer.duration);
    return source;
  }, []);

  /** 停止所有 SourceNode 并清除引用 */
  const stopAllSources = useCallback(() => {
    const newTracks = tracksRef.current.map(track => {
      if (track.sourceNode) {
        try { track.sourceNode.stop(); } catch {}
      }
      return { ...track, sourceNode: null };
    });
    tracksRef.current = newTracks;
    setTracks(newTracks);
  }, []);

  /** 更新所有音轨的 SourceNode */
  const updateAllSources = useCallback((offset: number, ctx: AudioContext) => {
    const newTracks = tracksRef.current.map(track => {
      if (!track.loaded || !track.audioBuffer) return track;
      
      if (track.sourceNode) {
        try { track.sourceNode.stop(); } catch {}
      }

      const sourceNode = createAndStartSource(track, offset, ctx);
      return { ...track, sourceNode };
    });
    
    setTracks(newTracks);
    tracksRef.current = newTracks;
  }, [createAndStartSource]);

  /** 动画帧循环更新时间 */
  const startTimeUpdateLoop = useCallback(() => {
    const updateTime = () => {
      if (audioContextRef.current && isPlayingRef.current) {
        const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
        const newTime = currentTimeRef.current + elapsed;
        setCurrentTime(newTime);
        currentTimeRef.current = newTime;
        startTimeRef.current = audioContextRef.current.currentTime;
        
        // 检查是否播放结束（超过时长则停止）
        if (newTime >= durationRef.current && durationRef.current > 0) {
          stopAllSources();
          setIsPlaying(false);
          isPlayingRef.current = false;
          setCurrentTime(0);
          currentTimeRef.current = 0;
          return;
        }
        
        animationFrameRef.current = requestAnimationFrame(updateTime);
      }
    };
    startTimeRef.current = audioContextRef.current!.currentTime;
    animationFrameRef.current = requestAnimationFrame(updateTime);
  }, [stopAllSources]);

  /** 播放 */
  const play = useCallback(() => {
    if (tracksRef.current.length === 0 || isPlayingRef.current) return;
    
    const ctx = initAudioContext();
    
    // 从当前时间位置开始播放
    updateAllSources(currentTimeRef.current, ctx);
    
    isPlayingRef.current = true;
    setIsPlaying(true);
    
    startTimeUpdateLoop();
  }, [initAudioContext, updateAllSources, startTimeUpdateLoop]);

  /** 暂停 */
  const pause = useCallback(() => {
    if (!isPlayingRef.current) return;

    stopAllSources();

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    isPlayingRef.current = false;
    setIsPlaying(false);
  }, [stopAllSources]);

  /** 停止（重置到开始） */
  const stop = useCallback(() => {
    // 无论是否正在播放，都停止并重置
    stopAllSources();

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    isPlayingRef.current = false;
    setIsPlaying(false);
    
    currentTimeRef.current = 0;
    setCurrentTime(0);
  }, [stopAllSources]);

  /** 跳转到指定时间 */
  const seek = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(time, durationRef.current));
    const wasPlaying = isPlayingRef.current;
    
    // 先停止当前播放
    stopAllSources();
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // 更新时间
    currentTimeRef.current = clampedTime;
    setCurrentTime(clampedTime);
    
    // 如果之前正在播放，从新位置继续播放
    if (wasPlaying) {
      const ctx = audioContextRef.current || initAudioContext();
      updateAllSources(clampedTime, ctx);
      startTimeUpdateLoop();
    }
  }, [stopAllSources, initAudioContext, updateAllSources, startTimeUpdateLoop]);

  /** 设置音轨静音状态 */
  const setTrackMute = useCallback((trackIndex: number, muted: boolean) => {
    setTracks(prev => {
      const newTracks = [...prev];
      const track = newTracks[trackIndex];
      if (track.gainNode) {
        track.gainNode.gain.value = muted ? 0 : track.volume;
      }
      newTracks[trackIndex] = { ...track, muted };
      tracksRef.current = newTracks;
      return newTracks;
    });
  }, []);

  /** 设置音轨音量 */
  const setTrackVolume = useCallback((trackIndex: number, volume: number) => {
    setTracks(prev => {
      const newTracks = [...prev];
      const track = newTracks[trackIndex];
      if (track.gainNode && !track.muted) {
        track.gainNode.gain.value = volume;
      }
      newTracks[trackIndex] = { ...track, volume };
      tracksRef.current = newTracks;
      return newTracks;
    });
  }, []);

  /** 设置主音量 */
  const handleSetMasterVolume = useCallback((volume: number) => {
    setMasterVolume(volume);
    masterVolumeRef.current = volume;
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = volume;
    }
  }, []);

  /** Solo 指定音轨 */
  const soloTrack = useCallback((trackIndex: number) => {
    setTracks(prev => {
      const newTracks = prev.map((track, index) => {
        const shouldBeMuted = index !== trackIndex;
        if (track.gainNode) {
          track.gainNode.gain.value = shouldBeMuted ? 0 : track.volume;
        }
        return { ...track, muted: shouldBeMuted };
      });
      tracksRef.current = newTracks;
      return newTracks;
    });
  }, []);

  /** 取消所有 Solo */
  const unsoloAll = useCallback(() => {
    setTracks(prev => {
      const newTracks = prev.map(track => {
        if (track.gainNode) {
          track.gainNode.gain.value = track.volume;
        }
        return { ...track, muted: false };
      });
      tracksRef.current = newTracks;
      return newTracks;
    });
  }, []);

  /** 组件卸载时清理 */
  useEffect(() => {
    return () => {
      tracksRef.current.forEach(track => {
        if (track.sourceNode) {
          try { track.sourceNode.stop(); } catch {}
        }
      });
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const mixerState: MixerState = {
    tracks,
    isPlaying,
    currentTime,
    duration,
    masterVolume,
  };

  return {
    mixerState,
    play,
    pause,
    stop,
    seek,
    setTrackMute,
    setTrackVolume,
    setMasterVolume: handleSetMasterVolume,
    soloTrack,
    unsoloAll,
    loadTracks,
  };
}