import { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import NewTaskView from './components/NewTaskView';
import TaskDetailView from './components/TaskDetailView';
import WelcomeView from './components/WelcomeView';
import SettingsPanel from './components/SettingsPanel';
import EnvironmentModal from './components/EnvironmentModal';
import { useTaskManager, type CachedTask } from './hooks/useTaskManager';
import { useTheme } from './hooks/useTheme';
import type { ModelType } from './types';

/** 视图状态 */
type ViewState = 'welcome' | 'new' | 'task';

/** 主应用组件 */
export default function App() {
  // 主题
  const { themeMode, toggleTheme } = useTheme();

  // 设置
  const [maxTasks, setMaxTasks] = useState(() => {
    const saved = localStorage.getItem('max_tasks');
    return saved ? Number(saved) : 5;
  });
  const [showSettings, setShowSettings] = useState(false);

  // 启动检测模态框
  const [showEnvModal, setShowEnvModal] = useState(true);

  // 任务管理
  const {
    tasks,
    activeTask,
    activeTaskId,
    addTask,
    updateTask,
    deleteTask,
    selectTask,
  } = useTaskManager({ maxTasks });

  // 视图状态
  const [viewState, setViewState] = useState<ViewState>('welcome');

  // 保存设置
  useEffect(() => {
    localStorage.setItem('max_tasks', String(maxTasks));
  }, [maxTasks]);

  // 当选择任务时切换视图
  useEffect(() => {
    if (activeTaskId) {
      setViewState('task');
    }
  }, [activeTaskId]);

  /** 新建任务 */
  const handleNewTask = useCallback(() => {
    setViewState('new');
  }, []);

  /** 提交任务 */
  const handleSubmitTask = useCallback(async (file: File, model: ModelType) => {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTask: CachedTask = {
      id: taskId,
      fileName: file.name,
      model: model,
      status: 'pending',
      progress: 0,
      createdAt: Date.now(),
    };

    addTask(newTask);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', model);

    try {
      const response = await fetch('/api/separate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail ?? `Request failed: ${response.status}`);
      }

      const data = await response.json();
      updateTask(taskId, { id: data.task_id, status: 'processing' });
      setViewState('task');
    } catch (err) {
      updateTask(taskId, { status: 'failed', progress: 0 });
      throw err;
    }
  }, [addTask, updateTask]);

  /** 选择任务 */
  const handleSelectTask = useCallback((id: string) => {
    selectTask(id);
    setViewState('task');
  }, [selectTask]);

  /** 删除任务 */
  const handleDeleteTask = useCallback((id: string) => {
    deleteTask(id);
    if (activeTaskId === id) {
      setViewState('welcome');
    }
  }, [deleteTask, activeTaskId]);

  /** 更新最大任务数 */
  const handleMaxTasksChange = useCallback((value: number) => {
    setMaxTasks(value);
  }, []);

  /** 关闭环境检测模态框 */
  const handleEnvModalClose = useCallback(() => {
    setShowEnvModal(false);
  }, []);

  // 渲染主内容
  const renderContent = () => {
    switch (viewState) {
      case 'new':
        return (
          <NewTaskView
            onSubmit={handleSubmitTask}
            onCancel={() => setViewState('welcome')}
          />
        );
      case 'task':
        if (activeTask) {
          return (
            <TaskDetailView
              key={activeTaskId}
              task={activeTask}
              onTaskUpdate={updateTask}
              onBack={() => setViewState('welcome')}
            />
          );
        }
        return <WelcomeView onNewTask={handleNewTask} />;
      default:
        return <WelcomeView onNewTask={handleNewTask} />;
    }
  };

  return (
    <div className="h-screen flex bg-[var(--bg-primary)]">
      {/* 侧栏 */}
      <Sidebar
        tasks={tasks}
        activeTaskId={activeTaskId}
        onNewTask={handleNewTask}
        onSelectTask={handleSelectTask}
        onDeleteTask={handleDeleteTask}
        onOpenSettings={() => setShowSettings(true)}
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
      />

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {renderContent()}
      </main>

      {/* 启动检测模态框 */}
      {showEnvModal && (
        <EnvironmentModal onClose={handleEnvModalClose} />
      )}

      {/* 设置面板 */}
      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          maxTasks={maxTasks}
          onMaxTasksChange={handleMaxTasksChange}
        />
      )}
    </div>
  );
}