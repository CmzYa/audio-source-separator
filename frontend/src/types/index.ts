/** 分离任务状态 */
export interface SeparationTask {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  stems?: StemInfo[];
}

/** 音轨信息 */
export interface StemInfo {
  name: string;
  displayName: string;
  downloadUrl: string;
  color: string;
}

/** 支持的模型类型 */
export type ModelType = 'htdemucs_6s' | 'htdemucs_ft';

/** 模型选项配置 */
export interface ModelOption {
  value: ModelType;
  label: string;
  description: string;
}

/** WebSocket 消息格式 */
export interface WsMessage {
  type: 'progress' | 'status' | 'error';
  taskId: string;
  progress?: number;
  status?: SeparationTask['status'];
  message?: string;
  stems?: StemInfo[];
}
