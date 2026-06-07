import { useState, useRef, useEffect } from 'react';
import type { ModelType, ModelOption } from '../types';

/** 可用模型列表 */
const MODEL_OPTIONS: ModelOption[] = [
  {
    value: 'htdemucs_6s',
    label: '6轨标准版',
    description: '分离人声、鼓、贝斯、钢琴、吉他、其他',
  },
  {
    value: 'htdemucs_ft',
    label: '4轨高精度版',
    description: '最佳质量，处理较慢（人声、鼓、贝斯、其他）',
  },
];

interface ModelSelectorProps {
  model: ModelType;
  onModelChange: (model: ModelType) => void;
  disabled?: boolean;
}

/** 模型选择组件 - 自定义下拉菜单 */
export default function ModelSelector({ model, onModelChange, disabled }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selected = MODEL_OPTIONS.find(m => m.value === model);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (value: ModelType) => {
    onModelChange(value);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2" ref={dropdownRef}>
      <label className="block text-sm font-medium text-[var(--text-secondary)]">分离模型</label>
      
      {/* 下拉按钮 */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`selector w-full rounded-xl px-4 py-3 text-left outline-none transition-all flex items-center justify-between ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${isOpen ? 'border-purple-500 ring-2 ring-purple-500/20' : ''}`}
      >
        <div className="flex items-center gap-3">
          {/* 模型图标 */}
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            model === 'htdemucs_6s' 
              ? 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20' 
              : 'bg-gradient-to-br from-green-500/20 to-emerald-500/20'
          }`}>
            {model === 'htdemucs_6s' ? (
              <svg className="h-4 w-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            ) : (
              <svg className="h-4 w-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div>
            <span className="text-sm font-medium text-[var(--text-primary)]">{selected?.label}</span>
          </div>
        </div>
        
        {/* 下拉箭头 */}
        <svg 
          className={`h-5 w-5 text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute z-20 mt-2 w-full max-w-xs glass-card rounded-xl p-2 shadow-xl">
          {MODEL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value as ModelType)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                model === opt.value 
                  ? 'bg-purple-500/15 border border-purple-500/20' 
                  : 'hover:bg-[var(--surface-hover)]'
              }`}
            >
              {/* 模型图标 */}
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                opt.value === 'htdemucs_6s' 
                  ? 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20' 
                  : 'bg-gradient-to-br from-green-500/20 to-emerald-500/20'
              }`}>
                {opt.value === 'htdemucs_6s' ? (
                  <svg className="h-5 w-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              
              {/* 模型信息 */}
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    model === opt.value ? 'text-purple-400' : 'text-[var(--text-primary)]'
                  }`}>
                    {opt.label}
                  </span>
                  {model === opt.value && (
                    <svg className="h-4 w-4 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{opt.description}</p>
              </div>
            </button>
          ))}
          
          {/* 模型说明 */}
          <div className="mt-2 px-3 py-2 border-t border-[var(--border-glass-light)]">
            <p className="text-xs text-[var(--text-muted)]">
              6轨模式分离更细致，4轨高精度版质量更好但速度较慢
            </p>
          </div>
        </div>
      )}

      {/* 当前模型描述 */}
      {selected && !isOpen && (
        <p className="text-xs text-[var(--text-muted)]">{selected.description}</p>
      )}
    </div>
  );
}