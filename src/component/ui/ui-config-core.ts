import { syncGenerateButtonStateForMessage } from '../image-generation/button-manager';
import getContext from '@sillytavern/scripts/st-context';
import { getExtensionRoot } from '../../utils/dom-utils';
import { getSettings, saveSetting, FIXED_OPTIONS, DEFAULT_COMFY_URL } from '../services/ui-manager';
import {
    createNewWorkflow,
    deleteWorkflow,
    openWorkflowEditor,
    updateWorkflowSelect,
} from '../services/workflow-manager';
import { populateComfyOptions, validateComfyUrl } from './ui-config-comfy';
import { populateOpenAIModels, refreshOpenAIModels } from './ui-config-openai';
import { saveStyle, deleteStyle, updateStyleSelect, getStyles } from './ui-config-styles';
import { loadSillyTavernPresets, loadSillyTavernPresetContent } from './ui-config-presets';

/**
 * 更新数据源设置显示
 */
export function updateSourceSettings(_source: string): void {
    const $root = getExtensionRoot();
    $root.find('.source-settings').hide();
    $root.find('#comfy-source-settings').show();
}

/**
 * 设置范围滑块
 */
export function setupRangeSlider(rangeId: string, valueId: string, settingKey: string): void {
    return setupRangeSliderScoped(rangeId, valueId, settingKey);
}

export function setupRangeSliderScoped(rangeId: string, valueId: string, settingKey: string): void {
    // Use the extension root for delegated event binding
    const $root = getExtensionRoot();
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
    const $root = getExtensionRoot();

    $root.find('#extension-enable-toggle').prop('checked', settings.extensionEnabled);
    $root.find('#source-select').val(settings.source);

    updateSourceSettings(settings.source);

    const presetType = settings.presetType || 'builtin';
    if (presetType === 'builtin') {
        $root.find('#preset-tab-builtin').addClass('active');
        $root.find('#preset-tab-external').removeClass('active');
        $root.find('#builtin-preset-content').show();
        $root.find('#external-preset-content').hide();
    } else {
        $root.find('#preset-tab-builtin').removeClass('active');
        $root.find('#preset-tab-external').addClass('active');
        $root.find('#builtin-preset-content').hide();
        $root.find('#external-preset-content').show();
    }

    $root.find('#external-preset-source').val(settings.externalPresetSource || 'sillytavern');

    if (presetType === 'external') {
        $root.find('#sillytavern-preset-container').show();
    }

    const ctx = getContext();
    const siteUrl = ctx.extensionSettings?.sd?.comfy_url;
    const finalUrl = siteUrl || settings.comfyUrl || DEFAULT_COMFY_URL;
    $root.find('#comfy-url-input').val(finalUrl);
    saveSetting('comfyUrl', finalUrl);

    $root.find('#openai-provider-select').val(settings.openaiProvider || 'openai-compatible');
    $root.find('#openai-api-url').val(settings.openaiApiUrl || '');
    $root.find('#openai-api-key').val(settings.openaiApiKey || '');
    $root.find('#openai-max-tokens').val(settings.openaiMaxTokens ?? 65500);
    $root.find('#openai-temperature').val(settings.openaiTemperature ?? 1.2);
    $root.find('#openai-context-count').val(settings.openaiContextCount ?? 2);
    populateOpenAIModels(settings);

    await updateWorkflowSelect();
    const selected = settings.comfyWorkflowName || '';
    if (selected) $root.find('#comfy-workflow-select').val(selected);

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
 * 初始化界面功能 */
export async function initializeUI(): Promise<void> {
    const $root = getExtensionRoot();

    $root.on('change', '#extension-enable-toggle', function () {
        const enabled = $(this).is(':checked');
        logger.info('🔄 Extension toggle changed. Enabled:', enabled);
        saveSetting('extensionEnabled', enabled);

        if (enabled) {
            logger.info('✅ Enabling extension: adding buttons to existing messages');
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
            logger.info('❌ Disabling extension: removing all buttons');
            const buttonCount = $(document).find('.generate-image-btn').length;
            logger.info(`Found ${buttonCount} buttons to remove`);
            $(document).find('.generate-image-btn').remove();
            $(document).off('click', '.generate-image-btn');
            logger.info('All buttons removed');
        }
    });

    $root.on('change', '#source-select', function () {
        const source = $(this).val() as string;
        saveSetting('source', source);
        updateSourceSettings(source);
    });

    $root.on('input', '#comfy-url-input', function () {
        const url = ($(this).val() as string) || DEFAULT_COMFY_URL;
        saveSetting('comfyUrl', url);
        const ctx = getContext();
        if (ctx.extensionSettings?.sd) {
            ctx.extensionSettings.sd.comfy_url = url;
            ctx.saveSettingsDebounced();
        }
        updateWorkflowSelect();
    });

    $root.on('click', '#comfy-validate-btn', function () {
        validateComfyUrl();
    });

    $root.on('change', '#openai-provider-select', function () {
        const provider = $(this).val() as string;
        saveSetting('openaiProvider', provider);
    });
    $root.on('input', '#openai-api-url', function () {
        const url = ($(this).val() as string) || '';
        saveSetting('openaiApiUrl', url);
    });
    $root.on('input', '#openai-api-key', function () {
        const key = ($(this).val() as string) || '';
        saveSetting('openaiApiKey', key);
    });
    $root.on('click', '#openai-api-key-toggle', function () {
        const input = $root.find('#openai-api-key');
        const icon = $root.find('#openai-api-key-toggle i');
        const currentType = input.attr('type');
        if (currentType === 'password') {
            input.attr('type', 'text');
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            input.attr('type', 'password');
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
        }
    });
    $root.on('change', '#openai-model-select', function () {
        const model = $(this).val() as string;
        saveSetting('openaiModel', model);
    });
    $root.on('click', '#openai-refresh-models', function () {
        refreshOpenAIModels();
    });
    $root.on('input', '#openai-max-tokens', function () {
        const v = parseInt($(this).val() as string) || 0;
        saveSetting('openaiMaxTokens', v);
    });
    $root.on('input', '#openai-temperature', function () {
        const v = parseFloat($(this).val() as string) || 0;
        saveSetting('openaiTemperature', v);
    });
    $root.on('input', '#openai-context-count', function () {
        const v = parseInt($(this).val() as string) || 0;
        saveSetting('openaiContextCount', v);
    });

    $root.on('click', '#comfy-open-workflow-editor', function () {
        openWorkflowEditor();
    });

    $root.on('click', '#comfy-new-workflow', function () {
        createNewWorkflow();
    });

    $root.on('click', '#comfy-delete-workflow', function () {
        deleteWorkflow();
    });
    $root.on('change', '#comfy-workflow-select', function () {
        const name = ($(this).val() as string) || '';
        saveSetting('comfyWorkflowName', name);
    });

    $root.on('change', '#sd_sampler', function () {
        saveSetting('sd_sampler', $(this).val());
    });
    $root.on('change', '#sd_scheduler', function () {
        saveSetting('sd_scheduler', $(this).val());
    });
    $root.on('change', '#sd_model', function () {
        saveSetting('sd_model', $(this).val());
    });
    $root.on('change', '#sd_vae', function () {
        saveSetting('sd_vae', $(this).val());
    });
    $root.on('change', '#sd_resolution', function () {
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
            const dimensions = widthHeightMap[resolution];
            if (dimensions) {
                const [width, height] = dimensions;
                $root.find('#sd_width').val(width);
                $root.find('#sd_width_value').val(width);
                $root.find('#sd_height').val(height);
                $root.find('#sd_height_value').val(height);
                saveSetting('sd_width', width);
                saveSetting('sd_height', height);
            }
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

    $root.on('input', '#sd_seed', function () {
        saveSetting('sd_seed', parseInt($(this).val() as string) || -1);
    });

    $root.on('input', '#sd_prompt_prefix', function () {
        saveSetting('sd_prompt_prefix', $(this).val() || '');
    });

    $root.on('input', '#sd_negative_prompt', function () {
        saveSetting('sd_negative_prompt', $(this).val() || '');
    });

    $root.on('click', '#save-style-btn', function () {
        saveStyle();
    });

    $root.on('click', '#delete-style-btn', function () {
        deleteStyle();
    });

    $root.on('change', '#style-select', function () {
        const selectedStyle = $(this).val() as string;
        if (selectedStyle) {
            const styles = getStyles();
            const style = styles[selectedStyle];
            if (style) {
                $root.find('#prompt-prefix-textarea').val(style.promptPrefix);
                $root.find('#negative-prompt-textarea').val(style.negativePrompt);
            }
        }
    });

    updateStyleSelect();

    $root.on('click', '#preset-tab-builtin', function () {
        $(this).addClass('active');
        $root.find('#preset-tab-external').removeClass('active');
        $root.find('#builtin-preset-content').show();
        $root.find('#external-preset-content').hide();
        saveSetting('presetType', 'builtin');
    });

    $root.on('click', '#preset-tab-external', function () {
        $(this).addClass('active');
        $root.find('#preset-tab-builtin').removeClass('active');
        $root.find('#builtin-preset-content').hide();
        $root.find('#external-preset-content').show();
        saveSetting('presetType', 'external');
        $root.find('#sillytavern-preset-container').show();
    });

    $root.on('change', '#external-preset-source', function () {
        const source = $(this).val() as string;
        saveSetting('externalPresetSource', source);
        if (source === 'sillytavern') {
            $root.find('#sillytavern-preset-container').show();
        } else {
            $root.find('#sillytavern-preset-container').hide();
        }
    });

    $root.on('click', '#refresh-sillytavern-presets', function () {
        loadSillyTavernPresets();
    });

    $root.on('change', '#sillytavern-preset-select', function () {
        const presetId = ($(this).val() as string) || '';
        saveSetting('selectedSillyTavernPreset', presetId);
        if (presetId) {
            loadSillyTavernPresetContent(presetId);
        }
    });

    // 主tab切换功能（委托绑定，避免渲染时序问题）
    $root.on('click', '#tig-tab-basic', function () {
        $(this).addClass('active');
        $root.find('#tig-tab-api').removeClass('active');
        $root.find('#tab-basic-content').show();
        $root.find('#tab-api-content').hide();
    });

    $root.on('click', '#tig-tab-api', function () {
        $(this).addClass('active');
        $root.find('#tig-tab-basic').removeClass('active');
        $root.find('#tab-basic-content').hide();
        $root.find('#tab-api-content').show();
    });

    await loadSettings();
}
