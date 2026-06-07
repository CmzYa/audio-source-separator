"""
Demucs 音频分离引擎封装
提供基于预训练模型的音频源分离功能
使用 demucs.pretrained + demucs.apply 底层 API
使用 soundfile 直接读取音频，绕过 ffmpeg/torchcodec 依赖
"""

import logging
from typing import Dict, List, Optional

import numpy as np
import soundfile as sf
import torch

logger = logging.getLogger(__name__)


class AudioSeparator:
    """音频源分离器，基于 Demucs 预训练模型"""

    def __init__(self, model_name: str = "htdemucs", device: Optional[str] = None):
        """
        初始化分离器

        Args:
            model_name: 模型名称，默认 htdemucs
            device: 推理设备，None 时自动检测 CUDA/CPU
        """
        self.model_name = model_name
        # 自动检测可用设备
        if device is None:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
        else:
            self.device = device
        logger.info("分离器初始化: model=%s, device=%s", self.model_name, self.device)

    def separate(self, input_path: str, output_dir: str) -> Dict[str, str]:
        """
        执行音频源分离

        Args:
            input_path: 输入音频文件路径
            output_dir: 分离结果输出目录

        Returns:
            分离后的音轨文件路径字典 {stem_name: file_path}
            htdemucs_6s: 6轨 (vocals/drums/bass/piano/guitar/other)
            其他模型: 4轨 (vocals/drums/bass/other)
        """
        from demucs.pretrained import get_model
        from demucs.apply import apply_model

        # 加载预训练模型
        model = get_model(self.model_name)
        model.to(self.device)
        model.eval()

        # 获取模型支持的音轨名称列表
        sources = model.sources
        logger.info("模型音轨: %s", sources)

        # 使用 soundfile 直接读取音频，绕过 ffmpeg/torchcodec
        audio_np, sr = sf.read(input_path)
        logger.info("音频加载成功: shape=%s, sr=%s", audio_np.shape, sr)

        # 转换为 torch tensor，形状 [channels, samples]
        # 注意：soundfile 返回 float64，需要转换为 float32
        if audio_np.ndim == 1:
            # 单声道扩展为双声道
            wav = torch.from_numpy(audio_np.astype(np.float32)).unsqueeze(0).repeat(2, 1)
        else:
            # 多声道，取前两个声道
            wav = torch.from_numpy(audio_np[:, :2].astype(np.float32).T)

        logger.info("音频tensor形状: %s", wav.shape)

        # 重采样到模型需要的采样率
        if sr != model.samplerate:
            import torchaudio.transforms as T
            resampler = T.Resample(sr, model.samplerate)
            # 确保 resampler 使用 float32
            resampler = resampler.to(wav.dtype)
            wav = resampler(wav.float())
            logger.info("重采样完成: %s -> %s", sr, model.samplerate)

        # 标准化音频
        ref = wav.mean(0)
        wav_input = (wav - ref.mean()) / ref.std()
        wav_input = wav_input.to(self.device)

        logger.info("开始分离: input=%s, output=%s", input_path, output_dir)

        # 执行分离
        with torch.no_grad():
            separated = apply_model(model, wav_input[None], progress=True)[0]

        # separated 形状: [num_sources, channels, samples]
        # 保存各音轨到输出目录
        result_paths: Dict[str, str] = {}
        for idx, stem_name in enumerate(sources):
            stem_filename = f"{stem_name}.wav"
            stem_path = f"{output_dir}/{stem_filename}"

            # 还原音频幅度并转回 CPU
            stem_audio = separated[idx].cpu() * ref.std() + ref.mean()

            # 转为 numpy 并保存
            stem_np = stem_audio.numpy().transpose(1, 0)
            sf.write(stem_path, stem_np, samplerate=model.samplerate)
            result_paths[stem_name] = stem_path
            logger.info("已保存音轨: %s -> %s", stem_name, stem_path)

        logger.info("分离完成，共 %d 个音轨", len(result_paths))
        return result_paths

    @staticmethod
    def get_available_models() -> List[str]:
        """
        获取可用的 Demucs 模型列表

        Returns:
            模型名称列表
        """
        return [
            "htdemucs_6s",    # 6轨模型: vocals/drums/bass/piano/guitar/other
            "htdemucs_ft",    # 4轨高精度版: vocals/drums/bass/other (处理时间4倍，效果更好)
        ]