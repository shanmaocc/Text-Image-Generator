// UI 配置管理模块 - 重构版本
import { getRequestHeaders } from '@sillytavern/script';
import getContext from '@sillytavern/scripts/st-context';
import { syncGenerateButtonStateForMessage } from './render_image';
import { loadAllComfyOptions, validateComfyConnection, clearOptionsCache } from './services/api-service';
import {
    autoSelectFirstOption,
    clearAllOptions,
    DEFAULT_COMFY_URL,
    FIXED_OPTIONS,
    getSettings,
    populateSelectOptions,
    restoreSelectedOptions,
    saveSetting,
    UISettings
} from './services/ui-manager';
import { createNewWorkflow, deleteWorkflow, openWorkflowEditor, updateWorkflowSelect } from './services/workflow-manager';

/**
 * 动态加载ComfyUI选项到下拉框
 */
export async function populateComfyOptions(): Promise<void> {
	const settings = getSettings();

	// 如果ComfyUI URL未配置，清空下拉框
	if (!settings.comfyUrl) {
		clearAllOptions();
		return;
	}

	try {
		// 并行加载所有ComfyUI数据
        const { models, samplers, schedulers, vaes } = await loadAllComfyOptions(settings);

        console.log('🔍 [UI Debug] 加载的选项数据:');
        console.log('🔍 [UI Debug] 模型数量:', models?.length || 0);
        console.log('🔍 [UI Debug] 采样器数量:', samplers?.length || 0);
        console.log('🔍 [UI Debug] 调度器数量:', schedulers?.length || 0);
        console.log('🔍 [UI Debug] VAE数量:', vaes?.length || 0);
        console.log('🔍 [UI Debug] VAE数据:', vaes);

        // 填充各个下拉框
        populateSelectOptions('sd_model', models, '无可用模型', settings.sd_model);
        populateSelectOptions('sd_sampler', samplers, '无可用采样器', settings.sd_sampler);
        populateSelectOptions('sd_scheduler', schedulers, '无可用调度器', settings.sd_scheduler);
        populateSelectOptions('sd_vae', vaes, '无可用VAE', settings.sd_vae);

        // 填充分辨率选项（分辨率选项保持固定，因为这是UI预设）
        const $root = $('#text-image-generator-extension-container');
		const resolutionSelect = $root.find('#sd_resolution');
		resolutionSelect.empty();
		FIXED_OPTIONS.resolutions.forEach(option => {
			const selected = option.value === (settings.sd_resolution || 'sd_res_1024x1024') ? ' selected' : '';
			resolutionSelect.append(`<option value="${option.value}"${selected}>${option.text}</option>`);
		});

	} catch (error) {
		console.error('Failed to load ComfyUI options:', error);
		// 如果加载失败，清空下拉框
		clearAllOptions();
	}
}

/**
 * 测试 ComfyUI 连接
 */
export async function validateComfyUrl(): Promise<void> {
    let url = ($('#comfy-url-input').val() as string) || DEFAULT_COMFY_URL;

    // 清除缓存，强制重新加载选项
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

    // 保存 URL
    saveSetting('comfyUrl', url);

    try {
        const isValid = await validateComfyConnection(url);
        if (!isValid) {
            toastr.error('ComfyUI 连接失败');
            return;
        }

        toastr.success('ComfyUI API connected.');

        // 连接成功后自动刷新选项
        await populateComfyOptions();
        // 同时刷新工作流列表
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
        url = `http://${url}`; // 若未填协议，默认 http
    }
    url = url.replace(/\/$/, '');
    return url;
}

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
 * 刷新模型列表
 */
export async function refreshOpenAIModels(): Promise<void> {
    try {
        // 1) 调用主站后端状态，拿到反向代理地址等信息
        const settings = getSettings();
        let req = {
            reverse_proxy: settings.openaiApiUrl,
            proxy_password: settings.openaiApiKey,
            chat_completion_source: settings.chat_completion_source,
        };
        const statusResp = await fetch('/api/backends/chat-completions/status', {
			method: 'POST',
			headers: getRequestHeaders(),
            body: JSON.stringify(req),
            cache: 'no-cache',
        });
        if (!statusResp.ok) {
            const text = await statusResp.text().catch(() => '');
            throw new Error(text || statusResp.statusText);
        }

        const data = await statusResp.json();

        const models = Array.isArray(data?.data) ? data.data : [];

        const modelIds: string[] = models
            .map((m: any) => m?.id)
            .filter((v: any) => typeof v === 'string');

        const metaText = `已加载 ${modelIds.length} 个可用模型`;
        const select = $('#openai-model-select');
        select.empty();
        select.append('<option value="">-- 选择模型 --</option>');
        modelIds.forEach((id: string) => select.append(`<option value="${id}">${id}</option>`));
        $('#openai-models-meta').text(metaText);
        // 如有已选，恢复选择
        const cur = settings.openaiModel;
        if (cur) select.val(cur);

        toastr.success(`成功加载 ${modelIds.length} 个模型`);
    } catch (err: any) {
        toastr.error(`刷新模型列表异常：${err?.message || '网络错误'}`);
        console.error(err);
    }
}

export function populateOpenAIModels(settings: UISettings): void {
    const select = $('#openai-model-select');
    // 初始空选项
    if (!select.children().length) {
        select.append('<option value="">-- 选择模型 --</option>');
    }
    if (settings.openaiModel) {
        // 确保当前模型出现在下拉中
        if (!select.find(`option[value="${settings.openaiModel}"]`).length) {
            select.append(
                `<option value="${settings.openaiModel}">${settings.openaiModel}</option>`
            );
        }
        select.val(settings.openaiModel);
    }
    // 同步下方提示
    $('#openai-models-meta').text('已加载 0 个可用模型');
}

/**
 * 保存样式
 */
export function saveStyle(): void {
    const styleName = prompt('请输入样式名称:');
    if (!styleName) return;

    const promptPrefix = $('#prompt-prefix-textarea').val() as string;
    const negativePrompt = $('#negative-prompt-textarea').val() as string;

    const styles = getStyles();
    styles[styleName] = {
        promptPrefix,
        negativePrompt,
    };

    localStorage.setItem('textToPicStyles', JSON.stringify(styles));
    updateStyleSelect();
    alert('样式保存成功！');
}

/**
 * 删除样式
 */
export function deleteStyle(): void {
    const selectedStyle = $('#style-select').val() as string;
    if (!selectedStyle) {
        alert('请先选择一个样式');
        return;
    }

    if (confirm(`确定要删除样式 "${selectedStyle}" 吗？`)) {
        const styles = getStyles();
        delete styles[selectedStyle];
        localStorage.setItem('textToPicStyles', JSON.stringify(styles));
        updateStyleSelect();
        alert('样式删除成功！');
    }
}

/**
 * 获取样式
 */
export function getStyles(): Record<string, any> {
    const saved = localStorage.getItem('textToPicStyles');
    return saved ? JSON.parse(saved) : {};
}

/**
 * 更新样式选择框
 */
export function updateStyleSelect(): void {
    const styles = getStyles();
    const styleSelect = $('#style-select');

    styleSelect.empty();
    styleSelect.append('<option value="">无样式</option>');

    Object.keys(styles).forEach(styleName => {
        styleSelect.append(`<option value="${styleName}">${styleName}</option>`);
    });
}

/**
 * 加载SillyTavern主站预设列表
 */
export async function loadSillyTavernPresets(): Promise<void> {
    const select = $('#sillytavern-preset-select');
    const refreshBtn = $('#refresh-sillytavern-presets');

    // 显示加载状态
    select.empty().append('<option value="">-- 加载预设中... --</option>');
    refreshBtn.prop('disabled', true);

    try {
        // 使用主站上下文对象获取预设
        const context = getContext() as any;
        console.log('🔍 [Preset Debug] 主站上下文:', context);

        // 从上下文中获取预设数据
        let presets: any[] = [];

        // 尝试从不同的可能位置获取预设
        if (context?.presets && Array.isArray(context.presets)) {
            presets = context.presets;
        } else if (context?.preset_list && Array.isArray(context.preset_list)) {
            presets = context.preset_list;
        } else if (context?.prompt_presets && Array.isArray(context.prompt_presets)) {
            presets = context.prompt_presets;
        } else if (context?.settings?.presets && Array.isArray(context.settings.presets)) {
            presets = context.settings.presets;
        } else {
            // 尝试从全局对象获取
            const w = window as any;
            if (w?.presets && Array.isArray(w.presets)) {
                presets = w.presets;
            } else if (w?.preset_list && Array.isArray(w.preset_list)) {
                presets = w.preset_list;
            } else if (w?.extension_settings?.presets && Array.isArray(w.extension_settings.presets)) {
                presets = w.extension_settings.presets;
            }
        }

        console.log('🔍 [Preset Debug] 找到的预设:', presets);

        // 清空并填充预设选项
        select.empty();
        select.append('<option value="">-- 选择预设 --</option>');

        if (presets.length === 0) {
            select.append('<option value="" disabled>-- 暂无预设 --</option>');
            console.log('🔍 [Preset Debug] 没有找到预设数据');
        } else {
            presets.forEach((preset: any, index: number) => {
                // 处理不同的预设数据结构
                let name = '未命名预设';
                let value = '';

                if (typeof preset === 'string') {
                    name = preset;
                    value = preset;
                } else if (preset && typeof preset === 'object') {
                    name = preset.name || preset.title || preset.label || `预设 ${index + 1}`;
                    value = preset.id || preset.name || preset.title || preset.label || name;
                }

                select.append(`<option value="${value}">${name}</option>`);
            });
        }

        // 恢复之前的选择
        const settings = getSettings();
        if (settings.selectedSillyTavernPreset) {
            select.val(settings.selectedSillyTavernPreset);
        }

        toastr.success(`成功加载 ${presets.length} 个预设`);

    } catch (error: any) {
        console.error('加载SillyTavern预设失败:', error);
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
        // 使用主站上下文对象获取预设详情
        const context = getContext() as any;
        console.log('🔍 [Preset Content Debug] 查找预设:', presetId);
        console.log('🔍 [Preset Content Debug] 主站上下文:', context);

        // 从上下文中查找对应的预设
        let presets: any[] = [];
        let targetPreset: any = null;

        // 尝试从不同的可能位置获取预设
        if (context?.presets && Array.isArray(context.presets)) {
            presets = context.presets;
        } else if (context?.preset_list && Array.isArray(context.preset_list)) {
            presets = context.preset_list;
        } else if (context?.prompt_presets && Array.isArray(context.prompt_presets)) {
            presets = context.prompt_presets;
        } else if (context?.settings?.presets && Array.isArray(context.settings.presets)) {
            presets = context.settings.presets;
        } else {
            // 尝试从全局对象获取
            const w = window as any;
            if (w?.presets && Array.isArray(w.presets)) {
                presets = w.presets;
            } else if (w?.preset_list && Array.isArray(w.preset_list)) {
                presets = w.preset_list;
            } else if (w?.extension_settings?.presets && Array.isArray(w.extension_settings.presets)) {
                presets = w.extension_settings.presets;
            }
        }

        // 查找目标预设
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

        console.log('🔍 [Preset Content Debug] 找到的目标预设:', targetPreset);

        if (!targetPreset) {
            throw new Error('未找到指定的预设');
        }

        // 应用预设到提示词字段
        const $root = $('#text-image-generator-extension-container');

        // 处理不同的预设数据结构
        let promptPrefix = '';
        let negativePrompt = '';

        if (typeof targetPreset === 'string') {
            // 如果是字符串，直接作为提示词前缀
            promptPrefix = targetPreset;
        } else if (targetPreset && typeof targetPreset === 'object') {
            // 如果是对象，尝试获取各种可能的字段
            promptPrefix = targetPreset.prompt_prefix || targetPreset.prompt || targetPreset.text || targetPreset.content || '';
            negativePrompt = targetPreset.negative_prompt || targetPreset.negative || targetPreset.neg_prompt || '';
        }

        // 应用提示词前缀
        if (promptPrefix) {
            $root.find('#sd_prompt_prefix').val(promptPrefix);
            saveSetting('sd_prompt_prefix', promptPrefix);
        }

        // 应用负面提示词
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

/**
 * 加载设置
 */
export async function loadSettings(): Promise<void> {
    const settings = getSettings();

    // 加载开关状态
    $('#extension-enable-toggle').prop('checked', settings.extensionEnabled);

    // 加载选择框值
    $('#source-select').val(settings.source);

    // 更新数据源设置显示
    updateSourceSettings(settings.source);

    // 加载预设类型设置
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

    // 加载外部预设来源设置
    $('#external-preset-source').val(settings.externalPresetSource || 'sillytavern');

    // 如果选择了外部预设，显示SillyTavern预设容器
    if (presetType === 'external') {
        $('#sillytavern-preset-container').show();
    }

    // 加载 ComfyUI URL
    (function () {
        const w = window as any;
        const siteUrl = w?.extension_settings?.sd?.comfy_url;
        const finalUrl = siteUrl || settings.comfyUrl || DEFAULT_COMFY_URL;
        $('#comfy-url-input').val(finalUrl);
        // 写回本地存储，保证一致
        saveSetting('comfyUrl', finalUrl);
    })();

    // OpenAI 兼容 API 配置加载
    $('#openai-provider-select').val(settings.openaiProvider || 'openai-compatible');
    $('#openai-api-url').val(settings.openaiApiUrl || '');
    $('#openai-api-key').val(settings.openaiApiKey || '');
    $('#openai-max-tokens').val(settings.openaiMaxTokens ?? 65500);
    $('#openai-temperature').val(settings.openaiTemperature ?? 1.2);
    $('#openai-context-count').val(settings.openaiContextCount ?? 2);
    // 初始化模型下拉
    populateOpenAIModels(settings);

    // 初始化工作流下拉
    await updateWorkflowSelect();
    const selected = settings.comfyWorkflowName || '';
    if (selected) $('#comfy-workflow-select').val(selected);

    // 加载占位符配置项（作用域限定）
    const $root = $('#text-image-generator-extension-container');
    // 直接设置选择框的值，即使选项还没有加载
    $root.find('#sd_sampler').val(settings.sd_sampler || '');
    $root.find('#sd_scheduler').val(settings.sd_scheduler || '');
    $root.find('#sd_model').val(settings.sd_model || '');
    $root.find('#sd_vae').val(settings.sd_vae || '');

    // 填充分辨率选项
	const resolutionSelect = $root.find('#sd_resolution');
	resolutionSelect.empty();
	FIXED_OPTIONS.resolutions.forEach(option => {
		const selected = option.value === 'sd_res_1024x1024' ? ' selected' : '';
		resolutionSelect.append(`<option value="${option.value}"${selected}>${option.text}</option>`);
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

    // 加载ComfyUI选项（参考主站插件的loadSettingOptions）
    await populateComfyOptions();
}

/**
 * 初始化界面功能
 */
export async function initializeUI(): Promise<void> {
	// 单页设置，无标签切换
	// 基础功能开关事件
	$('#extension-enable-toggle').on('change', function () {
		const enabled = $(this).is(':checked');
		log.info('扩展启用状态:', enabled);
		saveSetting('extensionEnabled', enabled);

		// 立即更新所有消息的按钮状态
		if (enabled) {
			// 如果启用，重新扫描所有消息并添加按钮
			log.info('扩展已启用，重新加载插件功能');
			const chatContainer = $('#chat');
			if (chatContainer.length) {
				const allMessages = chatContainer.find('.mes');
				allMessages.each(function() {
					const $message = $(this);
					const mesId = $message.attr('mesid');
					if (mesId) {
						// 检查是否是AI消息（非用户消息）
						const isUserMessage = $message.attr('is_user') === 'true' || $message.hasClass('user-message');
						if (!isUserMessage) {
							syncGenerateButtonStateForMessage($message, mesId);
						}
					}
				});
			}
		} else {
			// 如果禁用，移除所有生成按钮并清理事件
			log.info('扩展已禁用，移除所有插件功能');
			$('.generate-image-btn').remove();
			// 清理所有生成按钮的点击事件
			$('.generate-image-btn').off('click');
		}
	});

	// 数据源选择
	$('#source-select').on('change', function () {
		const source = $(this).val() as string;
		log.info('数据源:', source);
		saveSetting('source', source);
		updateSourceSettings(source);
	});

	// ComfyUI URL 输入即保存
	$('#comfy-url-input').on('input', function () {
		const url = ($(this).val() as string) || DEFAULT_COMFY_URL;
		saveSetting('comfyUrl', url);
		// 同步到主站全局设置（与 stable-diffusion 一致）
		const w = window as any;
		if (w.extension_settings && w.extension_settings.sd) {
			w.extension_settings.sd.comfy_url = url;
			if (typeof w.saveSettingsDebounced === 'function') {
				w.saveSettingsDebounced();
			}
		}
		// URL改变时不自动刷新选项，需要用户手动点击连接按钮
		// populateComfyOptions();
        // 同时刷新工作流列表
        updateWorkflowSelect();
	});

	// 连接按钮
	$('#comfy-validate-btn').on('click', function () {
		validateComfyUrl();
	});

	// OpenAI 兼容 API 配置
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

	// ComfyUI 工作流管理
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

	// 占位符配置项事件处理
	// 采样方法、调度器、模型、VAE、分辨率
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
		saveSetting('sd_resolution', $(this).val());
	});

	// 采样步数、CFG缩放滑块
	setupRangeSliderScoped('sd_steps', 'sd_steps_value', 'sd_steps');
	setupRangeSliderScoped('sd_scale', 'sd_scale_value', 'sd_scale');

	// 宽度、高度滑块
	setupRangeSliderScoped('sd_width', 'sd_width_value', 'sd_width');
	setupRangeSliderScoped('sd_height', 'sd_height_value', 'sd_height');

	// 去噪强度、CLIP Skip滑块
	setupRangeSliderScoped('sd_denoising_strength', 'sd_denoising_strength_value', 'sd_denoising_strength');
	setupRangeSliderScoped('sd_clip_skip', 'sd_clip_skip_value', 'sd_clip_skip');

	// 种子输入
	$root.find('#sd_seed').on('input', function () {
		const seed = parseInt($(this).val() as string) || -1;
		saveSetting('sd_seed', seed);
	});

    // 提示词前缀和负面提示词输入
    $root.find('#sd_prompt_prefix').on('input', function () {
        const prefix = $(this).val() as string;
        saveSetting('sd_prompt_prefix', prefix);
    });
    $root.find('#sd_negative_prompt').on('input', function () {
        const negative = $(this).val() as string;
        saveSetting('sd_negative_prompt', negative);
	});

	// 交换宽度和高度按钮
	$root.find('#sd_swap_dimensions').on('click', function () {
		const widthSlider = $root.find('#sd_width');
		const heightSlider = $root.find('#sd_height');
		const widthValue = widthSlider.val() as string;
		const heightValue = heightSlider.val() as string;
		widthSlider.val(heightValue);
		heightSlider.val(widthValue);
		$root.find('#sd_width_value').val(heightValue);
		$root.find('#sd_height_value').val(widthValue);
		saveSetting('sd_width', heightValue);
		saveSetting('sd_height', widthValue);
	});

	// 初始化设置（loadSettings内部会调用populateComfyOptions）
    await loadSettings();

	// 标签逻辑
	$('#tig-tab-basic').on('click', function () {
		$('#tab-basic-content').show();
		$('#tab-api-content').hide();
	});
	$('#tig-tab-api').on('click', function () {
		$('#tab-basic-content').hide();
		$('#tab-api-content').show();
	});

	// 预设选项卡切换逻辑
	$('#preset-tab-builtin').on('click', function () {
		$('.preset-tab').removeClass('active');
		$(this).addClass('active');
		$('#builtin-preset-content').show();
		$('#external-preset-content').hide();
		saveSetting('presetType', 'builtin');
	});

	$('#preset-tab-external').on('click', function () {
		$('.preset-tab').removeClass('active');
		$(this).addClass('active');
		$('#builtin-preset-content').hide();
		$('#external-preset-content').show();
		saveSetting('presetType', 'external');
		// 切换到外部预设时自动加载SillyTavern预设
		loadSillyTavernPresets();
	});

	// 外部预设来源选择
	$('#external-preset-source').on('change', function () {
		const source = $(this).val() as string;
		saveSetting('externalPresetSource', source);

		if (source === 'sillytavern') {
			$('#sillytavern-preset-container').show();
			loadSillyTavernPresets();
		} else {
			$('#sillytavern-preset-container').hide();
		}
	});

	// 刷新SillyTavern预设
	$('#refresh-sillytavern-presets').on('click', function () {
		loadSillyTavernPresets();
	});

	// SillyTavern预设选择
	$('#sillytavern-preset-select').on('change', function () {
		const preset = $(this).val() as string;
		saveSetting('selectedSillyTavernPreset', preset);
		if (preset) {
			loadSillyTavernPresetContent(preset);
		}
	});
}
