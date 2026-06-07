"""
FastAPI 主入口
音频源分离后端服务，提供文件上传、异步分离、进度查询、文件下载和 WebSocket 实时推送
"""

import asyncio
import logging
import os
import threading
import uuid
from pathlib import Path
from typing import Dict, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

import config
from separator import AudioSeparator
from device_info import get_device_info, check_environment

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# 创建 FastAPI 应用
app = FastAPI(title="Audio Source Separator", version="1.0.0")

# CORS 中间件，允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 任务状态存储 {task_id: task_info}
tasks: Dict[str, dict] = {}

# WebSocket 连接管理 {task_id: WebSocket}
ws_connections: Dict[str, WebSocket] = {}

# 音轨显示名称映射 (htdemucs_6s: 6轨, 其他: 4轨)
STEM_DISPLAY_NAMES = {
    "vocals": "Vocals",
    "drums": "Drums",
    "bass": "Bass",
    "piano": "Piano",
    "guitar": "Guitar",
    "other": "Other",
}

# 音轨颜色映射
STEM_COLORS = {
    "vocals": "#8B5CF6",
    "drums": "#EF4444",
    "bass": "#3B82F6",
    "piano": "#10B981",
    "guitar": "#F97316",
    "other": "#F59E0B",
}


def validate_audio_file(filename: str) -> bool:
    """检查文件扩展名是否为允许的音频格式"""
    ext = Path(filename).suffix.lower()
    return ext in config.ALLOWED_EXTENSIONS


async def notify_progress(task_id: str, progress: float, status: str, message: str = ""):
    """
    通过 WebSocket 推送进度更新

    Args:
        task_id: 任务ID
        progress: 进度百分比 (0-100)
        status: 任务状态
        message: 附加消息
    """
    ws = ws_connections.get(task_id)
    if ws:
        try:
            await ws.send_json({
                "type": "progress",
                "taskId": task_id,
                "progress": progress,
                "status": status,
                "message": message,
            })
        except Exception:
            logger.warning("WebSocket 推送失败: task_id=%s", task_id)


async def notify_completed(task_id: str, stems_info: list):
    """通过 WebSocket 推送完成状态和音轨信息"""
    ws = ws_connections.get(task_id)
    if ws:
        try:
            await ws.send_json({
                "type": "status",
                "taskId": task_id,
                "status": "completed",
                "progress": 100,
                "message": "分离完成",
                "stems": stems_info,
            })
        except Exception:
            logger.warning("WebSocket 推送完成消息失败: task_id=%s", task_id)


async def notify_error(task_id: str, error_msg: str):
    """通过 WebSocket 推送错误状态"""
    ws = ws_connections.get(task_id)
    if ws:
        try:
            await ws.send_json({
                "type": "error",
                "taskId": task_id,
                "status": "failed",
                "message": error_msg,
            })
        except Exception:
            logger.warning("WebSocket 推送错误消息失败: task_id=%s", task_id)


def run_separation(task_id: str, input_path: str, output_dir: str, model_name: str, loop: asyncio.AbstractEventLoop):
    """
    在后台线程中执行音频分离

    Args:
        task_id: 任务ID
        input_path: 输入文件路径
        output_dir: 输出目录
        model_name: 模型名称
        loop: 主事件循环引用，用于跨线程调用异步函数
    """
    try:
        # 更新状态为处理中
        tasks[task_id]["status"] = "processing"
        tasks[task_id]["progress"] = 5
        asyncio.run_coroutine_threadsafe(
            notify_progress(task_id, 5, "processing", "正在加载模型..."),
            loop,
        )

        # 创建分离器实例
        separator = AudioSeparator(model_name=model_name)

        # 推送进度：模型已加载
        tasks[task_id]["progress"] = 15
        asyncio.run_coroutine_threadsafe(
            notify_progress(task_id, 15, "processing", "模型已加载，开始分离..."),
            loop,
        )

        # 执行分离
        result_paths = separator.separate(input_path, output_dir)

        # 推送进度：分离完成，正在保存
        tasks[task_id]["progress"] = 90
        asyncio.run_coroutine_threadsafe(
            notify_progress(task_id, 90, "processing", "正在保存音轨文件..."),
            loop,
        )

        # 构建音轨信息列表
        stems_info = []
        for stem_name, file_path in result_paths.items():
            stems_info.append({
                "name": stem_name,
                "displayName": STEM_DISPLAY_NAMES.get(stem_name, stem_name),
                "downloadUrl": f"/api/download/{task_id}/{stem_name}",
                "color": STEM_COLORS.get(stem_name, "#9CA3AF"),
            })

        # 更新状态为完成
        tasks[task_id]["status"] = "completed"
        tasks[task_id]["progress"] = 100
        tasks[task_id]["result"] = result_paths
        tasks[task_id]["stems_info"] = stems_info

        # 推送完成消息
        asyncio.run_coroutine_threadsafe(
            notify_completed(task_id, stems_info),
            loop,
        )
        logger.info("任务完成: task_id=%s", task_id)

    except Exception as e:
        logger.error("分离失败: task_id=%s, error=%s", task_id, str(e), exc_info=True)
        tasks[task_id]["status"] = "failed"
        tasks[task_id]["error"] = str(e)
        asyncio.run_coroutine_threadsafe(
            notify_error(task_id, f"分离失败: {str(e)}"),
            loop,
        )


@app.post("/api/separate")
async def separate_audio(
    file: UploadFile = File(...),
    model: str = Form("htdemucs"),
):
    """
    上传音频文件并启动异步分离任务

    Args:
        file: 上传的音频文件
        model: 使用的模型名称

    Returns:
        包含 task_id 的响应，用于后续查询进度和下载
    """
    # 校验文件扩展名
    if not validate_audio_file(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件格式，允许的格式: {', '.join(sorted(config.ALLOWED_EXTENSIONS))}",
        )

    # 读取文件内容并校验大小
    content = await file.read()
    if len(content) > config.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"文件大小超过限制 (最大 {config.MAX_FILE_SIZE // (1024*1024)}MB)",
        )

    # 校验模型名称
    available_models = AudioSeparator.get_available_models()
    if model not in available_models:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的模型: {model}，可用模型: {', '.join(available_models)}",
        )

    # 生成唯一任务ID
    task_id = str(uuid.uuid4())

    # 保存上传文件
    upload_dir = Path(config.UPLOAD_DIR)
    upload_dir.mkdir(exist_ok=True)
    input_path = upload_dir / f"{task_id}_{file.filename}"
    with open(input_path, "wb") as f:
        f.write(content)

    # 创建输出目录
    output_dir = Path(config.OUTPUT_DIR) / task_id
    output_dir.mkdir(parents=True, exist_ok=True)

    # 初始化任务状态
    tasks[task_id] = {
        "status": "pending",
        "progress": 0,
        "filename": file.filename,
        "model": model,
        "input_path": str(input_path),
        "output_dir": str(output_dir),
        "result": {},
        "stems_info": [],
        "error": None,
    }

    # 在后台线程中启动分离任务
    loop = asyncio.get_event_loop()
    thread = threading.Thread(
        target=run_separation,
        args=(task_id, str(input_path), str(output_dir), model, loop),
        daemon=True,
    )
    thread.start()

    logger.info("创建分离任务: task_id=%s, file=%s, model=%s", task_id, file.filename, model)
    return {"task_id": task_id, "status": "pending", "message": "分离任务已创建"}


@app.get("/api/status/{task_id}")
async def get_status(task_id: str):
    """
    查询分离任务的状态和进度

    Args:
        task_id: 任务ID

    Returns:
        任务状态信息
    """
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="任务不存在")

    task = tasks[task_id]
    response = {
        "task_id": task_id,
        "status": task["status"],
        "progress": task["progress"],
        "filename": task["filename"],
    }

    if task["status"] == "completed":
        response["stems"] = task.get("stems_info", [])
    elif task["status"] == "failed":
        response["error"] = task["error"]

    return response


@app.get("/api/download/{task_id}/{stem}")
async def download_stem(task_id: str, stem: str):
    """
    下载分离后的音轨文件

    Args:
        task_id: 任务ID
        stem: 音轨名称 (vocals/drums/bass/piano/other)

    Returns:
        音轨文件响应
    """
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="任务不存在")

    task = tasks[task_id]
    if task["status"] != "completed":
        raise HTTPException(status_code=400, detail="任务尚未完成")

    if stem not in task["result"]:
        raise HTTPException(status_code=404, detail=f"音轨不存在: {stem}")

    file_path = task["result"][stem]
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="文件不存在")

    filename = f"{stem}.wav"
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="audio/wav",
    )


@app.websocket("/ws/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    """
    WebSocket 端点，实时推送分离进度

    Args:
        websocket: WebSocket 连接
        task_id: 任务ID
    """
    await websocket.accept()
    ws_connections[task_id] = websocket

    try:
        # 如果任务已有状态，立即发送当前进度
        if task_id in tasks:
            task = tasks[task_id]
            if task["status"] == "completed":
                await websocket.send_json({
                    "type": "status",
                    "taskId": task_id,
                    "status": "completed",
                    "progress": 100,
                    "message": "分离完成",
                    "stems": task.get("stems_info", []),
                })
            else:
                await websocket.send_json({
                    "type": "progress",
                    "taskId": task_id,
                    "progress": task["progress"],
                    "status": task["status"],
                    "message": "已连接",
                })

        # 保持连接，等待客户端断开
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        logger.info("WebSocket 断开: task_id=%s", task_id)
    finally:
        ws_connections.pop(task_id, None)


@app.get("/api/models")
async def get_models():
    """获取可用的分离模型列表"""
    return {"models": AudioSeparator.get_available_models(), "current": config.MODEL_NAME}


@app.get("/api/device")
async def get_device():
    """获取设备信息（CUDA/CPU）"""
    return get_device_info()


@app.get("/api/environment")
async def get_environment():
    """获取环境检测结果，用于启动时检测"""
    return check_environment()


@app.on_event("startup")
async def startup_event():
    """应用启动时初始化目录"""
    os.makedirs(config.UPLOAD_DIR, exist_ok=True)
    os.makedirs(config.OUTPUT_DIR, exist_ok=True)
    logger.info("服务启动: host=%s, port=%s, model=%s", config.HOST, config.PORT, config.MODEL_NAME)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=config.HOST,
        port=config.PORT,
        reload=True,
    )
