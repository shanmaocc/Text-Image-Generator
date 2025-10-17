/**
 * 全局类型声明文件
 * 包含 Vite 环境变量和全局对象的类型定义
 */

import type { Logger } from 'loglevel';

declare global {
    /**
     * 全局 log 对象
     * 可在任何地方直接使用，无需导入
     */
    var log: Logger;

    /**
     * Vite 环境变量接口
     * 这些变量在构建时由 Vite 从 .env 文件注入
     */
    interface ImportMetaEnv {
        /** ComfyUI 默认服务器地址 */
        readonly VITE_DEFAULT_COMFY_URL?: string;
        /** OpenAI API 默认地址 */
        readonly VITE_DEFAULT_OPENAI_API_URL?: string;
        /** 调试模式（'true' 或 'false' 字符串） */
        readonly VITE_DEBUG_MODE?: string;
        /** 日志级别（trace/debug/info/warn/error/silent） */
        readonly VITE_LOG_LEVEL?: string;
        /** OpenAI 默认最大 Token 数 */
        readonly VITE_DEFAULT_OPENAI_MAX_TOKENS?: string;
        /** OpenAI 默认温度 */
        readonly VITE_DEFAULT_OPENAI_TEMPERATURE?: string;
        /** OpenAI 默认上下文数量 */
        readonly VITE_DEFAULT_OPENAI_CONTEXT_COUNT?: string;
    }

    /**
     * import.meta 类型扩展
     * 为 Vite 的 import.meta.env 提供类型支持
     */
    interface ImportMeta {
        /** Vite 环境变量对象 */
        readonly env: ImportMetaEnv;
    }
}

// 确保此文件被视为模块
export {};
