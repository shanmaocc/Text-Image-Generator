import { syncGenerateButtonStateForMessage } from '../render_image';
import log from '../logger';
import {
    getSettings,
    saveSetting,
    FIXED_OPTIONS,
    DEFAULT_COMFY_URL,
    UISettings,
} from '../services/ui-manager';
import {
    createNewWorkflow,
    deleteWorkflow,
    openWorkflowEditor,
    updateWorkflowSelect,
} from '../services/workflow-manager';
import { populateComfyOptions, validateComfyUrl } from './ui-config-comfy';
import { populateOpenAIModels, refreshOpenAIModels } from './ui-config-openai';
import { saveStyle, deleteStyle, updateStyleSelect } from './ui-config-styles';
import { loadSillyTavernPresets, loadSillyTavernPresetContent } from './ui-config-presets';

/**
 * 更新数据源设置显示
 */
export function updateSourceSettings(source: string): void {
    $('.source-settings').hide();
    $('#comfy-source-settings').show();
}

/**
 * 设置范围滑块
 */
export function setupRangeSlider(rangeId: string, valueId: string, settingKey: string): void {
    return setupRangeSliderScoped(rangeId, valueId, settingKey);
}

export function setupRangeSliderScoped(rangeId: string, valueId: string, settingKey: string): void {
    const $root = $('#text-image-generator-extension-container');
    const rangeInput = $root.find(`#${rangeId}`);
    const valueInput = $root.find(`#${valueId}`);

    rangeInput.on('input', function () {
        const value = parseFloat($(this).val() as string);
        valueInput.val(value);
        saveSetting(settingKey, value);
    });

    valueInput.on('input', function () {
        const value = parseFloat($(this).val() as string);
        const min = parseFloat(rangeInput.attr('min') || '0');
        const max = parseFloat(rangeInput.attr('max') || '100');

        if (value >= min && value <= max) {
            rangeInput.val(value);
            saveSetting(settingKey, value);
        }
    });
}

/**
 * 加载设置
 */
export async function loadSettings(): Promise<void> {
    const settings = getSettings();

    $('#extension-enable-toggle').prop('checked', settings.extensionEnabled);
    $('#source-select').val(settings.source);

    updateSourceSettings(settings.source);

    const presetType = settings.presetType || 'builtin';
    if (presetType === 'builtin') {
        $('#preset-tab-builtin').addClass('active');
        $('#preset-tab-external').removeClass('active');
        $('#builtin-preset-content').show();
        $('#external-preset-content').hide();
    } else {
        $('#preset-tab-builtin').removeClass('active');
        $('#preset-tab-external').addClass('active');
        $('#builtin-preset-content').hide();
        $('#external-preset-content').show();
    }

    $('#external-preset-source').val(settings.externalPresetSource || 'sillytavern');

    if (presetType === 'external') {
        $('#sillytavern-preset-container').show();
    }

    (function () {
        const w = window as any;
        const siteUrl = w?.extension_settings?.sd?.comfy_url;
        const finalUrl = siteUrl || settings.comfyUrl || DEFAULT_COMFY_URL;
        $('#comfy-url-input').val(finalUrl);
        saveSetting('comfyUrl', finalUrl);
    })();

    $('#openai-provider-select').val(settings.openaiProvider || 'openai-compatible');
    $('#openai-api-url').val(settings.openaiApiUrl || '');
    $('#openai-api-key').val(settings.openaiApiKey || '');
    $('#openai-max-tokens').val(settings.openaiMaxTokens ?? 65500);
    $('#openai-temperature').val(settings.openaiTemperature ?? 1.2);
    $('#openai-context-count').val(settings.openaiContextCount ?? 2);
    populateOpenAIModels(settings);

    await updateWorkflowSelect();
    const selected = settings.comfyWorkflowName || '';
    if (selected) $('#comfy-workflow-select').val(selected);

    const $root = $('#text-image-generator-extension-container');
    $root.find('#sd_sampler').val(settings.sd_sampler || '');
    $root.find('#sd_scheduler').val(settings.sd_scheduler || '');
    $root.find('#sd_model').val(settings.sd_model || '');
    $root.find('#sd_vae').val(settings.sd_vae || '');

    const resolutionSelect = $root.find('#sd_resolution');
    resolutionSelect.empty();
    FIXED_OPTIONS.resolutions.forEach(option => {
        const selected = option.value === 'sd_res_1024x1024' ? ' selected' : '';
        resolutionSelect.append(
            `<option value="${option.value}"${selected}>${option.text}</option>`
        );
    });
    $root.find('#sd_resolution').val(settings.sd_resolution || 'sd_res_1024x1024');
    $root.find('#sd_steps').val(settings.sd_steps || 20);
    $root.find('#sd_steps_value').val(settings.sd_steps || 20);
    $root.find('#sd_scale').val(settings.sd_scale || 7);
    $root.find('#sd_scale_value').val(settings.sd_scale || 7);
    $root.find('#sd_width').val(settings.sd_width || 1024);
    $root.find('#sd_width_value').val(settings.sd_width || 1024);
    $root.find('#sd_height').val(settings.sd_height || 1024);
    $root.find('#sd_height_value').val(settings.sd_height || 1024);
    $root.find('#sd_denoising_strength').val(settings.sd_denoising_strength || 0.7);
    $root.find('#sd_denoising_strength_value').val(settings.sd_denoising_strength || 0.7);
    $root.find('#sd_clip_skip').val(settings.sd_clip_skip || 1);
    $root.find('#sd_clip_skip_value').val(settings.sd_clip_skip || 1);
    $root.find('#sd_seed').val(settings.sd_seed || -1);
    $root.find('#sd_prompt_prefix').val(settings.sd_prompt_prefix || '');
    $root.find('#sd_negative_prompt').val(settings.sd_negative_prompt || '');

    await populateComfyOptions();
}

/**
 * 初始化界面功能
 */
export async function initializeUI(): Promise<void> {
    $('#extension-enable-toggle').on('change', function () {
        const enabled = $(this).is(':checked');
        log.info('Extension enabled:', enabled);
        saveSetting('extensionEnabled', enabled);

        if (enabled) {
            const chatContainer = $('#chat');
            if (chatContainer.length) {
                const allMessages = chatContainer.find('.mes');
                allMessages.each(function () {
                    const $message = $(this);
                    const mesId = $message.attr('mesid');
                    if (mesId) {
                        const isUserMessage =
                            $message.attr('is_user') === 'true' ||
                            $message.hasClass('user-message');
                        if (!isUserMessage) {
                            syncGenerateButtonStateForMessage($message, mesId, enabled);
                        }
                    }
                });
            }
        } else {
            $('.generate-image-btn').remove();
            $('.generate-image-btn').off('click');
        }
    });

    $('#source-select').on('change', function () {
        const source = $(this).val() as string;
        saveSetting('source', source);
        updateSourceSettings(source);
    });

    $('#comfy-url-input').on('input', function () {
        const url = ($(this).val() as string) || DEFAULT_COMFY_URL;
        saveSetting('comfyUrl', url);
        const w = window as any;
        if (w.extension_settings && w.extension_settings.sd) {
            w.extension_settings.sd.comfy_url = url;
            if (typeof w.saveSettingsDebounced === 'function') {
                w.saveSettingsDebounced();
            }
        }
        updateWorkflowSelect();
    });

    $('#comfy-validate-btn').on('click', function () {
        validateComfyUrl();
    });

    $('#openai-provider-select').on('change', function () {
        const provider = $(this).val() as string;
        saveSetting('openaiProvider', provider);
    });
    $('#openai-api-url').on('input', function () {
        const url = ($(this).val() as string) || '';
        saveSetting('openaiApiUrl', url);
    });
    $('#openai-api-key').on('input', function () {
        const key = ($(this).val() as string) || '';
        saveSetting('openaiApiKey', key);
    });
    $('#openai-api-key-toggle').on('click', function () {
        const input = $('#openai-api-key');
        const icon = $('#openai-api-key-toggle i');
        const currentType = input.attr('type');
        if (currentType === 'password') {
            input.attr('type', 'text');
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            input.attr('type', 'password');
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
        }
    });
    $('#openai-model-select').on('change', function () {
        const model = $(this).val() as string;
        saveSetting('openaiModel', model);
    });
    $('#openai-refresh-models').on('click', function () {
        refreshOpenAIModels();
    });
    $('#openai-max-tokens').on('input', function () {
        const v = parseInt($(this).val() as string) || 0;
        saveSetting('openaiMaxTokens', v);
    });
    $('#openai-temperature').on('input', function () {
        const v = parseFloat($(this).val() as string) || 0;
        saveSetting('openaiTemperature', v);
    });
    $('#openai-context-count').on('input', function () {
        const v = parseInt($(this).val() as string) || 0;
        saveSetting('openaiContextCount', v);
    });

    $('#comfy-open-workflow-editor').on('click', function () {
        openWorkflowEditor();
    });

    $('#comfy-new-workflow').on('click', function () {
        createNewWorkflow();
    });

    $('#comfy-delete-workflow').on('click', function () {
        deleteWorkflow();
    });
    $('#comfy-workflow-select').on('change', function () {
        const name = ($(this).val() as string) || '';
        saveSetting('comfyWorkflowName', name);
    });

    const $root = $('#text-image-generator-extension-container');
    $root.find('#sd_sampler').on('change', function () {
        saveSetting('sd_sampler', $(this).val());
    });
    $root.find('#sd_scheduler').on('change', function () {
        saveSetting('sd_scheduler', $(this).val());
    });
    $root.find('#sd_model').on('change', function () {
        saveSetting('sd_model', $(this).val());
    });
    $root.find('#sd_vae').on('change', function () {
        saveSetting('sd_vae', $(this).val());
    });
    $root.find('#sd_resolution').on('change', function () {
        const resolution = $(this).val() as string;
        saveSetting('sd_resolution', resolution);

        const widthHeightMap: Record<string, [number, number]> = {
            sd_res_512x512: [512, 512],
            sd_res_600x600: [600, 600],
            sd_res_512x768: [512, 768],
            sd_res_768x512: [768, 512],
            sd_res_960x540: [960, 540],
            sd_res_540x960: [540, 960],
            sd_res_1920x1088: [1920, 1088],
            sd_res_1088x1920: [1088, 1920],
            sd_res_1280x720: [1280, 720],
            sd_res_720x1280: [720, 1280],
            sd_res_1024x1024: [1024, 1024],
            sd_res_1152x896: [1152, 896],
            sd_res_896x1152: [896, 1152],
            sd_res_1216x832: [1216, 832],
            sd_res_832x1216: [832, 1216],
            sd_res_1344x768: [1344, 768],
            sd_res_768x1344: [768, 1344],
            sd_res_1536x640: [1536, 640],
            sd_res_640x1536: [640, 1536],
            sd_res_1536x1024: [1536, 1024],
            sd_res_1024x1536: [1024, 1536],
            sd_res_1024x1792: [1024, 1792],
            sd_res_1792x1024: [1792, 1024],
        };

        if (resolution in widthHeightMap) {
            const [width, height] = widthHeightMap[resolution];
            $root.find('#sd_width').val(width);
            $root.find('#sd_width_value').val(width);
            $root.find('#sd_height').val(height);
            $root.find('#sd_height_value').val(height);
            saveSetting('sd_width', width);
            saveSetting('sd_height', height);
        }
    });

    setupRangeSliderScoped('sd_steps', 'sd_steps_value', 'sd_steps');
    setupRangeSliderScoped('sd_scale', 'sd_scale_value', 'sd_scale');
    setupRangeSliderScoped('sd_width', 'sd_width_value', 'sd_width');
    setupRangeSliderScoped('sd_height', 'sd_height_value', 'sd_height');
    setupRangeSliderScoped(
        'sd_denoising_strength',
        'sd_denoising_strength_value',
        'sd_denoising_strength'
    );
    setupRangeSliderScoped('sd_clip_skip', 'sd_clip_skip_value', 'sd_clip_skip');

    $('#sd_seed').on('input', function () {
        saveSetting('sd_seed', parseInt($(this).val() as string) || -1);
    });

    $('#sd_prompt_prefix').on('input', function () {
        saveSetting('sd_prompt_prefix', $(this).val() || '');
    });

    $('#sd_negative_prompt').on('input', function () {
        saveSetting('sd_negative_prompt', $(this).val() || '');
    });

    $('#save-style-btn').on('click', function () {
        saveStyle();
    });

    $('#delete-style-btn').on('click', function () {
        deleteStyle();
    });

    $('#style-select').on('change', function () {
        const selectedStyle = $(this).val() as string;
        if (selectedStyle) {
            const styles = require('./ui-config-styles').getStyles();
            const style = styles[selectedStyle];
            if (style) {
                $('#prompt-prefix-textarea').val(style.promptPrefix);
                $('#negative-prompt-textarea').val(style.negativePrompt);
            }
        }
    });

    updateStyleSelect();

    $('#preset-tab-builtin').on('click', function () {
        $(this).addClass('active');
        $('#preset-tab-external').removeClass('active');
        $('#builtin-preset-content').show();
        $('#external-preset-content').hide();
        saveSetting('presetType', 'builtin');
    });

    $('#preset-tab-external').on('click', function () {
        $(this).addClass('active');
        $('#preset-tab-builtin').removeClass('active');
        $('#builtin-preset-content').hide();
        $('#external-preset-content').show();
        saveSetting('presetType', 'external');
        $('#sillytavern-preset-container').show();
    });

    $('#external-preset-source').on('change', function () {
        const source = $(this).val() as string;
        saveSetting('externalPresetSource', source);
        if (source === 'sillytavern') {
            $('#sillytavern-preset-container').show();
        } else {
            $('#sillytavern-preset-container').hide();
        }
    });

    $('#refresh-sillytavern-presets').on('click', function () {
        loadSillyTavernPresets();
    });

    $('#sillytavern-preset-select').on('change', function () {
        const presetId = $(this).val() as string;
        saveSetting('selectedSillyTavernPreset', presetId);
        if (presetId) {
            loadSillyTavernPresetContent(presetId);
        }
    });

    await loadSettings();
}
