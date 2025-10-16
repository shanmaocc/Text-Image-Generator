import getContext from '@sillytavern/scripts/st-context';
import log from '../logger';
import { getSettings, saveSetting } from '../services/ui-manager';

/**
 * 加载SillyTavern主站预设列表
 */
export async function loadSillyTavernPresets(): Promise<void> {
    const select = $('#sillytavern-preset-select');
    const refreshBtn = $('#refresh-sillytavern-presets');

    select.empty().append('<option value="">-- 加载预设中... --</option>');
    refreshBtn.prop('disabled', true);

    try {
        const context = getContext() as any;
        let presets: any[] = [];

        if (context?.presets && Array.isArray(context.presets)) {
            presets = context.presets;
        } else if (context?.preset_list && Array.isArray(context.preset_list)) {
            presets = context.preset_list;
        } else if (context?.prompt_presets && Array.isArray(context.prompt_presets)) {
            presets = context.prompt_presets;
        } else if (context?.settings?.presets && Array.isArray(context.settings.presets)) {
            presets = context.settings.presets;
        } else {
            const w = window as any;
            if (w?.presets && Array.isArray(w.presets)) {
                presets = w.presets;
            } else if (w?.preset_list && Array.isArray(w.preset_list)) {
                presets = w.preset_list;
            } else if (
                w?.extension_settings?.presets &&
                Array.isArray(w.extension_settings.presets)
            ) {
                presets = w.extension_settings.presets;
            }
        }

        select.empty();
        select.append('<option value="">-- 选择预设 --</option>');

        if (presets.length === 0) {
            select.append('<option value="" disabled>-- 暂无预设 --</option>');
        } else {
            presets.forEach((preset: any, index: number) => {
                let name = '未命名预设';
                let value = '';

                if (typeof preset === 'string') {
                    name = preset;
                    value = preset;
                } else if (preset && typeof preset === 'object') {
                    name =
                        preset.name ||
                        preset.title ||
                        preset.label ||
                        preset.id ||
                        `预设 ${index + 1}`;
                    value =
                        preset.id ||
                        preset.name ||
                        preset.title ||
                        preset.label ||
                        `preset_${index}`;
                }

                select.append(`<option value="${value}">${name}</option>`);
            });
        }

        const settings = getSettings();
        if (settings.selectedSillyTavernPreset) {
            select.val(settings.selectedSillyTavernPreset);
        }

        toastr.success(`成功加载 ${presets.length} 个预设`);
    } catch (error: any) {
        log.error('Failed to load SillyTavern presets:', error);
        select.empty().append('<option value="">-- 加载失败 --</option>');
        toastr.error(`加载预设失败: ${error.message || '无法获取预设数据'}`);
    } finally {
        refreshBtn.prop('disabled', false);
    }
}

/**
 * 加载选中的SillyTavern预设内容
 */
export async function loadSillyTavernPresetContent(presetId: string): Promise<void> {
    try {
        log.info('Loading SillyTavern preset content:', presetId);
        const context = getContext() as any;
        let presets: any[] = [];
        let targetPreset: any = null;

        if (context?.presets && Array.isArray(context.presets)) {
            presets = context.presets;
        } else if (context?.preset_list && Array.isArray(context.preset_list)) {
            presets = context.preset_list;
        } else if (context?.prompt_presets && Array.isArray(context.prompt_presets)) {
            presets = context.prompt_presets;
        } else if (context?.settings?.presets && Array.isArray(context.settings.presets)) {
            presets = context.settings.presets;
        } else {
            const w = window as any;
            if (w?.presets && Array.isArray(w.presets)) {
                presets = w.presets;
            } else if (w?.preset_list && Array.isArray(w.preset_list)) {
                presets = w.preset_list;
            } else if (
                w?.extension_settings?.presets &&
                Array.isArray(w.extension_settings.presets)
            ) {
                presets = w.extension_settings.presets;
            }
        }

        if (presets.length > 0) {
            targetPreset = presets.find((preset: any) => {
                if (typeof preset === 'string') {
                    return preset === presetId;
                } else if (preset && typeof preset === 'object') {
                    const id = preset.id || preset.name || preset.title || preset.label;
                    return id === presetId;
                }
                return false;
            });
        }

        if (!targetPreset) {
            throw new Error('未找到指定的预设');
        }

        const $root = $('#text-image-generator-extension-container');
        let promptPrefix = '';
        let negativePrompt = '';

        if (typeof targetPreset === 'string') {
            promptPrefix = targetPreset;
        } else if (targetPreset && typeof targetPreset === 'object') {
            promptPrefix =
                targetPreset.prompt_prefix ||
                targetPreset.prompt ||
                targetPreset.text ||
                targetPreset.content ||
                '';
            negativePrompt =
                targetPreset.negative_prompt ||
                targetPreset.negative ||
                targetPreset.neg_prompt ||
                '';
        }

        if (promptPrefix) {
            $root.find('#sd_prompt_prefix').val(promptPrefix);
            saveSetting('sd_prompt_prefix', promptPrefix);
        }

        if (negativePrompt) {
            $root.find('#sd_negative_prompt').val(negativePrompt);
            saveSetting('sd_negative_prompt', negativePrompt);
        }

        toastr.success('预设已应用');
    } catch (error: any) {
        log.error('加载预设内容失败:', error);
        toastr.error(`加载预设内容失败: ${error.message || '无法获取预设数据'}`);
    }
}
