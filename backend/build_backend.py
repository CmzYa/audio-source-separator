"""
Python 后端打包脚本
使用 PyInstaller 将后端打包为独立可执行文件
内置 CPU 版 PyTorch，运行时自动检测 CUDA 并切换到 GPU 模式
"""
import os
import sys
import shutil
import subprocess
import argparse

# 项目根目录
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "frontend", "src-tauri", "binaries")


def clean_build_files():
    """清理构建临时文件"""
    dirs_to_clean = [
        os.path.join(BACKEND_DIR, "build_temp"),
        os.path.join(BACKEND_DIR, "__pycache__"),
        os.path.join(BACKEND_DIR, "dist"),
        os.path.join(BACKEND_DIR, "build"),
    ]

    for dir_path in dirs_to_clean:
        if os.path.exists(dir_path):
            print(f"清理: {dir_path}")
            shutil.rmtree(dir_path, ignore_errors=True)

    # 清理 spec 文件
    spec_file = os.path.join(BACKEND_DIR, "audio-separator-backend.spec")
    if os.path.exists(spec_file):
        os.remove(spec_file)
        print(f"清理: {spec_file}")


def build_backend(clean: bool = True, onefile: bool = True):
    """
    打包后端

    Args:
        clean: 是否清理临时文件
        onefile: 是否打包为单文件
    """
    print("=" * 60)
    print("  Audio Separator Backend Builder")
    print("  Built-in: PyTorch CPU Edition")
    print("  Runtime: Auto-detect CUDA for GPU acceleration")
    print("=" * 60)

    # 确保输出目录存在
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # PyInstaller 命令
    cmd = [
        sys.executable, "-m", "PyInstaller",
    ]

    if onefile:
        cmd.append("--onefile")  # 单文件打包
    else:
        cmd.extend(["--onedir", "--name", "audio-separator-backend"])

    cmd.extend([
        "--name", "audio-separator-backend",
        "--distpath", OUTPUT_DIR,
        "--workpath", os.path.join(BACKEND_DIR, "build_temp"),
        "--specpath", os.path.join(BACKEND_DIR, "build_temp"),

        # 隐藏控制台窗口 (Windows GUI)
        # "--noconsole",  # 如果需要调试可以注释掉

        # ========== PyTorch 核心模块 ==========
        "--hidden-import", "torch",
        "--hidden-import", "torch.nn",
        "--hidden-import", "torch.optim",
        "--hidden-import", "torch.cuda",
        "--hidden-import", "torch.backends",
        "--hidden-import", "torch.backends.cudnn",
        "--hidden-import", "torch._C",
        "--collect-data", "torch",
        "--collect-bin", "torch",

        # ========== Demucs 模块 ==========
        "--hidden-import", "demucs",
        "--hidden-import", "demucs.pretrained",
        "--hidden-import", "demucs.apply",
        "--hidden-import", "demucs.hdemucs",
        "--hidden-import", "demucs.htdemucs",
        "--hidden-import", "demucs.repo",
        "--hidden-import", "demucs.utils",
        "--collect-data", "demucs",

        # ========== 音频处理模块 ==========
        "--hidden-import", "torchaudio",
        "--hidden-import", "torchaudio.transforms",
        "--collect-data", "torchaudio",

        # ========== Web 服务模块 ==========
        "--hidden-import", "uvicorn.logging",
        "--hidden-import", "uvicorn.loops",
        "--hidden-import", "uvicorn.loops.auto",
        "--hidden-import", "uvicorn.protocols",
        "--hidden-import", "uvicorn.protocols.http",
        "--hidden-import", "uvicorn.protocols.http.auto",
        "--hidden-import", "uvicorn.protocols.websockets",
        "--hidden-import", "uvicorn.protocols.websockets.auto",
        "--hidden-import", "uvicorn.lifespan",
        "--hidden-import", "uvicorn.lifespan.on",
        "--hidden-import", "fastapi",
        "--hidden-import", "starlette",
        "--hidden-import", "starlette.responses",
        "--hidden-import", "starlette.routing",
        "--hidden-import", "starlette.middleware",
        "--hidden-import", "starlette.middleware.cors",
        "--hidden-import", "starlette.websockets",

        # ========== 其他依赖 ==========
        "--hidden-import", "soundfile",
        "--hidden-import", "numpy",
        "--hidden-import", "aiofiles",

        # ========== 排除不必要的模块以减小体积 ==========
        "--exclude-module", "matplotlib",
        "--exclude-module", "matplotlib.pyplot",
        "--exclude-module", "PIL",
        "--exclude-module", "pillow",
        "--exclude-module", "tkinter",
        "--exclude-module", "unittest",
        "--exclude-module", "test",
        "--exclude-module", "tests",
        "--exclude-module", "pytest",
        "--exclude-module", "IPython",
        "--exclude-module", "jupyter",
        "--exclude-module", "notebook",
        "--exclude-module", "sphinx",
        "--exclude-module", "docutils",
        "--exclude-module", "pydoc_data",
        "--exclude-module", "email",
        "--exclude-module", "html",
        "--exclude-module", "http.cookiejar",
        "--exclude-module", "xml",
        "--exclude-module", "xmlrpc",
        "--exclude-module", "curses",
        "--exclude-module", "pygments",
        "--exclude-module", "setuptools",
        "--exclude-module", "pip",
        "--exclude-module", "wheel",
        "--exclude-module", "pkg_resources",

        # 排除 PyTorch CUDA 相关的大文件 (我们用 CPU 版)
        # 但保留 CUDA 检测能力
        "--exclude-module", "torch.distributed",
        "--exclude-module", "torch.distributions",

        # 主入口文件
        os.path.join(BACKEND_DIR, "main.py"),
    ])

    print(f"\n工作目录: {BACKEND_DIR}")
    print(f"输出目录: {OUTPUT_DIR}")
    print(f"\n开始打包...")
    print("注意: PyTorch 较大，打包可能需要几分钟时间\n")

    result = subprocess.run(cmd, cwd=BACKEND_DIR)

    if result.returncode == 0:
        print("\n" + "=" * 60)
        print("  打包成功!")
        print("=" * 60)

        if onefile:
            exe_path = os.path.join(OUTPUT_DIR, "audio-separator-backend.exe")
        else:
            exe_path = os.path.join(OUTPUT_DIR, "audio-separator-backend", "audio-separator-backend.exe")

        if os.path.exists(exe_path):
            size_mb = os.path.getsize(exe_path) / (1024 * 1024)
            print(f"\n输出文件: {exe_path}")
            print(f"文件大小: {size_mb:.2f} MB")

        print("\n功能特性:")
        print("  - 内置 PyTorch CPU 版本，无需额外安装")
        print("  - 启动时自动检测 CUDA 驱动")
        print("  - 有 CUDA 则使用 GPU 加速，无则使用 CPU 模式")
        print("  - 包含完整的音频分离功能")

        if clean:
            print("\n清理临时文件...")
            clean_build_files()

        return True
    else:
        print("\n" + "=" * 60)
        print("  打包失败!")
        print("=" * 60)
        return False


def main():
    parser = argparse.ArgumentParser(description="打包 Audio Separator 后端")
    parser.add_argument("--no-clean", action="store_true", help="不清理临时文件")
    parser.add_argument("--onedir", action="store_true", help="打包为目录而非单文件 (启动更快，体积更大)")
    args = parser.parse_args()

    # 检查 PyInstaller
    try:
        import PyInstaller
        print(f"PyInstaller 版本: {PyInstaller.__version__}")
    except ImportError:
        print("PyInstaller 未安装，正在安装...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-i",
                       "https://pypi.tuna.tsinghua.edu.cn/simple", "pyinstaller"])

    success = build_backend(
        clean=not args.no_clean,
        onefile=not args.onedir
    )

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()