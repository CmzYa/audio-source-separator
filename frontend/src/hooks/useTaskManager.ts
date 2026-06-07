import { useState, useCallback, useEffect } from 'react';

/** 任务状态 */
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

/** 缓存任务 */
export interface CachedTask {
  id: string;
  fileName: string;
  model: string;
  status: TaskStatus;
  progress: number;
  createdAt: number;
  stems?: Array<{
    name: string;
    displayName: string;
    color: string;
    downloadUrl: string;
  }>;
}

/** 任务管理配置 */
export interface TaskManagerConfig {
  maxTasks: number;  // 最大缓存任务数
}

/** 任务管理器 Hook */
export function useTaskManager(config: TaskManagerConfig = { maxTasks: 5 }) {
  const [tasks, setTasks] = useState<CachedTask[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  /** 从 localStorage 加载任务 */
  useEffect(() => {
    const saved = localStorage.getItem('cached_tasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as CachedTask[];
        // 只保留未过期且在限制内的任务
        const validTasks = parsed
          .filter(t => t.status !== 'pending')
          .slice(0, config.maxTasks);
        setTasks(validTasks);
      } catch {
        setTasks([]);
      }
    }
  }, [config.maxTasks]);

  /** 保存任务到 localStorage */
  useEffect(() => {
    localStorage.setItem('cached_tasks', JSON.stringify(tasks));
  }, [tasks]);

  /** 添加新任务 */
  const addTask = useCallback((task: CachedTask) => {
    setTasks(prev => {
      const newTasks = [task, ...prev];
      // 超过限制时移除最旧的任务
      if (newTasks.length > config.maxTasks) {
        return newTasks.slice(0, config.maxTasks);
      }
      return newTasks;
    });
    setActiveTaskId(task.id);
  }, [config.maxTasks]);

  /** 更新任务状态 */
  const updateTask = useCallback((id: string, updates: Partial<CachedTask>) => {
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, ...updates } : t
    ));
  }, []);

  /** 删除任务 */
  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (activeTaskId === id) {
      setActiveTaskId(null);
    }
  }, [activeTaskId]);

  /** 选择任务 */
  const selectTask = useCallback((id: string) => {
    setActiveTaskId(id);
  }, []);

  /** 获取当前活动任务 */
  const activeTask = tasks.find(t => t.id === activeTaskId);

  /** 清除所有任务 */
  const clearAllTasks = useCallback(() => {
    setTasks([]);
    setActiveTaskId(null);
    localStorage.removeItem('cached_tasks');
  }, []);

  return {
    tasks,
    activeTask,
    activeTaskId,
    addTask,
    updateTask,
    deleteTask,
    selectTask,
    clearAllTasks,
  };
}