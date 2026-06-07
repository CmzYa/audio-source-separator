"""设备检测模块 - 检测 CUDA、PyTorch 和 CPU 模式"""
import sys

def get_device_info() -> dict:
    """
    获取设备信息
    
    Returns:
        dict: 包含设备类型、名称、版本等信息
    """
    result = {
        "device": "cpu",
        "name": "CPU",
        "cuda_available": False,
        "cuda_version": None,
        "pytorch_version": None,
        "pytorch_installed": True,  # 内置 PyTorch，始终为 True
        "gpu_count": 0,
        "mode": "cpu",  # 实际运行模式
        "builtin_pytorch": True,  # 标记内置 PyTorch
    }
    
    # 检测 PyTorch（内置）
    try:
        import torch
        result["pytorch_version"] = torch.__version__
        
        # 检测 CUDA
        if torch.cuda.is_available():
            result["device"] = "cuda"
            result["cuda_available"] = True
            result["cuda_version"] = torch.version.cuda
            result["gpu_count"] = torch.cuda.device_count()
            result["name"] = torch.cuda.get_device_name(0)
            result["mode"] = "cuda"
        else:
            result["name"] = "CPU (CUDA not available)"
            result["mode"] = "cpu"
            
    except ImportError:
        # 内置版本不应该出现这种情况
        result["name"] = "PyTorch not loaded"
        result["pytorch_installed"] = False
    
    return result


def check_environment() -> dict:
    """
    检查环境状态，用于启动时检测
    
    Returns:
        dict: 包含警告信息和状态
    """
    info = get_device_info()
    
    warnings = []
    
    # CUDA 未检测到时提示（但不阻止运行）
    if info["pytorch_installed"] and not info["cuda_available"]:
        warnings.append({
            "type": "cuda_missing",
            "message": "CUDA 驱动未检测到，将使用 CPU 模式运行",
            "solution": "安装 CUDA 驱动可获得 GPU 加速，显著提升处理速度",
            "link": "https://developer.nvidia.com/cuda-downloads",
            "severity": "info",  # 仅提示，不阻止运行
        })
    
    return {
        "device_info": info,
        "warnings": warnings,
        "ready": True,  # 内置 PyTorch，始终可用
    }