import { appendMediaToMessage, getRequestHeaders, saveChat } from '@sillytavern/script';
import { humanizedDateTime } from '@sillytavern/scripts/RossAscends-mods';
import getContext from '@sillytavern/scripts/st-context';
import { saveBase64AsFile } from '@sillytavern/scripts/utils';
import type { ImageGenerationResult } from '../../@types';
import { Presets } from '../config';
import { APP_CONSTANTS } from '../config/constants';
import { stopComfyGeneration } from '../services/api-service';
import { getSettings } from '../services/ui-manager';
import { getSelectedWorkflow } from '../services/workflow-manager';
import { AIMessage } from '../types';
import { callSillyTavernOpenAI } from '../utils/openai-client';
import { createStopButtonHTML, resetButtonState } from './button-manager';

// 全局变量用于跟踪生成状态
let isGenerating = false;
let currentGenerationAbortController: AbortController | null = null;

/**
 * 生成ComfyUI提示词
 */
export async function generateComfyPromptFromMessage(
    mesId: string,
    abortSignal?: AbortSignal
): Promise<string> {
    const startTime = Date.now();

    const $message = $(`[mesid="${mesId}"]`);
    const rawText = $message.find('.mes_text').text().trim();
    if (!rawText) {
        throw new Error('未找到可用的消息文本');
    }
    const settings = getSettings();

    if (!settings.openaiApiUrl || !settings.openaiModel) {
        toastr.error('请先在 API 与模型 配置中设置 API URL 与 模型', '', { timeOut: 5000 });
        throw new Error('缺少 OpenAI 兼容 API 配置');
    }

    const systemInstruction = Presets.system_prompt;
    const messages: AIMessage[] = [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: rawText },
    ];

    const prompt = await callSillyTavernOpenAI(messages, settings, abortSignal);
    const cleaned = (prompt || '').trim();
    if (!cleaned) {
        throw new Error('AI 未返回有效提示词');
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    logger.info(`🤖 AI耗时: ${duration}s`);

    return cleaned;
}

/**
 * 调用ComfyUI生成图片
 */
export async function callComfyUIGenerate(
    positivePrompt: string,
    negativePrompt: string,
    abortSignal?: AbortSignal
): Promise<ImageGenerationResult> {
    const startTime = Date.now();

    const dynamicWorkflow = await getSelectedWorkflow();

    if (!dynamicWorkflow) {
        throw new Error('未选择工作流，请先在设置中选择一个工作流');
    }

    const workflowStr = JSON.stringify(dynamicWorkflow);
    const finalWorkflow = workflowStr
        .replace(/%prompt%/g, positivePrompt)
        .replace(/%negative_prompt%/g, negativePrompt);
    const finalWorkflowObj = JSON.parse(finalWorkflow);

    const settings = getSettings();
    const comfyUrl = settings.comfyUrl || APP_CONSTANTS.DEFAULT_COMFY_URL;
    if (!comfyUrl) {
        throw new Error('请先在设置中配置ComfyUI URL');
    }

    const requestBody = {
        url: comfyUrl,
        prompt: `{
            "prompt": ${JSON.stringify(finalWorkflowObj)}
        }`,
    };

    try {
        const testUrl = `${comfyUrl}/system_stats`;
        const proxyUrl = `/proxy/${encodeURIComponent(testUrl)}`;
        await fetch(proxyUrl, { method: 'GET' });
    } catch (error) {
        logger.error(`ComfyUI连接测试失败:`, error);
    }

    const fetchOptions: RequestInit = {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify(requestBody),
    };
    if (abortSignal) {
        fetchOptions.signal = abortSignal;
    }
    const promptResult = await fetch('/api/sd/comfy/generate', fetchOptions);

    if (!promptResult.ok) {
        const text = await promptResult.text();
        logger.error(`ComfyUI API错误 - 状态码: ${promptResult.status}`);
        logger.error(`错误响应内容: ${text}`);

        try {
            const errorData = JSON.parse(text);
            logger.error(`解析后的错误数据:`, errorData);
        } catch (e) {
            logger.error(`无法解析错误响应为JSON: ${e}`);
        }

        throw new Error(`ComfyUI API错误 (${promptResult.status}): ${text}`);
    }

    const result = await promptResult.json();
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    logger.info(`🎨 ComfyUI生图耗时: ${duration}s`);

    return result;
}

/**
 * 保存生成的图片到消息
 * @param result 图片生成结果
 * @param positivePrompt 使用的正面提示词
 * @param mesId 消息 ID
 */
export async function saveGeneratedImage(
    result: ImageGenerationResult,
    positivePrompt: string,
    mesId: string
): Promise<void> {
    const context = getContext();
    const characterName: string | undefined = context.groupId
        ? Object.values(context.groups)
              .find((g: { id?: string; name?: string }) => g.id === context.groupId)
              ?.name?.toString()
        : context.characterId !== undefined
          ? context.characters[context.characterId]?.name
          : undefined;
    const filename = `${characterName || 'generated'}_${humanizedDateTime()}`;
    const uploadImagePath = await saveBase64AsFile(
        result.data,
        characterName || '',
        filename,
        result.format
    );

    const message = context.chat[parseInt(mesId, 10)];
    const $message = $(`[mesid="${mesId}"]`);

    // 检查消息是否存在
    if (!message) {
        logger.error(`消息 ID ${mesId} 不存在`);
        return;
    }

    // 确保 extra 对象存在
    if (!message.extra) {
        message.extra = {};
    }

    // 设置图片相关属性（现在有完整的类型提示）
    message.extra.image = uploadImagePath;
    message.extra.title = positivePrompt;
    message.extra.inline_image = true;

    appendMediaToMessage(message, $message);

    $(`.generate-image-btn[data-mes-id="${mesId}"]`).remove();
    $(`.stop-image-btn[data-mes-id="${mesId}"]`).remove();

    saveChat();
}

/**
 * 处理开始生成图片
 */
export async function handleStartGeneration($btn: JQuery): Promise<void> {
    const $btnText = $btn.find('.btn-text');
    const $btnLoading = $btn.find('.btn-loading');

    logger.info('Starting image generation process...');

    isGenerating = true;
    currentGenerationAbortController = new AbortController();

    $btn.addClass('generating');
    $btnText.text('生成中...');
    $btnLoading.show();
    $btn.prop('disabled', true).addClass('disabled');

    const currentMesId = $btn.data('mes-id');
    const $stopButton = $(createStopButtonHTML(currentMesId));
    $btn.after($stopButton);

    $stopButton.on('click', async function () {
        logger.info('停止按钮被点击');
        await abortCurrentGeneration();
        $stopButton.remove();
    });

    try {
        const aiGeneratedPrompt = await generateComfyPromptFromMessage(
            currentMesId,
            currentGenerationAbortController?.signal
        );

        if (currentGenerationAbortController?.signal.aborted) {
            throw new Error('生成被用户中止');
        }

        const settings = getSettings();
        const promptPrefix = settings.sd_prompt_prefix || '';
        const negativePromptPrefix = settings.sd_negative_prompt || '';

        const positivePrompt = promptPrefix + aiGeneratedPrompt;
        const negativePrompt = negativePromptPrefix;

        const result = await callComfyUIGenerate(
            positivePrompt,
            negativePrompt,
            currentGenerationAbortController?.signal
        );

        if (currentGenerationAbortController?.signal.aborted) {
            throw new Error('生成被用户中止');
        }

        await saveGeneratedImage(result, positivePrompt, currentMesId);

        isGenerating = false;
        resetButtonState($btn);
    } catch (error) {
        logger.error(`消息 ${$btn.data('mes-id')} 图片生成失败:`, error);

        isGenerating = false;
        resetButtonState($btn);

        if (error instanceof Error && error.message === '生成被用户中止') {
            toastr.info('图片生成已终止', '', { timeOut: 2000 });
        } else {
            toastr.error(
                `图片生成失败: ${error instanceof Error ? error.message : '未知错误'}`,
                '',
                { timeOut: 5000 }
            );
        }
    }
}

/**
 * 处理中止生成图片
 */
export async function handleAbortGeneration($btn: JQuery): Promise<void> {
    logger.info('Aborting generation...');
    await abortCurrentGeneration();
    resetButtonState($btn);
}

/**
 * 中止当前生成
 */
export async function abortCurrentGeneration(): Promise<void> {
    try {
        if (currentGenerationAbortController) {
            currentGenerationAbortController.abort();
            currentGenerationAbortController = null;
        }

        const settings = getSettings();
        if (settings.comfyUrl) {
            try {
                await stopComfyGeneration({ comfyUrl: settings.comfyUrl });
                logger.info('ComfyUI generation stopped successfully');
            } catch (error) {
                logger.info('ComfyUI stop request completed');
            }
        }

        isGenerating = false;

        $('.generate-image-btn.generating').each(function () {
            resetButtonState($(this));
        });

        $('.stop-image-btn').remove();
    } catch (error) {
        logger.error('Error during abort:', error);
        isGenerating = false;
        $('.generate-image-btn.generating').each(function () {
            resetButtonState($(this));
        });
    }
}

export function getGenerationState() {
    return { isGenerating, currentGenerationAbortController };
}
