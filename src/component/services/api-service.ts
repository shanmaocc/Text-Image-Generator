// ComfyUI API 服务模块
import { getRequestHeaders } from '@sillytavern/script';
import { ComfyUIOption, ComfyUISettings } from '../types';
import { errorHandler, ErrorHandler } from '../utils/error-handler';
import log from '../logger';

/**
 * 通用ComfyUI API调用函数
 */
async function callComfyAPI<T>(
    endpoint: string,
    settings: ComfyUISettings
): Promise<T> {
    if (!settings.comfyUrl) {
        throw new Error('ComfyUI URL未配置');
    }

    try {
        const result = await fetch(endpoint, {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify({
                url: settings.comfyUrl,
            }),
        });

        if (!result.ok) {
            throw new Error('ComfyUI returned an error.');
        }

        return await result.json();
    } catch (error) {
        // 静默处理错误，直接抛出异常（参考主站插件）
        throw error;
    }
}

/**
 * 加载ComfyUI模型列表
 */
export async function loadComfyModels(settings: ComfyUISettings): Promise<ComfyUIOption[]> {
    if (!settings.comfyUrl) {
        return [];
    }

    try {
        return await callComfyAPI<ComfyUIOption[]>('/api/sd/comfy/models', settings);
    } catch (error) {
        // 静默处理错误，不显示错误提示（参考主站插件）
        return [];
    }
}

/**
 * 加载ComfyUI采样器列表
 */
export async function loadComfySamplers(settings: ComfyUISettings): Promise<ComfyUIOption[]> {
    if (!settings.comfyUrl) {
        return [];
    }

    try {
        return await callComfyAPI<ComfyUIOption[]>('/api/sd/comfy/samplers', settings);
    } catch (error) {
        // 静默处理错误，不显示错误提示（参考主站插件）
        return [];
    }
}

/**
 * 加载ComfyUI调度器列表
 */
export async function loadComfySchedulers(settings: ComfyUISettings): Promise<ComfyUIOption[]> {
    if (!settings.comfyUrl) {
        return [];
    }

    try {
        return await callComfyAPI<ComfyUIOption[]>('/api/sd/comfy/schedulers', settings);
    } catch (error) {
        // 静默处理错误，不显示错误提示（参考主站插件）
        log.warn('Failed to load ComfyUI schedulers:', error);
        return [];
    }
}

/**
 * 加载ComfyUI VAE列表
 */
export async function loadComfyVaes(settings: ComfyUISettings): Promise<ComfyUIOption[]> {
    if (!settings.comfyUrl) {
        return [];
    }

    try {
        log.info('🔍 [VAE Debug] 开始加载VAE列表...');
        log.info('🔍 [VAE Debug] ComfyUI URL:', settings.comfyUrl);

        const result = await callComfyAPI<ComfyUIOption[]>('/api/sd/comfy/vaes', settings);

        log.info('🔍 [VAE Debug] VAE API响应:', result);
        log.info('🔍 [VAE Debug] VAE数量:', result?.length || 0);

        if (result && result.length > 0) {
            log.info('🔍 [VAE Debug] 前3个VAE选项:', result.slice(0, 3));
        }

        return result;
    } catch (error) {
        // 静默处理错误，不显示错误提示（参考主站插件）
        log.warn('Failed to load ComfyUI VAEs:', error);
        return [];
    }
}

/**
 * 缓存键名
 */
const CACHE_KEYS = {
    MODELS: 'comfyui_models_cache',
    SAMPLERS: 'comfyui_samplers_cache',
    SCHEDULERS: 'comfyui_schedulers_cache',
    VAES: 'comfyui_vaes_cache',
    LAST_UPDATE: 'comfyui_options_last_update'
};

/**
 * 缓存过期时间（5分钟）
 */
const CACHE_EXPIRE_TIME = 5 * 60 * 1000;

/**
 * 检查缓存是否有效
 */
function isCacheValid(): boolean {
    const lastUpdate = localStorage.getItem(CACHE_KEYS.LAST_UPDATE);
    if (!lastUpdate) return false;

    const now = Date.now();
    const lastUpdateTime = parseInt(lastUpdate);
    return (now - lastUpdateTime) < CACHE_EXPIRE_TIME;
}

/**
 * 从缓存加载选项
 */
function loadFromCache(key: string): ComfyUIOption[] | null {
    try {
        const cached = localStorage.getItem(key);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (error) {
        log.warn(`Failed to load cache for ${key}:`, error);
    }
    return null;
}

/**
 * 保存选项到缓存
 */
function saveToCache(key: string, data: ComfyUIOption[]): void {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        localStorage.setItem(CACHE_KEYS.LAST_UPDATE, Date.now().toString());
    } catch (error) {
        log.warn(`Failed to save cache for ${key}:`, error);
    }
}

/**
 * 并行加载所有ComfyUI选项（带缓存）
 */
export async function loadAllComfyOptions(settings: ComfyUISettings) {
    // 如果缓存有效，优先使用缓存
    if (isCacheValid()) {
        log.info('🔍 [Cache Debug] 使用缓存加载选项');
        const cachedModels = loadFromCache(CACHE_KEYS.MODELS);
        const cachedSamplers = loadFromCache(CACHE_KEYS.SAMPLERS);
        const cachedSchedulers = loadFromCache(CACHE_KEYS.SCHEDULERS);
        const cachedVaes = loadFromCache(CACHE_KEYS.VAES);

        // 如果所有缓存都存在，直接返回
        if (cachedModels && cachedSamplers && cachedSchedulers && cachedVaes) {
            log.info('🔍 [Cache Debug] 从缓存加载成功:', {
                models: cachedModels.length,
                samplers: cachedSamplers.length,
                schedulers: cachedSchedulers.length,
                vaes: cachedVaes.length
            });
            return {
                models: cachedModels,
                samplers: cachedSamplers,
                schedulers: cachedSchedulers,
                vaes: cachedVaes
            };
        }
    }

    log.info('🔍 [Cache Debug] 缓存无效或不存在，重新请求API');

    // 缓存无效或不存在，重新请求API
    const [models, samplers, schedulers, vaes] = await Promise.all([
        loadComfyModels(settings),
        loadComfySamplers(settings),
        loadComfySchedulers(settings),
        loadComfyVaes(settings)
    ]);

    // 保存到缓存
    if (models.length > 0) saveToCache(CACHE_KEYS.MODELS, models);
    if (samplers.length > 0) saveToCache(CACHE_KEYS.SAMPLERS, samplers);
    if (schedulers.length > 0) saveToCache(CACHE_KEYS.SCHEDULERS, schedulers);
    if (vaes.length > 0) saveToCache(CACHE_KEYS.VAES, vaes);

    return { models, samplers, schedulers, vaes };
}

/**
 * 清除选项缓存
 */
export function clearOptionsCache(): void {
    try {
        localStorage.removeItem(CACHE_KEYS.MODELS);
        localStorage.removeItem(CACHE_KEYS.SAMPLERS);
        localStorage.removeItem(CACHE_KEYS.SCHEDULERS);
        localStorage.removeItem(CACHE_KEYS.VAES);
        localStorage.removeItem(CACHE_KEYS.LAST_UPDATE);
        log.info('🔍 [Cache Debug] 已清除选项缓存');
    } catch (error) {
        log.warn('Failed to clear cache:', error);
    }
}

/**
 * 验证ComfyUI连接
 */
export async function validateComfyConnection(url: string): Promise<boolean> {
    try {
        const target = `${url}/system_stats`;
        const proxyUrl = `/proxy/${encodeURIComponent(target)}`;
        const res = await fetch(proxyUrl, { method: 'GET' });
        return res.ok;
    } catch (error) {
        errorHandler.handleError(error as Error, 'ComfyUI Connection Validation');
        return false;
    }
}

/**
 * 停止ComfyUI生成
 */
export async function stopComfyGeneration(settings: ComfyUISettings): Promise<void> {
    try {
        const result = await fetch('/api/sd/comfy/interrupt', {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify({
                url: settings.comfyUrl,
            }),
        });

        if (!result.ok) {
            throw new Error('Failed to stop ComfyUI generation');
        }
    } catch (error) {
        errorHandler.handleError(error as Error, 'Stop ComfyUI Generation');
        throw error;
    }
}

/**
 * 获取工作流列表
 */
export async function loadWorkflowList(): Promise<string[]> {
    try {
        const result = await fetch('/api/sd/comfy/workflows', {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify({}),
        });

        if (!result.ok) {
            throw new Error('Failed to load workflow list');
        }

        return await result.json();
    } catch (error) {
        errorHandler.handleError(error as Error, 'Load Workflow List');
        return [];
    }
}

/**
 * 加载工作流文件内容
 */
export async function loadWorkflowFile(fileName: string): Promise<string> {
    try {
        const result = await fetch('/api/sd/comfy/workflow', {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify({
                file_name: fileName,
            }),
        });

        if (!result.ok) {
            throw new Error(`Failed to load workflow: ${fileName}`);
        }

        return await result.json();
    } catch (error) {
        errorHandler.handleError(error as Error, 'Load Workflow File');
        throw error;
    }
}

/**
 * 保存工作流文件
 */
export async function saveWorkflowFile(fileName: string, workflowContent: string): Promise<void> {
    try {
        const result = await fetch('/api/sd/comfy/save-workflow', {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify({
                file_name: fileName,
                workflow: workflowContent,
            }),
        });

        if (!result.ok) {
            throw new Error(`Failed to save workflow: ${fileName}`);
        }
    } catch (error) {
        errorHandler.handleError(error as Error, 'Save Workflow File');
        throw error;
    }
}

/**
 * 删除工作流文件
 */
export async function deleteWorkflowFile(fileName: string): Promise<void> {
    try {
        const result = await fetch('/api/sd/comfy/delete-workflow', {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify({
                file_name: fileName,
            }),
        });

        if (!result.ok) {
            throw new Error(`Failed to delete workflow: ${fileName}`);
        }
    } catch (error) {
        errorHandler.handleError(error as Error, 'Delete Workflow File');
        throw error;
    }
}
