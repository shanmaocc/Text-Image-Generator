import getContext from '@sillytavern/scripts/st-context';
import type { STContext } from '@sillytavern/scripts/st-context';
import { getRequestHeaders } from '@sillytavern/script';
import { getSettings, saveSetting } from '../services/ui-manager';
import { getExtensionRoot } from '../../utils/dom-utils';

/**
 * OpenAI预设类型定义
 */
interface OpenAIPreset {
    name?: string;
    title?: string;
    label?: string;
    id?: string;
    jailbreak_prompt?: string;
    main_prompt?: string;
    prompt_prefix?: string;
    prompt?: string;
    text?: string;
    content?: string;
    negative_prompt?: string;
    negative?: string;
    neg_prompt?: string;
}

/**
 * 预设源结果接口
 */
interface PresetSourceResult {
    names?: string[];
    settings?: OpenAIPreset[];
}

/**
 * 扩展的ST上下文，包含OpenAI预设信息
 */
interface STContextWithPresets extends STContext {
    openai_setting_names?: string[];
    openai_settings?: unknown[];
}

/**
 * 类型守卫：检查上下文是否包含OpenAI预设
 */
function hasOpenAIPresets(ctx: STContext): ctx is STContextWithPresets {
    const extended = ctx as STContextWithPresets;
    return Boolean(
        (extended.openai_setting_names && Array.isArray(extended.openai_setting_names)) ||
            (extended.openai_settings && Array.isArray(extended.openai_settings))
    );
}

function resolvePresetName(preset: unknown, fallback: string): string {
    const p = preset as OpenAIPreset | string | undefined;
    if (!p) return fallback;
    if (typeof p === 'string') return p || fallback;
    return p.name || p.title || p.label || p.id || fallback;
}

// Read preset names directly from the main site's populated select
function getOpenAIPresetsFromDom(): PresetSourceResult {
    const mainSelect = $('#settings_preset_openai');
    if (!mainSelect.length) return {};
    const options = mainSelect.find('option');
    const names: string[] = [];
    options.each(function () {
        const text = ($(this).text() || '').trim();
        if (text) names.push(text);
    });
    return names.length ? { names } : {};
}

/**
 * 从SillyTavern运行时上下文读取OpenAI预设
 */
function getOpenAIPresetsFromContext(): PresetSourceResult {
    const ctx = getContext();

    if (!hasOpenAIPresets(ctx)) {
        return {};
    }

    const namesOk = Array.isArray(ctx.openai_setting_names);
    const settingsOk = Array.isArray(ctx.openai_settings);

    if (namesOk && settingsOk) {
        return {
            names: ctx.openai_setting_names as string[],
            settings: ctx.openai_settings as OpenAIPreset[],
        };
    }

    if (settingsOk) {
        const settings = ctx.openai_settings as OpenAIPreset[];
        const names = settings.map((p: OpenAIPreset, i: number) =>
            resolvePresetName(p, `预设 ${i + 1}`)
        );
        return { names, settings };
    }

    return {};
}

/**
 * 从服务器获取OpenAI预设（最后的手段）
 */
async function fetchOpenAIPresetsFromServer(): Promise<PresetSourceResult> {
    try {
        const response = await fetch('/api/settings/get', {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify({}),
        });

        if (!response.ok) {
            logger.warn('服务器响应失败:', response.status, response.statusText);
            return {};
        }

        const data = await response.json();
        const namesRaw = data?.openai_setting_names;
        const settingsRaw = data?.openai_settings;

        if (Array.isArray(namesRaw) && Array.isArray(settingsRaw)) {
            // Server returns stringified json for settings; parse to objects where possible
            const settings: OpenAIPreset[] = settingsRaw.map((item: unknown) => {
                if (typeof item === 'string') {
                    try {
                        return JSON.parse(item);
                    } catch {
                        return {};
                    }
                }
                return (item as OpenAIPreset) ?? {};
            });
            const names: string[] = namesRaw as string[];

            logger.debug('获取到预设列表:', names.length, '个');
            return { names, settings };
        }

        return {};
    } catch (err) {
        logger.warn('从服务器获取预设数据失败:', err);
        return {};
    }
}

/**
 * 加载SillyTavern主站预设列表
 */
export async function loadSillyTavernPresets(): Promise<void> {
    const $root = getExtensionRoot();
    const select = $root.find('#sillytavern-preset-select');
    const refreshBtn = $root.find('#refresh-sillytavern-presets');

    select.empty().append('<option value="">-- 加载预设中... --</option>');
    refreshBtn.prop('disabled', true);

    try {
        // 1) Context
        let result = getOpenAIPresetsFromContext();
        // 2) Server fallback
        if (!Array.isArray(result.names) || result.names.length === 0) {
            result = await fetchOpenAIPresetsFromServer();
        }
        // 3) Optional DOM last-resort (outside root)
        if (!Array.isArray(result.names) || result.names.length === 0) {
            const domResult = getOpenAIPresetsFromDom();
            if (Array.isArray(domResult.names) && domResult.names.length > 0) {
                result = domResult;
            }
        }

        select.empty();
        select.append('<option value="">-- 选择预设 --</option>');

        const names: string[] = Array.isArray(result.names) ? result.names : [];
        if (names.length) {
            names.forEach((name, index) => {
                select.append(`<option value="${String(index)}">${name}</option>`);
            });
            const settings = getSettings();
            if (settings.selectedSillyTavernPreset) {
                select.val(settings.selectedSillyTavernPreset);
            }
            toastr.success(`成功加载 ${names.length} 个主站预设`);
        } else {
            select.append('<option value="" disabled>-- 暂无预设 --</option>');
            toastr.warning('未找到主站预设，请确保已配置 OpenAI 预设');
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '无法获取预设数据';
        logger.error('Failed to load SillyTavern presets:', error);
        select.empty().append('<option value="">-- 加载失败 --</option>');
        toastr.error(`加载预设失败: ${errorMessage}`);
    } finally {
        refreshBtn.prop('disabled', false);
    }
}

/**
 * 加载选中的SillyTavern预设内容
 */
export async function loadSillyTavernPresetContent(presetId: string): Promise<void> {
    try {
        logger.debug('加载SillyTavern预设内容:', presetId);
        let targetPreset: OpenAIPreset | string | undefined;

        // Context first
        const ctx = getContext();
        let ctxSettings: unknown[] | undefined;

        if (hasOpenAIPresets(ctx) && Array.isArray(ctx.openai_settings)) {
            ctxSettings = ctx.openai_settings;
        }

        if (!ctxSettings) {
            // Fetch from server and parse
            const server = await fetchOpenAIPresetsFromServer();
            ctxSettings = server.settings;
        }

        if (Array.isArray(ctxSettings)) {
            const index = parseInt(presetId, 10);
            if (!isNaN(index) && index >= 0 && index < ctxSettings.length) {
                targetPreset = ctxSettings[index] as OpenAIPreset | string;
            } else {
                throw new Error(`索引无效: ${index}, 总数: ${ctxSettings.length}`);
            }
        } else {
            throw new Error('预设数据格式错误');
        }

        if (!targetPreset) {
            throw new Error('未找到指定的预设');
        }

        logger.debug('预设加载成功:', typeof targetPreset === 'string' ? '字符串' : '对象');
        logger.debug('预设内容:', targetPreset);

        const $root = getExtensionRoot();
        let promptPrefix = '';
        let negativePrompt = '';

        if (typeof targetPreset === 'string') {
            promptPrefix = targetPreset;
        } else if (targetPreset && typeof targetPreset === 'object') {
            // OpenAI 预设可能包含 jailbreak_prompt, main_prompt 等字段
            promptPrefix =
                targetPreset.jailbreak_prompt ||
                targetPreset.main_prompt ||
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
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '无法获取预设数据';
        logger.error('加载预设内容失败:', error);
        toastr.error(`加载预设内容失败: ${errorMessage}`);
    }
}
