"""
应用配置模块
定义上传目录、输出目录、文件限制、模型名称等常量
"""

import os

# 上传文件存储目录
UPLOAD_DIR = "uploads"

# 分离结果输出目录
OUTPUT_DIR = "output"

# 最大文件大小限制 (100MB)
MAX_FILE_SIZE = 100 * 1024 * 1024

# 允许的音频文件扩展名
ALLOWED_EXTENSIONS = {".mp3", ".wav", ".flac", ".ogg", ".wma", ".aac"}

# 默认分离模型名称 (htdemucs 为5轨模型: vocals/drums/bass/piano/other)
MODEL_NAME = "htdemucs"

# 服务监听地址
HOST = "0.0.0.0"

# 服务监听端口
PORT = 8000

# 确保必要目录存在
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
