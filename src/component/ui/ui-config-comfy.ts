import log from '../logger';
import {
    loadAllComfyOptions,
    validateComfyConnection,
    clearOptionsCache,
} from '../services/api-service';
import {
    getSettings,
    populateSelectOptions,
    clearAllOptions,
    FIXED_OPTIONS,
    saveSetting,
} from '../services/ui-manager';
import { updateWorkflowSelect } from '../services/workflow-manager';

const DEFAULT_COMFY_URL = 'http://127.0.0.1:8188';

/**
 * 动态加载ComfyUI选项到下拉框
 */
export async function populateComfyOptions(): Promise<void> {
    const settings = getSettings();

    if (!settings.comfyUrl) {
        clearAllOptions();
        return;
    }

    try {
        const { models, samplers, schedulers, vaes } = await loadAllComfyOptions(settings);

        populateSelectOptions('sd_model', models, '无可用模型', settings.sd_model);
        populateSelectOptions('sd_sampler', samplers, '无可用采样器', settings.sd_sampler);
        populateSelectOptions('sd_scheduler', schedulers, '无可用调度器', settings.sd_scheduler);
        populateSelectOptions('sd_vae', vaes, '无可用VAE', settings.sd_vae);

        const $root = $('#text-image-generator-extension-container');
        const resolutionSelect = $root.find('#sd_resolution');
        resolutionSelect.empty();
        FIXED_OPTIONS.resolutions.forEach(option => {
            const selected =
                option.value === (settings.sd_resolution || 'sd_res_1024x1024') ? ' selected' : '';
            resolutionSelect.append(
                `<option value="${option.value}"${selected}>${option.text}</option>`
            );
        });
    } catch (error) {
        log.error('Failed to load ComfyUI options:', error);
        clearAllOptions();
    }
}

/**
 * 测试 ComfyUI 连接
 */
export async function validateComfyUrl(): Promise<void> {
    let url = ($('#comfy-url-input').val() as string) || DEFAULT_COMFY_URL;

    clearOptionsCache();
    url = normalizeComfyBaseUrl(url);
    const button = $('#comfy-validate-btn');
    const status = $('#comfy-connection-status');
    const originalText = button.text();

    button.text('连接中...').prop('disabled', true);
    if (status && status.length) status.hide();

    if (!url) {
        toastr.error('请先输入 ComfyUI URL');
        button.text(originalText).prop('disabled', false);
        return;
    }

    saveSetting('comfyUrl', url);

    try {
        const isValid = await validateComfyConnection(url);
        if (!isValid) {
            toastr.error('ComfyUI 连接失败');
            return;
        }

        toastr.success('ComfyUI API connected.');

        await populateComfyOptions();
        await updateWorkflowSelect();
    } catch (err: any) {
        toastr.error(`ComfyUI 连接异常：${err?.message || '网络错误'}`);
    } finally {
        button.text(originalText).prop('disabled', false);
    }
}

/**
 * 规范化用户输入的 ComfyUI 基地址
 */
export function normalizeComfyBaseUrl(input: string): string {
    let url = (input || '').trim();
    if (!/^https?:\/\//i.test(url)) {
        url = `http://${url}`;
    }
    url = url.replace(/\/$/, '');
    return url;
}
