// 类型定义文件

/**
 * ComfyUI选项接口
 */
export interface ComfyUIOption {
    value?: string;
    text?: string;
}

/**
 * ComfyUI设置接口
 */
export interface ComfyUISettings {
    comfyUrl: string;
}

/**
 * UI设置接口
 */
export interface UISettings {
    extensionEnabled: boolean;
    source: string;
    comfyUrl: string;
    openaiProvider: string;
    openaiApiUrl: string;
    chat_completion_source: string;
    openaiApiKey: string;
    openaiModel: string;
    openaiMaxTokens: number;
    openaiTemperature: number;
    openaiContextCount: number;
    comfyWorkflowName: string;
    sd_sampler: string;
    sd_scheduler: string;
    sd_model: string;
    sd_vae: string;
    sd_resolution: string;
    sd_steps: number;
    sd_scale: number;
    sd_width: number;
    sd_height: number;
    sd_denoising_strength: number;
    sd_clip_skip: number;
    sd_seed: number;
    sd_prompt_prefix: string;
    sd_negative_prompt: string;
}

/**
 * AI消息接口
 */
export interface AIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

/**
 * OpenAI兼容API请求参数接口
 */
export interface OpenAICompatibleOptions {
    apiUrl: string; // OpenAI兼容API的根地址
    apiKey: string; // 用于认证的API密钥
    model: string; // 使用的模型名称
    maxTokens?: number; // 最大生成token数（可选）
    temperature?: number; // 采样温度（可选）
}

/**
 * 工作流存储类型
 */
export type WorkflowStore = Record<string, any>; // name -> workflow JSON object

/**
 * 样式接口
 */
export interface Style {
    promptPrefix: string;
    negativePrompt: string;
}

/**
 * 样式存储类型
 */
export type StyleStore = Record<string, Style>;

/**
 * 分辨率选项接口
 */
export interface ResolutionOption {
    value: string;
    text: string;
}

/**
 * 错误信息接口
 */
export interface ErrorInfo {
    message: string;
    code?: string;
    details?: any;
    timestamp: number;
}

/**
 * 错误类型枚举
 */
export enum ErrorType {
    NETWORK = 'NETWORK',
    API = 'API',
    VALIDATION = 'VALIDATION',
    WORKFLOW = 'WORKFLOW',
    UI = 'UI',
    UNKNOWN = 'UNKNOWN',
}

/**
 * 渲染模式枚举
 */
export enum RenderMode {
    FULL = 'FULL',
    PARTIAL = 'PARTIAL',
}

/**
 * 数据源类型
 */
export type DataSource = 'comfy' | 'openai' | 'other';

/**
 * OpenAI提供商类型
 */
export type OpenAIProvider = 'openai-compatible' | 'openai' | 'other';
