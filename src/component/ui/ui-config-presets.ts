import getContext from '@sillytavern/scripts/st-context';
import type { STContextExtended } from '@sillytavern/scripts/st-context';
import { getRequestHeaders } from '@sillytavern/script';
import { getSettings, saveSetting } from '../services/ui-manager';
import { getExtensionRoot, findInRoot } from '../../utils/dom-utils';

// Types for stronger safety
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

interface PresetSourceResult {
    names?: string[];
    settings?: OpenAIPreset[];
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

// Read from SillyTavern runtime context if available
function getOpenAIPresetsFromContext(): PresetSourceResult {
    const ctx = getContext();
    // 类型安全地访问扩展字段
    const extendedCtx = ctx as any;
    const namesOk = Array.isArray(extendedCtx?.openai_setting_names);
    const settingsOk = Array.isArray(extendedCtx?.openai_settings);
    if (namesOk && settingsOk) {
        return {
            names: extendedCtx.openai_setting_names as string[],
            settings: extendedCtx.openai_settings as OpenAIPreset[],
        };
    }
    if (settingsOk) {
        const settings = extendedCtx.openai_settings as OpenAIPreset[];
        const names = settings.map((p: OpenAIPreset, i: number) =>
            resolvePresetName(p, `预设 ${i + 1}`)
        );
        return { names, settings };
    }
    return {};
}

// Fetch from server as a last resort
async function fetchOpenAIPresetsFromServer(): Promise<PresetSourceResult> {
    try {
        const response = await fetch('/api/settings/get', {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify({}),
        });

        if (!response.ok) {
            log.error('服务器响应失败:', response.status, response.statusText);
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

            // 打印预设内容（调试用，后续删除）
            log.info('获取到的预设列表:', JSON.stringify(names, null, 2));
            log.info('预设详细内容:', JSON.stringify(settings, null, 2));

            return { names, settings };
        }

        return {};
    } catch (err) {
        log.error('从服务器获取预设数据失败:', err);
        return {};
    }
}

/**
 * 加载SillyTavern主站预设列表
 */
export async function loadSillyTavernPresets(): Promise<void> {
    const $root = getExtensionRoot();
    const select = findInRoot('#sillytavern-preset-select');
    const refreshBtn = findInRoot('#refresh-sillytavern-presets');

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
        let targetPreset: OpenAIPreset | string | undefined;

        // Context first
        const ctx = getContext();
        let ctxSettings: unknown[] | undefined = Array.isArray((ctx as any)?.openai_settings)
            ? (ctx as any).openai_settings
            : undefined;

        if (!ctxSettings) {
            // Fetch from server and parse
            const server = await fetchOpenAIPresetsFromServer();
            ctxSettings = server.settings;
        }

        if (Array.isArray(ctxSettings)) {
            const index = parseInt(presetId);
            if (!isNaN(index) && index >= 0 && index < ctxSettings.length) {
                targetPreset = ctxSettings[index] as OpenAIPreset | string;
            } else {
                throw new Error(`索引无效: ${index}, 总数: ${ctxSettings.length}`);
            }
        } else {
            throw new Error('ctxSettings 不是数组');
        }

        if (!targetPreset) {
            throw new Error('未找到指定的预设');
        }

        // 打印预设内容（调试用，后续删除）
        console.log('[DEBUG] 选择的预设内容:', JSON.stringify(targetPreset, null, 2));
        log.info('选择的预设内容:', JSON.stringify(targetPreset, null, 2));

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
    } catch (error: any) {
        log.error('加载预设内容失败:', error);
        toastr.error(`加载预设内容失败: ${error.message || '无法获取预设数据'}`);
    }
}
