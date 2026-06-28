# Audio Source Separator

一个音频源分离应用，使用 Tauri + React 前端框架构建的跨平台桌面应用，结合 Python/Rust 后端处理音频分离。

## 🎯 项目特性

- **跨平台支持**: 基于 Tauri 构建，支持 Windows、macOS、Linux
- **现代化 UI**: 使用 React 19 + TypeScript + Tailwind CSS 打造流畅界面
- **高性能处理**: Python/Rust 混合后端，提供强大的音频处理能力
- **易用的应用**: 直观的图形界面，轻松分离音频源

## 🛠️ 技术栈

### 前端
- **React** 19.0.0 - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 快速开发构建工具
- **Tailwind CSS** - 样式框架
- **Tauri** 2.11.2 - 跨平台桌面应用框架

### 后端
- **Python** - 音频处理逻辑
- **Rust** - 性能关键部分

### 语言分布
- TypeScript: 73.6%
- Python: 18.4%
- CSS: 4.4%
- Rust: 1.9%
- 其他: 1.7%

## 📋 前置要求

- Node.js 16+ 和 pnpm
- Python 3.8+
- Rust 工具链（用于编译）

## 🚀 快速开始

### 安装依赖

```bash
cd frontend
pnpm install
```

### 开发模式

```bash
# 启动 Tauri 开发服务器
pnpm tauri:dev
```

### 构建应用

```bash
# 构建前端
pnpm build

# 构建 Tauri 应用
pnpm tauri:build
```

## 📂 项目结构

```
audio-source-separator/
├── frontend/                 # React + Tauri 前端应用
│   ├── src/                 # 前端源代码
│   ├── src-tauri/           # Tauri 配置和 Rust 后端
│   ├── package.json
│   └── tauri.conf.json
├── binaries/                # 编译的后端二进制文件
└── 其他配置文件
```

## 🔧 可用命令

| 命令 | 描述 |
|------|------|
| `pnpm dev` | 启动 Vite 开发服务器 |
| `pnpm build` | 构建前端代码 |
| `pnpm preview` | 预览构建结果 |
| `pnpm lint` | 运行 ESLint 代码检查 |
| `pnpm tauri:dev` | 启动 Tauri 开发应用 |
| `pnpm tauri:build` | 构建 Tauri 可执行文件 |

## 📝 开发指南

### 代码质量

项目使用 ESLint 保证代码质量：

```bash
pnpm lint
```

### TypeScript 类型检查

```bash
pnpm build  # 包含 tsc -b 类型检查
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

（待添加许可证信息）

## 👨‍💻 作者

[@CmzYa](https://github.com/CmzYa)

---

**注**: 项目创建于 2026年5月，目前仍在积极开发中。
