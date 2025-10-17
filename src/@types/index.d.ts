/**
 * Text-Image-Generator 扩展内部类型定义
 * 包含 ComfyUI 工作流、图片生成参数、样式数据等类型
 */

/**
 * ComfyUI 工作流类型
 * 工作流是一个 JSON 对象，键为节点ID，值为节点配置
 */
export interface ComfyWorkflow {
    /** 工作流 JSON 数据，键为节点ID */
    [key: string]: ComfyWorkflowNode | unknown;
}

/**
 * ComfyUI 工作流节点
 * 每个节点包含类型和输入参数
 */
export interface ComfyWorkflowNode {
    /** 节点类型（如 KSampler, CLIPTextEncode 等） */
    class_type?: string;
    /** 节点输入参数 */
    inputs?: Record<string, unknown>;
    /** 其他扩展字段 */
    [key: string]: unknown;
}

/**
 * ComfyUI 下拉选项类型
 * 用于填充模型、采样器等下拉框
 */
export interface ComfyUIOption {
    /** 选项值（存储值） */
    value: string;
    /** 选项显示文本（用户看到的） */
    text: string;
}

/**
 * ComfyUI 所有可用选项集合
 * 从 ComfyUI 服务器获取的所有配置选项
 */
export interface ComfyAllOptions {
    /** 可用模型列表 */
    models: ComfyUIOption[];
    /** 可用采样器列表 */
    samplers: ComfyUIOption[];
    /** 可用调度器列表 */
    schedulers: ComfyUIOption[];
    /** 可用 VAE 列表 */
    vaes: ComfyUIOption[];
}

/**
 * 工作流占位符定义
 * 用于在工作流编辑器中查找和替换文本
 */
export interface WorkflowPlaceholder {
    /** 要查找的字符串 */
    find: string;
    /** 替换为的字符串 */
    replace: string;
}

/**
 * 图片生成参数
 * 包含所有用于生成图片的配置参数
 */
export interface ImageGenerationParams {
    /** 正面提示词（描述要生成的内容） */
    prompt: string;
    /** 负面提示词（描述不想要的内容） */
    negative_prompt?: string;
    /** 使用的模型名称 */
    model?: string;
    /** 使用的 VAE 名称 */
    vae?: string;
    /** 采样器算法 */
    sampler?: string;
    /** 调度器类型 */
    scheduler?: string;
    /** 采样步数 */
    steps?: number;
    /** CFG Scale（提示词引导强度） */
    scale?: number;
    /** 降噪强度（0-1） */
    denoise?: number;
    /** CLIP Skip 层数 */
    clip_skip?: number;
    /** 图片宽度（像素） */
    width?: number;
    /** 图片高度（像素） */
    height?: number;
    /** 随机种子（-1 为随机） */
    seed?: number;
    /** 用户头像路径 */
    user_avatar?: string;
    /** 角色头像路径 */
    char_avatar?: string;
}

/**
 * 样式数据类型
 * 用于保存和加载预设的提示词组合
 */
export interface StyleData {
    /** 提示词前缀（正面） */
    promptPrefix: string;
    /** 负面提示词 */
    negativePrompt: string;
}

/**
 * 样式集合类型
 * 键为样式名称，值为样式数据
 */
export type StylesCollection = Record<string, StyleData>;

/**
 * 消息元素数据属性
 * 从 DOM 元素的 data 属性中读取
 */
export interface MessageElementData {
    /** 消息 ID */
    mesid?: string;
    /** 是否为用户消息（'true'/'false' 字符串） */
    is_user?: string;
}

/**
 * 图片生成结果
 * ComfyUI 或其他 API 返回的生成结果
 */
export interface ImageGenerationResult {
    /** Base64 编码的图片数据 */
    data: string;
    /** 图片格式（如 'png', 'jpg'） */
    format: string;
}

/**
 * UI 设置类型
 * 从 localStorage 读取的用户配置
 */
export interface UISettings {
    /** 扩展是否启用 */
    extensionEnabled: boolean;
    /** 图片源（comfy/openai） */
    source: string;
    /** ComfyUI 服务器地址 */
    comfyUrl: string;
    /** ComfyUI 工作流名称 */
    comfyWorkflowName: string;
    /** OpenAI 兼容 API 提供商 */
    openaiProvider: string;
    /** OpenAI API 地址 */
    openaiApiUrl: string;
    /** OpenAI API 密钥 */
    openaiApiKey: string;
    /** OpenAI 模型名称 */
    openaiModel: string;
    /** OpenAI 最大 tokens */
    openaiMaxTokens: number;
    /** OpenAI 温度参数 */
    openaiTemperature: number;
    /** OpenAI 上下文消息数量 */
    openaiContextCount: number;
    /** SD 采样器 */
    sd_sampler: string;
    /** SD 调度器 */
    sd_scheduler: string;
    /** SD 模型 */
    sd_model: string;
    /** SD VAE */
    sd_vae: string;
    /** SD 分辨率 */
    sd_resolution: string;
    /** SD 宽度 */
    sd_width: number;
    /** SD 高度 */
    sd_height: number;
    /** SD 步数 */
    sd_steps: number;
    /** SD CFG Scale */
    sd_scale: number;
    /** SD 降噪强度 */
    sd_denoising_strength: number;
    /** SD CLIP Skip */
    sd_clip_skip: number;
    /** SD 种子 */
    sd_seed: number;
    /** SD 提示词前缀 */
    sd_prompt_prefix: string;
    /** SD 负面提示词 */
    sd_negative_prompt: string;
    /** 预设类型（builtin/external） */
    presetType: string;
    /** 外部预设源 */
    externalPresetSource: string;
    /** 选中的 SillyTavern 预设 */
    selectedSillyTavernPreset: string;
    /** 聊天补全源 */
    chat_completion_source: string;
}
