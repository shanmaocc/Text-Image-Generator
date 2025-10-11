// UI管理服务模块
import { APP_CONSTANTS } from '../config/constants';
import { ComfyUIOption, UISettings } from '../types';
import { errorHandler } from '../utils/error-handler';

// 导出类型供其他模块使用
export type { UISettings } from '../types';

export const DEFAULT_COMFY_URL = APP_CONSTANTS.DEFAULT_COMFY_URL;

// 固定选项常量（仅保留分辨率，因为这是UI预设）
export const FIXED_OPTIONS = {
    resolutions: APP_CONSTANTS.RESOLUTION_OPTIONS,
};

/**
 * 获取默认设置
 */
export function getDefaultSettings(): UISettings {
    return {
        extensionEnabled: APP_CONSTANTS.DEFAULT_SETTINGS.extensionEnabled,
        source: APP_CONSTANTS.DEFAULT_SETTINGS.source,
        comfyUrl: DEFAULT_COMFY_URL,
        openaiProvider: APP_CONSTANTS.DEFAULT_SETTINGS.openaiProvider,
        openaiApiUrl: APP_CONSTANTS.DEFAULT_OPENAI_API_URL,
        chat_completion_source: 'makersuite',
        openaiApiKey: '',
        openaiModel: '',
        openaiMaxTokens: APP_CONSTANTS.DEFAULT_SETTINGS.openaiMaxTokens,
        openaiTemperature: APP_CONSTANTS.DEFAULT_SETTINGS.openaiTemperature,
        openaiContextCount: APP_CONSTANTS.DEFAULT_SETTINGS.openaiContextCount,
        comfyWorkflowName: '',
        sd_sampler: 'euler',
        sd_scheduler: 'normal',
        sd_model: 'sd_xl_base_1.0.safetensors',
        sd_vae: 'sdxl_vae.safetensors',
        sd_resolution: APP_CONSTANTS.DEFAULT_SETTINGS.sd_resolution,
        sd_steps: APP_CONSTANTS.DEFAULT_SETTINGS.sd_steps,
        sd_scale: APP_CONSTANTS.DEFAULT_SETTINGS.sd_scale,
        sd_width: APP_CONSTANTS.DEFAULT_SETTINGS.sd_width,
        sd_height: APP_CONSTANTS.DEFAULT_SETTINGS.sd_height,
        sd_denoising_strength: APP_CONSTANTS.DEFAULT_SETTINGS.sd_denoising_strength,
        sd_clip_skip: APP_CONSTANTS.DEFAULT_SETTINGS.sd_clip_skip,
        sd_seed: APP_CONSTANTS.DEFAULT_SETTINGS.sd_seed,
        sd_prompt_prefix: APP_CONSTANTS.DEFAULT_SETTINGS.sd_prompt_prefix,
        sd_negative_prompt: APP_CONSTANTS.DEFAULT_SETTINGS.sd_negative_prompt,
    };
}

/**
 * 获取设置
 */
export function getSettings(): UISettings {
    const defaultSettings = getDefaultSettings();
    const saved = localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.SETTINGS);
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
}

/**
 * 保存设置
 */
export function saveSetting(key: string, value: any): void {
    try {
        const settings = getSettings();
        (settings as any)[key] = value;
        localStorage.setItem(APP_CONSTANTS.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
        errorHandler.handleError(error as Error, 'Save Setting');
    }
}

/**
 * 填充下拉框选项
 */
export function populateSelectOptions(
    selectId: string,
    options: ComfyUIOption[],
    emptyText: string,
    selectedValue?: string
): void {
    const $root = $('#text-image-generator-extension-container');
    const select = $root.find(`#${selectId}`);
    select.empty();

    if (options && options.length > 0) {
        options.forEach((option) => {
            const value = option.value || option;
            const text = option.text || option;
            select.append(`<option value="${value}">${text}</option>`);
        });
    } else {
        select.append(`<option value="">-- ${emptyText} --</option>`);
    }

    if (selectedValue) {
        select.val(selectedValue);
    }
}

/**
 * 清空所有选项下拉框
 */
export function clearAllOptions(): void {
    const $root = $('#text-image-generator-extension-container');

    // 清空ComfyUI相关选项
    const comfySelects = [
        { id: 'sd_model', text: '请先配置ComfyUI URL' },
        { id: 'sd_sampler', text: '请先配置ComfyUI URL' },
        { id: 'sd_scheduler', text: '请先配置ComfyUI URL' },
        { id: 'sd_vae', text: '请先配置ComfyUI URL' }
    ];

    comfySelects.forEach(({ id, text }) => {
        const select = $root.find(`#${id}`);
        select.empty();
        select.append(`<option value="">-- ${text} --</option>`);
    });

    // 填充分辨率（分辨率选项保持固定，因为这是UI预设）
    const resolutionSelect = $root.find('#sd_resolution');
    resolutionSelect.empty();
    FIXED_OPTIONS.resolutions.forEach(option => {
        const selected = option.value === 'sd_res_1024x1024' ? ' selected' : '';
        resolutionSelect.append(`<option value="${option.value}"${selected}>${option.text}</option>`);
    });
}

/**
 * 恢复之前保存的选择
 */
export function restoreSelectedOptions(): void {
    const settings = getSettings();
    const $root = $('#text-image-generator-extension-container');

    // 恢复各个选择框的值
    $root.find('#sd_model').val(settings.sd_model || '');
    $root.find('#sd_sampler').val(settings.sd_sampler || '');
    $root.find('#sd_scheduler').val(settings.sd_scheduler || '');
    $root.find('#sd_vae').val(settings.sd_vae || '');
    $root.find('#sd_resolution').val(settings.sd_resolution || '');
}

/**
 * 自动选择第一个可用选项
 */
export function autoSelectFirstOption(
    selectId: string,
    options: ComfyUIOption[],
    settingKey: string
): void {
    if (options && options.length > 0) {
        const firstOption = options[0];
        if (firstOption) {
            const value = firstOption.value || firstOption;
            saveSetting(settingKey, value);
            const $root = $('#text-image-generator-extension-container');
            $root.find(`#${selectId}`).val(String(value)).trigger('change');
        }
    }
}
