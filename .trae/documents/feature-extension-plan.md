# 音频分离器功能扩展计划

## 用户需求
1. **作者信息**: 前端显示作者信息
2. **深浅主题**: 支持深色/浅色主题切换，带兼容性模式
3. **设备检测**: 自动检测 CUDA、PyTorch 和兼容模式（CPU）
4. **独立 PyTorch**: 用户自行安装 PyTorch，只打包 Demucs + 其他依赖

---

## 第一部分：作者信息

### 修改文件
- `frontend/src/components/Sidebar.tsx` - 在侧栏底部添加作者信息
- `frontend/src/components/SettingsPanel.tsx` - 在设置面板添加作者信息

---

## 第二部分：深浅主题切换

### 设计方案
- **深色模式**: 当前已有的深色主题
- **浅色模式**: 白色/浅灰背景，深色文字
- **系统跟随**: 自动跟随系统主题偏好

### 修改文件
- `frontend/src/index.css` - 添加浅色主题 CSS 变量
- `frontend/src/hooks/useTheme.ts` - 新建主题管理 Hook
- `frontend/src/components/Sidebar.tsx` - 主题切换按钮
- `frontend/src/App.tsx` - 应用主题类

---

## 第三部分：设备检测 API

### 后端修改
- `backend/device_info.py` - 新建设备检测模块
- `backend/main.py` - 添加 `/api/device` 路由

### 前端修改
- `frontend/src/components/DeviceStatus.tsx` - 新建设备状态组件
- `frontend/src/components/Sidebar.tsx` - 显示设备状态

---

## 第四部分：独立 PyTorch 打包方案

### 方案说明
- **不打包 PyTorch**: 用户需自行安装 PyTorch
- **只打包 Demucs + FastAPI**: 体积约 50-100MB
- **启动时检测**: 检测 PyTorch 是否已安装，未安装则提示

### 4.1 PyInstaller 配置 `backend/build_backend.py`
```python
cmd = [
    sys.executable, "-m", "PyInstaller",
    "--onefile",
    "--name", "audio-separator-backend",
    
    # 排除 PyTorch（用户独立安装）
    "--exclude-module", "torch",
    "--exclude-module", "torch.cuda",
    
    # 包含 Demucs（不含模型）
    "--hidden-import", "demucs",
    "--hidden-import", "demucs.pretrained",
    "--hidden-import", "demucs.apply",
    
    # 其他依赖
    "--hidden-import", "uvicorn",
    "--hidden-import", "fastapi",
    "--hidden-import", "soundfile",
    
    os.path.join(BACKEND_DIR, "main.py"),
]
```

### 4.2 启动检测逻辑 `backend/main.py`
```python
@app.on_event("startup")
async def check_dependencies():
    """启动时检查依赖"""
    try:
        import torch
        if not torch.cuda.is_available():
            print("Warning: CUDA not available, using CPU mode")
    except ImportError:
        print("Error: PyTorch not installed!")
        print("Please install PyTorch: pip install torch")
        # 可选：自动退出或继续运行（CPU模式）
```

### 4.3 启动模态框检测提示
应用启动时检测环境，显示模态框提示：

**检测逻辑**：
1. 调用 `/api/device` 获取设备信息
2. 如果 `device === 'cpu'` 或 API 报错（PyTorch 未安装）
3. 显示模态框提醒安装 CUDA 驱动和 PyTorch

**模态框内容**：
```tsx
<Modal>
  <h2>Environment Setup Required</h2>
  
  {/* CUDA 驱动未安装 */}
  {!hasCuda && (
    <div>
      <p>CUDA driver not detected</p>
      <a href="https://developer.nvidia.com/cuda-downloads">
        Download CUDA Driver
      </a>
    </div>
  )}
  
  {/* PyTorch 未安装 */}
  {!hasPytorch && (
    <div>
      <p>PyTorch not installed</p>
      <code>pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121</code>
    </div>
  )}
  
  {/* CPU 模式提示 */}
  {hasPytorch && !hasCuda && (
    <div>
      <p>Running in CPU mode (slower)</p>
      <p>Install CUDA for better performance</p>
    </div>
  )}
  
  <button>Continue in CPU Mode</button>
</Modal>
```

**检测时机**：
- 应用启动时自动检测
- 后端 API `/api/device` 返回设备状态
- 前端根据状态显示对应提示

### 4.4 安装脚本 `install.bat`
提供一键安装 PyTorch 的脚本：
```bat
@echo off
echo Installing PyTorch with CUDA support...
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
echo Done!
pause
```

### 打包体积预估
- Demucs: ~50MB
- FastAPI + Uvicorn: ~5MB
- Soundfile: ~1MB
- 前端: ~5MB
- **总计**: ~60-100MB（不含 PyTorch）

### 用户安装流程
1. 运行 `install.bat` 安装 PyTorch（或手动安装）
2. 运行应用主程序
3. 应用自动检测 CUDA/CPU 模式

---

## 文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `frontend/src/index.css` | 修改 | 添加浅色主题样式 |
| `frontend/src/hooks/useTheme.ts` | 新建 | 主题管理 Hook |
| `frontend/src/components/Sidebar.tsx` | 修改 | 主题切换 + 作者 + 设备状态 |
| `frontend/src/components/SettingsPanel.tsx` | 修改 | 作者信息 |
| `frontend/src/App.tsx` | 修改 | 应用主题类 |
| `frontend/src/components/DeviceStatus.tsx` | 新建 | 设备状态组件 |
| `frontend/src/components/EnvironmentModal.tsx` | 新建 | 启动检测模态框 |
| `backend/device_info.py` | 新建 | 设备检测模块 |
| `backend/main.py` | 修改 | 添加设备 API + 启动检测 |
| `backend/build_backend.py` | 修改 | 排除 PyTorch 打包 |
| `install.bat` | 新建 | PyTorch 安装脚本 |

---

## 实施顺序

1. **后端设备检测** - 先实现 API
2. **前端设备状态显示** - 显示当前设备
3. **深浅主题系统** - CSS 变量 + Hook + 切换
4. **作者信息** - 添加到界面
5. **更新打包脚本** - 排除 PyTorch
6. **创建安装脚本** - 一键安装 PyTorch
7. **测试打包** - 验证打包后运行正常

---

## 待确认

1. **作者名称**: 请提供您的名字/昵称用于显示