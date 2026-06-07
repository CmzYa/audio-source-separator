import { useCallback, useEffect, useRef, useState, useMemo } from 'react';

interface WaveformDisplayProps {
  audioBuffer: AudioBuffer | null;
  color: string;
  progress: number;  // 0-1 当前播放进度
  height?: number;
  onSeek?: (progress: number) => void;
}

/**
 * 音频频谱可视化组件
 * 使用 Canvas 绘制简化波形，支持点击/拖拽交互
 */
export default function WaveformDisplay({
  audioBuffer,
  color,
  progress,
  height = 50,
  onSeek,
}: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // 预计算波形数据（低精度采样）
  const waveformData = useMemo(() => {
    if (!audioBuffer) return null;
    
    const leftChannel = audioBuffer.getChannelData(0);
    const rightChannel = audioBuffer.numberOfChannels > 1 
      ? audioBuffer.getChannelData(1) 
      : leftChannel;
    
    // 固定采样点数量
    const barCount = 200;
    const samplesPerBar = Math.floor(leftChannel.length / barCount);
    const step = Math.max(1, Math.floor(samplesPerBar / 10));
    
    const data: number[] = [];
    for (let i = 0; i < barCount; i++) {
      const start = i * samplesPerBar;
      let max = 0;
      
      for (let j = 0; j < samplesPerBar; j += step) {
        const idx = start + j;
        if (idx < leftChannel.length) {
          const val = Math.abs((leftChannel[idx] + rightChannel[idx]) / 2);
          max = Math.max(max, val);
        }
      }
      data.push(max);
    }
    
    return data;
  }, [audioBuffer]);

  /** 绘制波形 */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.offsetWidth;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    const barCount = waveformData.length;
    const barWidth = width / barCount;
    const progressIndex = Math.floor(progress * barCount);

    // 绘制波形条形
    for (let i = 0; i < barCount; i++) {
      const amplitude = waveformData[i];
      const barHeight = amplitude * height * 0.85;
      const x = i * barWidth;
      const y = (height - barHeight) / 2;

      // 已播放部分用更亮的颜色
      if (i < progressIndex) {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.7;
      } else {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.25;
      }
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    }
    
    ctx.globalAlpha = 1;

    // 绘制进度指示线
    if (progress > 0) {
      const lineX = progress * width;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lineX, 0);
      ctx.lineTo(lineX, height);
      ctx.stroke();
    }

  }, [waveformData, color, progress, height]);

  /** 处理点击/拖拽 */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current || !onSeek) return;
    setIsDragging(true);
    
    const rect = canvasRef.current.getBoundingClientRect();
    const p = (e.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(1, p)));
  }, [onSeek]);

  /** 拖拽时更新 */
  useEffect(() => {
    if (!isDragging || !canvasRef.current || !onSeek) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(p);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onSeek]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full rounded waveform-container ${onSeek ? 'cursor-pointer' : ''}`}
      style={{ height: `${height}px` }}
      onMouseDown={handleMouseDown}
    />
  );
}