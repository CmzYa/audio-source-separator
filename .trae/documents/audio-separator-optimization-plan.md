# 音频分离器优化与打包计划

## 用户确认方案
- **打包方案**: Tauri（轻量、安全、打包体积小）
- **后端处理**: 打包进应用（一键运行整个应用）
- **前端样式**: 完全重置，符合设计标准，毛玻璃等现代样式

---

## 第一部分：前端样式重置

### 设计理念
- **视觉主题**: 深色沉浸式界面，专业音频工作站风格
- **核心元素**: 毛玻璃效果、微妙渐变、精致阴影
- **配色**: 深灰基底 + 紫/蓝渐变高亮
- **字体**: 系统字体栈，清晰易读

### 1.1 全局样式重置
**文件**: `frontend/src/index.css`

**修改内容**:
```css
@import "tailwindcss";

/* 全局变量 */
:root {
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --bg-glass: rgba(18, 18, 26, 0.7);
  --border-glass: rgba(255, 255, 255, 0.08);
  --accent-primary: #8b5cf6;
  --accent-secondary: #6366f1;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
}

/* 深色沉浸背景 */
body {
  background: var(--bg-primary);
  background-image: 
    radial-gradient(ellipse at top, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at bottom, rgba(99, 102, 241, 0.05) 0%, transparent 50%);
  min-height: 100vh;
}

/* 毛玻璃基础类 */
.glass {
  background: var(--bg-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-glass);
}

/* 悬浮卡片 */
.glass-card {
  background: rgba(18, 18, 26, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 
    0 4px 24px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

/* 按钮样式 */
.btn-primary {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  box-shadow: 0 2px 12px rgba(139, 92, 246, 0.3);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.5);
  transform: translateY(-1px);
}

/* 进度条 */
.progress-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.progress-fill {
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.4);
}

/* 音轨行 */
.track-row {
  background: rgba(18, 18, 26, 0.5);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.04);
  transition: all 0.15s ease;
}

.track-row:hover {
  background: rgba(18, 18, 26, 0.7);
  border-color: rgba(255, 255, 255, 0.08);
}
```

### 1.2 App.tsx 布局重构
**文件**: `frontend/src/App.tsx`

**修改内容**:
- Header: 毛玻璃固定导航
- Main: 沉浸式内容区域
- Footer: 简洁底部
- 整体布局去除多余边框和卡片

### 1.3 AudioMixer 组件样式
**文件**: `frontend/src/components/AudioMixer.tsx`

**修改内容**:
- 毛玻璃容器
- 现代按钮样式
- 进度条渐变效果
- 悬浮阴影效果

### 1.4 TrackRow 组件样式
**文件**: `frontend/src/components/TrackRow.tsx`

**修改内容**:
- 毛玻璃行样式
- 悬浮高亮效果
- 现代控制按钮

### 1.5 其他组件样式
**文件**: 
- `frontend/src/components/FileUpload.tsx`
- `frontend/src/components/ModelSelector.tsx`
- `frontend/src/components/SeparationProgress.tsx`

**修改内容**: 统一毛玻璃风格

---

## 第二部分：进度控制优化

### 2.1 AudioMixer 进度条拖拽支持
**文件**: `frontend/src/components/AudioMixer.tsx`

**修改内容**:
- 添加拖拽状态管理 (`isDragging` state)
- 实现 `onMouseDown` 开始拖拽
- 实现 `onMouseMove` 更新位置（拖拽时监听 document）
- 实现 `onMouseUp` 结束拖拽并调用 `onSeek`

### 2.2 WaveformDisplay 频谱交互
**文件**: `frontend/src/components/WaveformDisplay.tsx`

**修改内容**:
- 添加 `onSeek?: (progress: number) => void` 回调参数
- 实现频谱点击跳转功能
- 实现频谱拖拽功能（类似进度条）

### 2.3 TrackRow 传递交互回调
**文件**: `frontend/src/components/TrackRow.tsx`

**修改内容**:
- 添加 `onSeek?: (progress: number) => void` 参数
- 传递给 WaveformDisplay

### 2.4 App.tsx 进度线交互
**文件**: `frontend/src/App.tsx`

**修改内容**:
- 添加进度线点击/拖拽交互
- 调用 `seek` 函数更新播放位置

---

## 第三部分：Tauri 桌面应用打包

### 3.1 安装 Tauri CLI
**命令**: 
```bash
cd frontend
pnpm add -D @tauri-apps/cli@latest
```

### 3.2 初始化 Tauri
**命令**: 
```bash
pnpm tauri init --ci
```

### 3.3 配置 Tauri
**新建文件**: `frontend/src-tauri/tauri.conf.json`

配置内容：
- 应用名称、版本
- 窗口尺寸、标题
- 构建配置（指向 Vite 构建输出）
- 启动 Python 后端

### 3.4 Python 后端打包配置
**新建文件**: `backend/build_backend.py`

使用 PyInstaller 打包 Python 后端为可执行文件：
- 包含所有依赖（demucs, torch, fastapi, uvicorn）
- 单文件打包
- 输出到 `src-tauri/binaries/`

### 3.5 Tauri 启动 Python 后端
**新建文件**: `frontend/src-tauri/src/main.rs`

Rust 代码逻辑：
- 启动时运行 Python 后端可执行文件
- 监听后端进程状态
- 关闭时终止后端进程

### 3.6 创建应用图标
**新建目录**: `frontend/src-tauri/icons/`

需要创建：
- `icon.ico` (Windows)
- `icon.png` (通用)

### 3.7 构建脚本
**新建文件**: `build.bat`

一键构建流程：
1. 安装 Tauri CLI
2. 打包 Python 后端（PyInstaller）
3. 构建 Tauri 应用

---

## 文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `frontend/src/index.css` | 修改 | 全局样式重置，毛玻璃效果 |
| `frontend/src/App.tsx` | 修改 | 布局重构 + 进度线交互 |
| `frontend/src/components/AudioMixer.tsx` | 修改 | 样式重置 + 拖拽支持 |
| `frontend/src/components/WaveformDisplay.tsx` | 修改 | 样式重置 + 点击/拖拽交互 |
| `frontend/src/components/TrackRow.tsx` | 修改 | 样式重置 + 传递 onSeek |
| `frontend/src/components/FileUpload.tsx` | 修改 | 样式重置 |
| `frontend/src/components/ModelSelector.tsx` | 修改 | 样式重置 |
| `frontend/src/components/SeparationProgress.tsx` | 修改 | 样式重置 |
| `frontend/package.json` | 修改 | 添加 Tauri CLI 依赖 |
| `frontend/src-tauri/tauri.conf.json` | 新建 | Tauri 配置文件 |
| `frontend/src-tauri/src/main.rs` | 新建 | Rust 入口（启动后端） |
| `frontend/src-tauri/Cargo.toml` | 新建 | Rust 依赖配置 |
| `frontend/src-tauri/build.rs` | 新建 | 构建脚本（复制后端） |
| `frontend/src-tauri/icons/icon.ico` | 新建 | 应用图标 |
| `backend/build_backend.py` | 新建 | Python 后端打包脚本 |
| `build.bat` | 新建 | 一键构建脚本 |

---

## 前置条件

用户需要安装：
1. **Rust**: https://rustup.rs
2. **Visual Studio Build Tools**: https://visualstudio.microsoft.com/visual-cpp-build-tools/
3. **PyInstaller**: `pip install pyinstaller`

---

## 验证步骤

1. 测试前端样式效果（毛玻璃、渐变、阴影）
2. 测试进度条拖拽功能
3. 测试频谱点击跳转
4. 测试频谱拖拽
5. 测试贯穿进度线交互
6. 测试 Tauri 开发模式：`pnpm tauri dev`
7. 测试 Tauri 构建：`pnpm tauri build`
8. 运行打包后的 `.exe` 文件

---

## 实施顺序

1. **前端样式重置**（优先，视觉体验）
2. **进度控制优化**（功能修复）
3. **Tauri 打包配置**（需要用户安装 Rust 等环境）

这样用户可以先看到视觉效果，验证功能，再进行打包配置。