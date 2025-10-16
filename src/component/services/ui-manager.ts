// UI管理服务模块
import { APP_CONSTANTS } from '../config/constants';
import { ComfyUIOption, UISettings } from '../types';
import { errorHandler } from '../utils/error-handler';
import log from '../logger';

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
        // 新增预设相关默认设置
        presetType: 'builtin',
        externalPresetSource: 'sillytavern',
        selectedSillyTavernPreset: '',
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

    // VAE特定的调试信息
    if (selectId === 'sd_vae') {
        log.info('🔍 [VAE UI Debug] 填充VAE下拉框:');
        log.info('🔍 [VAE UI Debug] 选项数据:', options);
        log.info('🔍 [VAE UI Debug] 选项数量:', options?.length || 0);
        log.info('🔍 [VAE UI Debug] 空文本:', emptyText);
        log.info('🔍 [VAE UI Debug] 选中值:', selectedValue);
    }

    if (options && options.length > 0) {
        // 先添加空选项
        select.append(`<option value="">-- 请选择 --</option>`);

        options.forEach((option) => {
            const value = option.value || option;
            const text = option.text || option;
            const isSelected = selectedValue && value === selectedValue ? ' selected' : '';
            select.append(`<option value="${value}"${isSelected}>${text}</option>`);
        });

        if (selectId === 'sd_vae') {
            log.info('🔍 [VAE UI Debug] 成功添加VAE选项，共', options.length, '个');
        }
    } else {
        select.append(`<option value="">-- ${emptyText} --</option>`);

        if (selectId === 'sd_vae') {
            log.info('🔍 [VAE UI Debug] 没有VAE选项，显示空文本:', emptyText);
        }
    }

    // 如果指定了选中值且该值在选项中存在，则选中它
    if (selectedValue) {
        const optionExists = select.find(`option[value="${selectedValue}"]`).length > 0;
        if (optionExists) {
            select.val(selectedValue);
            log.info(`🔍 [UI Debug] 恢复选中值 ${selectedValue} 到 ${selectId}`);
        } else {
            log.info(`🔍 [UI Debug] 保存的配置 ${selectedValue} 不在当前选项中，保持默认选择`);
        }
    }
}

/**
 * 清空所有选项下拉框
 */
export function clearAllOptions(): void {
    const $root = $('#text-image-generator-extension-container');

    // 清空ComfyUI相关选项，但保留用户保存的配置值
    const comfySelects = [
        { id: 'sd_model', text: '请先配置ComfyUI URL' },
        { id: 'sd_sampler', text: '请先配置ComfyUI URL' },
        { id: 'sd_scheduler', text: '请先配置ComfyUI URL' },
        { id: 'sd_vae', text: '请先配置ComfyUI URL' }
    ];

    comfySelects.forEach(({ id, text }) => {
        const select = $root.find(`#${id}`);
        const currentValue = select.val(); // 保存当前值
        select.empty();
        select.append(`<option value="">-- ${text} --</option>`);

        // 如果当前值存在，添加一个选项来显示它
        if (currentValue && currentValue !== '') {
            select.append(`<option value="${currentValue}" selected>${currentValue}</option>`);
        }
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

    log.info('🔍 [UI Debug] 开始恢复用户保存的配置:', {
        sd_model: settings.sd_model,
        sd_sampler: settings.sd_sampler,
        sd_scheduler: settings.sd_scheduler,
        sd_vae: settings.sd_vae,
        sd_resolution: settings.sd_resolution
    });

    // 恢复各个选择框的值，只有当选项存在时才设置
    const selects = [
        { id: 'sd_model', value: settings.sd_model },
        { id: 'sd_sampler', value: settings.sd_sampler },
        { id: 'sd_scheduler', value: settings.sd_scheduler },
        { id: 'sd_vae', value: settings.sd_vae },
        { id: 'sd_resolution', value: settings.sd_resolution }
    ];

    selects.forEach(({ id, value }) => {
        if (value) {
            const select = $root.find(`#${id}`);
            const optionExists = select.find(`option[value="${value}"]`).length > 0;
            if (optionExists) {
                select.val(value);
                log.info(`🔍 [UI Debug] 成功恢复 ${id} = ${value}`);
            } else {
                log.info(`🔍 [UI Debug] ${id} 的保存值 ${value} 不在当前选项中`);
            }
        }
    });
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
