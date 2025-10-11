// ComfyUI API 服务模块
import { getRequestHeaders } from '@sillytavern/script';
import { ComfyUIOption, ComfyUISettings } from '../types';
import { errorHandler, ErrorHandler } from '../utils/error-handler';

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
        const appError = ErrorHandler.createAPIError(
            `Failed to load ComfyUI ${endpoint}`,
            'API_CALL_FAILED',
            { endpoint, url: settings.comfyUrl }
        );
        errorHandler.handleError(appError, 'ComfyUI API');
        throw appError;
    }
}

/**
 * 加载ComfyUI模型列表
 */
export async function loadComfyModels(settings: ComfyUISettings): Promise<ComfyUIOption[]> {
    try {
        return await callComfyAPI<ComfyUIOption[]>('/api/sd/comfy/models', settings);
    } catch (error) {
        errorHandler.handleError(error as Error, 'Load ComfyUI Models');
        return [];
    }
}

/**
 * 加载ComfyUI采样器列表
 */
export async function loadComfySamplers(settings: ComfyUISettings): Promise<ComfyUIOption[]> {
    try {
        return await callComfyAPI<ComfyUIOption[]>('/api/sd/comfy/samplers', settings);
    } catch (error) {
        errorHandler.handleError(error as Error, 'Load ComfyUI Samplers');
        return [];
    }
}

/**
 * 加载ComfyUI调度器列表
 */
export async function loadComfySchedulers(settings: ComfyUISettings): Promise<ComfyUIOption[]> {
    try {
        return await callComfyAPI<ComfyUIOption[]>('/api/sd/comfy/schedulers', settings);
    } catch (error) {
        errorHandler.handleError(error as Error, 'Load ComfyUI Schedulers');
        return [];
    }
}

/**
 * 加载ComfyUI VAE列表
 */
export async function loadComfyVaes(settings: ComfyUISettings): Promise<ComfyUIOption[]> {
    try {
        return await callComfyAPI<ComfyUIOption[]>('/api/sd/comfy/vaes', settings);
    } catch (error) {
        errorHandler.handleError(error as Error, 'Load ComfyUI VAEs');
        return [];
    }
}

/**
 * 并行加载所有ComfyUI选项
 */
export async function loadAllComfyOptions(settings: ComfyUISettings) {
    const [models, samplers, schedulers, vaes] = await Promise.all([
        loadComfyModels(settings),
        loadComfySamplers(settings),
        loadComfySchedulers(settings),
        loadComfyVaes(settings)
    ]);

    return { models, samplers, schedulers, vaes };
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
