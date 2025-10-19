// ComfyUI API 服务模块
import { getRequestHeaders } from '@sillytavern/script';
import { ComfyUIOption, ComfyUISettings } from '../types';
import { errorHandler } from '../utils/error-handler';
import { LRUCache } from '../utils/lru-cache';

/**
 * 通用ComfyUI API调用函数
 */
async function callComfyAPI<T>(endpoint: string, settings: ComfyUISettings): Promise<T> {
    if (!settings.comfyUrl) {
        throw new Error('ComfyUI URL未配置');
    }

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
        logger.warn('Failed to load ComfyUI schedulers:', error);
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
        const result = await callComfyAPI<ComfyUIOption[]>('/api/sd/comfy/vaes', settings);

        // 如果API返回空结果，可能是因为模型使用了Baked VAE
        if (!result || result.length === 0) {
            logger.info('No VAE options returned from API - model likely uses Baked VAE');
            // 返回Baked VAE选项，让用户知道模型有内置VAE
            return [
                {
                    value: 'Baked VAE',
                    text: 'Baked VAE (内置)',
                },
            ];
        }

        return result;
    } catch (error) {
        logger.warn('Failed to load ComfyUI VAEs:', error);
        // API调用失败时，也提供Baked VAE选项
        return [
            {
                value: 'Baked VAE',
                text: 'Baked VAE (内置)',
            },
        ];
    }
}

/**
 * LRU 缓存实例（最多50个条目，5分钟过期）
 */
const optionsCache = new LRUCache<string, ComfyUIOption[]>(50, 5 * 60 * 1000);

/**
 * 并行加载所有ComfyUI选项（带 LRU 缓存）
 */
export async function loadAllComfyOptions(settings: ComfyUISettings) {
    const cacheKey = `all_options_${settings.comfyUrl}`;

    // 检查缓存
    const cached = optionsCache.get(cacheKey);
    if (cached) {
        logger.info('从 LRU 缓存加载 ComfyUI 选项');
        // 缓存的是完整对象，需要解构
        const cachedData = cached as unknown as {
            models: ComfyUIOption[];
            samplers: ComfyUIOption[];
            schedulers: ComfyUIOption[];
            vaes: ComfyUIOption[];
        };
        return cachedData;
    }

    logger.info('从 API 加载 ComfyUI 选项');

    // 并行加载所有选项
    const [models, samplers, schedulers, vaes] = await Promise.all([
        loadComfyModels(settings),
        loadComfySamplers(settings),
        loadComfySchedulers(settings),
        loadComfyVaes(settings),
    ]);

    const result = { models, samplers, schedulers, vaes };

    // 保存到 LRU 缓存
    if (models.length > 0 || samplers.length > 0 || schedulers.length > 0 || vaes.length > 0) {
        optionsCache.set(cacheKey, result as unknown as ComfyUIOption[]);
        logger.debug('ComfyUI 选项已缓存');
    }

    return result;
}

/**
 * 清除选项缓存
 */
export function clearOptionsCache(): void {
    optionsCache.clear();
    logger.info('LRU 缓存已清除');
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
