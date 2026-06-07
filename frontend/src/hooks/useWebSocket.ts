import { useEffect, useRef, useCallback, useState } from 'react';
import type { SeparationTask, WsMessage } from '../types';

interface UseWebSocketOptions {
  /** 任务 ID，为空时不连接 */
  taskId: string | null;
  /** 连接成功回调 */
  onConnect?: () => void;
  /** 连接断开回调 */
  onDisconnect?: () => void;
}

interface UseWebSocketReturn {
  /** 当前任务状态 */
  task: SeparationTask | null;
  /** WebSocket 连接状态 */
  connected: boolean;
  /** 手动发送消息 */
  send: (data: string) => void;
}

/** WebSocket 自定义 Hook，管理连接、重连和消息解析 */
export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const { taskId, onConnect, onDisconnect } = options;
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [connected, setConnected] = useState(false);
  const [task, setTask] = useState<SeparationTask | null>(null);

  /** 解析 WebSocket 消息并更新任务状态 */
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data: WsMessage = JSON.parse(event.data);

      setTask(prev => {
        const current: SeparationTask = prev ?? {
          taskId: data.taskId,
          status: 'pending',
          progress: 0,
          message: '',
        };

        switch (data.type) {
          case 'progress':
            return {
              ...current,
              taskId: data.taskId,
              progress: data.progress ?? current.progress,
              status: 'processing',
              message: data.message ?? current.message,
            };
          case 'status':
            return {
              ...current,
              taskId: data.taskId,
              status: data.status ?? current.status,
              message: data.message ?? current.message,
              stems: data.stems ?? current.stems,
              progress: data.status === 'completed' ? 100 : current.progress,
            };
          case 'error':
            return {
              ...current,
              taskId: data.taskId,
              status: 'failed',
              message: data.message ?? 'Unknown error',
            };
          default:
            return current;
        }
      });
    } catch {
      console.error('Failed to parse WebSocket message');
    }
  }, []);

  /** 关闭当前连接 */
  const close = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, []);

  /** 建立 WebSocket 连接 */
  const connect = useCallback(() => {
    if (!taskId) return;

    close();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/${taskId}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      onConnect?.();
    };

    ws.onmessage = handleMessage;

    ws.onclose = () => {
      setConnected(false);
      onDisconnect?.();
      // 自动重连：3秒后重试
      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [taskId, close, handleMessage, onConnect, onDisconnect]);

  /** 手动发送消息 */
  const send = useCallback((data: string) => {
    wsRef.current?.send(data);
  }, []);

  // taskId 变化时重新连接
  useEffect(() => {
    if (taskId) {
      connect();
    } else {
      close();
      setTask(null);
    }

    return () => {
      close();
    };
  }, [taskId, connect, close]);

  return { task, connected, send };
}
