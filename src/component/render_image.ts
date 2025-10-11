import {
    appendMediaToMessage,
    event_types,
    getRequestHeaders,
    saveChat,
    settings
} from '@sillytavern/script';
import { humanizedDateTime } from '@sillytavern/scripts/RossAscends-mods';
import getContext from '@sillytavern/scripts/st-context';
import { saveBase64AsFile } from '@sillytavern/scripts/utils';
import { Presets } from './config';
import { APP_CONSTANTS } from './config/constants';
import { stopComfyGeneration } from './services/api-service';
import { getSettings } from './services/ui-manager';
import { getSelectedWorkflow } from './services/workflow-manager';
import { AIMessage, callSillyTavernOpenAI } from './uitls';

//部分渲染事件
export const partialRenderEvents = [
    event_types.CHARACTER_MESSAGE_RENDERED, //角色消息渲染
    //event_types.USER_MESSAGE_RENDERED,//用户消息渲染（如需对用户消息也加按钮可开启）
    //event_types.MESSAGE_UPDATED,//消息更新（编辑/再生成等）
    event_types.MESSAGE_SWIPED,//消息滑动(切换)
];

//渲染模式
const RENDER_MODES = {
    FULL: 'FULL',
    PARTIAL: 'PARTIAL',
};

// 延迟检查主站是否在生成中（默认延迟100ms）
async function isMainGeneratingDelayed(delayMs: number = 0): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    const value = (document?.body as HTMLElement | undefined)?.dataset?.generating;
    return value === 'true';
}

/**
 * 设置删除监听器(消息中删除图片弹窗，两个按钮)
 * 监听删除图片操作
 */
function setupDeleteListener(): void {
    // 仅在聊天区域内委托监听（减少事件负载）
    $(document).on('click', function (event) {
        const target = event.target as unknown as HTMLElement;
        if (!target || target.nodeType !== Node.ELEMENT_NODE) return;
        const $target = $(target);
        const text = $target.text().toLowerCase();
        if (text.includes('delete one') || text.includes('delete all')) {
            setTimeout(() => {
                checkAndAddButtonsForDeletedImages();
            }, 400);
        }
    });
}

/**
 * 检查并添加按钮
 * 只检查最近的消息，减少性能开销
 */
function checkAndAddButtonsForDeletedImages(): void {
    const chatContainer = $('#chat');
    // 只检查最近的消息（最后20条），减少检查范围
    const recentMessages = chatContainer.find('.mes').slice(-20);
    recentMessages.each((index, element) => {
        const $message = $(element);
        const mesId = $message.attr('mesid');
        const isUserMessage =
            $message.attr('is_user') === 'true' || $message.hasClass('user-message');
        if (!isUserMessage && mesId) {
            const $imgContainer = $message.find('.mes_img_container');
            // 检查容器是否被隐藏且没有生成按钮
            if (
                $imgContainer.length > 0 &&
                $imgContainer.is(':hidden') &&
                !$message.find('.generate-image-btn').length
            ) {
                addGenerateImageButton($message, $imgContainer, mesId);
            }
        }
    });
}

/**
 * 创建生成图片按钮的HTML
 */
function createGenerateButtonHTML(mesId: string): string {
    return `
        <button class="generate-image-btn" data-mes-id="${mesId}">
            <span class="btn-text">生成图片</span>
            <i class="fa-solid fa-spinner fa-spin btn-loading" style="display:none;margin-left:8px;"></i>
        </button>
    `;
}

function createStopButtonHTML(mesId: string): string {
    return `
        <button class="stop-image-btn" data-mes-id="${mesId}" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); border: none; border-radius: 4px; color: white; padding: 4px 8px; font-size: 11px; font-weight: 500; cursor: pointer; transition: 0.3s; box-shadow: rgba(255, 107, 107, 0.3) 0px 1px 4px; margin: 4px 0px 4px 8px; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; vertical-align: middle;">
            <i class="fa-solid fa-stop" style="font-size: 10px;"></i>
            <span>停止</span>
        </button>
    `;
}

/**
 * 应用按钮样式
 */
function applyButtonStyles($button: JQuery): void {
    $button.css({
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        'border-radius': '8px',
        color: 'white',
        padding: '8px 16px',
        'font-size': '14px',
        'font-weight': '500',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        'box-shadow': '0 2px 8px rgba(102, 126, 234, 0.3)',
        margin: '8px 0',
        display: 'inline-flex',
        'flex-direction': 'row',
        'align-items': 'center',
        gap: '8px',
        'white-space': 'nowrap',
    });
}

/**
 * 设置按钮悬停效果
 */
function setupButtonHoverEffects($button: JQuery): void {
    $button.hover(
        function () {
            $(this).css({
                transform: 'translateY(-2px)',
                'box-shadow': '0 4px 12px rgba(102, 126, 234, 0.4)',
            });
        },
        function () {
            $(this).css({
                transform: 'translateY(0)',
                'box-shadow': '0 2px 8px rgba(102, 126, 234, 0.3)',
            });
        }
    );
}


/**
 * 生成ComfyUI提示词
 */
async function generateComfyPromptFromMessage(mesId: string, abortSignal?: AbortSignal): Promise<string> {
    const startTime = Date.now();
    console.log('🤖 开始AI提示词生成...');

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

    // 构建完整的系统指令
    const systemInstruction = Presets.system_prompt;

    const messages: AIMessage[] = [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: rawText },
    ];

    // 使用SillyTavern的API代理，而不是直接访问外部URL
    const prompt = await callSillyTavernOpenAI(messages, settings, abortSignal);
    const cleaned = (prompt || '').trim();
    if (!cleaned) {
        throw new Error('AI 未返回有效提示词');
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`✅ AI提示词生成完成，耗时: ${duration}秒`);

    return cleaned;
}

/**
 * 调用ComfyUI生成图片
 */
async function callComfyUIGenerate(positivePrompt: string, negativePrompt: string, abortSignal?: AbortSignal): Promise<any> {
    const startTime = Date.now();
    console.log('🖼️ 开始图片生成...');

    const dynamicWorkflow = await getSelectedWorkflow();

    if (!dynamicWorkflow) {
        throw new Error('未选择工作流，请先在设置中选择一个工作流');
    }

    // 替换正向提示词和负面提示词
    const workflowStr = JSON.stringify(dynamicWorkflow);

    let finalWorkflow = workflowStr
        .replace(/%prompt%/g, positivePrompt)
        .replace(/%negative_prompt%/g, negativePrompt);

    const finalWorkflowObj = JSON.parse(finalWorkflow);

    // 使用默认ComfyUI URL如果用户没有配置
    const comfyUrl = settings.comfyUrl || APP_CONSTANTS.DEFAULT_COMFY_URL;
    if (!comfyUrl) {
        throw new Error('请先在设置中配置ComfyUI URL');
    }

    const requestBody = {
        url: comfyUrl,
        prompt: `{
            "prompt": ${JSON.stringify(finalWorkflowObj)}
        }`, // 按照官方插件格式包装工作流
    };

    // 先测试ComfyUI连接
    try {
        const testUrl = `${comfyUrl}/system_stats`;
        const proxyUrl = `/proxy/${encodeURIComponent(testUrl)}`;
        await fetch(proxyUrl, { method: 'GET' });
    } catch (error) {
        log.error(`ComfyUI连接测试失败:`, error);
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
        log.error(`ComfyUI API错误 - 状态码: ${promptResult.status}`);
        log.error(`错误响应内容: ${text}`);

        // 尝试解析错误响应
        try {
            const errorData = JSON.parse(text);
            log.error(`解析后的错误数据:`, errorData);
        } catch (e) {
            log.error(`无法解析错误响应为JSON: ${e}`);
        }

        throw new Error(`ComfyUI API错误 (${promptResult.status}): ${text}`);
    }

    const result = await promptResult.json();
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`✅ 图片生成完成，耗时: ${duration}秒`);

    return result;
}

/**
 * 保存生成的图片
 */
async function saveGeneratedImage(result: any, positivePrompt: string, mesId: string): Promise<void> {
    const context = getContext();
    const characterName: string = context.groupId
        ? Object.values(context.groups)
            .find((g: any) => g.id === context.groupId)
            ?.name?.toString()
        : context.characterId
            ? (context.characters as any)[context.characterId]?.name
            : undefined;
    const filename = `${characterName}_${humanizedDateTime()}`;
    const uploadImagePath = await saveBase64AsFile(
        result.data,
        characterName,
        filename,
        result.format
    );

    // 直接更新消息的 extra 数据，然后调用 appendMediaToMessage
    const message = context.chat[parseInt(mesId)];
    const $message = $(`[mesid="${mesId}"]`);

    if (!message.extra) {
        message.extra = {};
    }

    message.extra.image = uploadImagePath;
    message.extra.title = positivePrompt;
    message.extra.inline_image = true;

    // 调用 SillyTavern 的 appendMediaToMessage 函数来正确显示图片
    appendMediaToMessage(message, $message);

    // 生成成功后，完全移除生成按钮和停止按钮
    $(`.generate-image-btn[data-mes-id="${mesId}"]`).remove();
    $(`.stop-image-btn[data-mes-id="${mesId}"]`).remove();

    saveChat();
}

// 全局变量用于跟踪生成状态
let isGenerating = false;
let currentGenerationAbortController: AbortController | null = null;

/**
 * 统一的生成图片按钮点击处理函数
 * 根据当前状态决定是开始生成还是中止生成
 */
export async function handleGenerateImageButtonClick(this: HTMLElement): Promise<void> {
    console.log('🖼️ 生成图片按钮被点击');
    const $btn = $(this);
    const $btnText = $btn.find('.btn-text');
    const $btnLoading = $btn.find('.btn-loading');

    // 检查当前状态
    const isCurrentlyGenerating = $btn.hasClass('generating') || isGenerating;

    if (isCurrentlyGenerating) {
        // 如果正在生成，处理中止逻辑
        await handleAbortGeneration($btn);
    } else {
        // 如果没有在生成，开始生成
        await handleStartGeneration($btn);
    }
}

/**
 * 处理开始生成图片
 */
async function handleStartGeneration($btn: JQuery): Promise<void> {
    const $btnText = $btn.find('.btn-text');
    const $btnLoading = $btn.find('.btn-loading');

    console.log('🚀 开始生成图片...');

    // 开始生成
    isGenerating = true;
    currentGenerationAbortController = new AbortController();

    $btn.addClass('generating');
    $btnText.text('生成中...');
    $btnLoading.show();
    $btn.prop('disabled', true).addClass('disabled');

    // 添加停止按钮
    const currentMesId = $btn.data('mes-id');
    const $stopButton = $(createStopButtonHTML(currentMesId));
    $btn.after($stopButton);

    // 绑定停止按钮点击事件
    $stopButton.on('click', async function() {
        log.info('停止按钮被点击');
        await abortCurrentGeneration();
        $stopButton.remove(); // 移除停止按钮
        // 不显示任何提示，因为这是用户主动操作
    });

    try {
        // 生成 ComfyUI 提示词
        const currentMesId = $btn.data('mes-id');
        const aiGeneratedPrompt = await generateComfyPromptFromMessage(currentMesId, currentGenerationAbortController?.signal);

        // 检查是否被中止
        if (currentGenerationAbortController?.signal.aborted) {
            throw new Error('生成被用户中止');
        }

        // 从配置中获取正负提示词
        const settings = getSettings();
        const promptPrefix = settings.sd_prompt_prefix || '';
        const negativePromptPrefix = settings.sd_negative_prompt || '';

        // 构建最终提示词
        const positivePrompt = promptPrefix + aiGeneratedPrompt;
        const negativePrompt = negativePromptPrefix;

        // 调用ComfyUI生成图片
        const result = await callComfyUIGenerate(positivePrompt, negativePrompt, currentGenerationAbortController?.signal);

        // 检查是否被中止
        if (currentGenerationAbortController?.signal.aborted) {
            throw new Error('生成被用户中止');
        }

        // 保存生成的图片
        await saveGeneratedImage(result, positivePrompt, currentMesId);

        // 生成成功，恢复按钮状态
        resetButtonState($btn);

    } catch (error) {
        log.error(`消息 ${$btn.data('mes-id')} 图片生成失败:`, error);

        // 任何错误都要恢复按钮状态
        resetButtonState($btn);

        // 显示错误提示
        if (error instanceof Error && error.message === '生成被用户中止') {
            // 用户主动停止，显示友好的提示
            toastr.info('图片生成已终止', '', { timeOut: 2000 });
        } else {
            toastr.error(`图片生成失败: ${error instanceof Error ? error.message : '未知错误'}`, '', { timeOut: 5000 });
        }
    }
}

/**
 * 处理中止生成图片
 */
async function handleAbortGeneration($btn: JQuery): Promise<void> {
    console.log('⏹️ 检测到正在生成，显示中止确认对话框');

    const shouldAbort = await showAbortConfirmation();

    if (shouldAbort) {
        console.log('⏹️ 用户选择中止，调用中止函数');
        await abortCurrentGeneration();
    } else {
        console.log('▶️ 用户选择继续生成');
    }
}

/**
 * 显示中止确认弹窗
 */
async function showAbortConfirmation(): Promise<boolean> {
    // 暂时使用浏览器原生确认对话框进行测试
    const result = confirm('图片正在生成中，是否要中止当前生成？');
    return result;
}

/**
 * 中止当前生成
 */
async function abortCurrentGeneration(): Promise<void> {
    try {
        // 1. 中止 HTTP 请求
        if (currentGenerationAbortController) {
            currentGenerationAbortController.abort();
            currentGenerationAbortController = null;
        }

        // 2. 调用 ComfyUI 停止 API（静默处理，不显示错误）
        const settings = getSettings();
        if (settings.comfyUrl) {
            try {
                await stopComfyGeneration({ comfyUrl: settings.comfyUrl });
                console.log('✅ ComfyUI generation stopped successfully');
            } catch (error) {
                // 用户手动停止时，静默处理 ComfyUI 停止失败的情况
                console.log('ℹ️ ComfyUI stop request completed (may have already stopped)');
            }
        }

        isGenerating = false;

        // 3. 恢复所有生成按钮的状态
        $('.generate-image-btn.generating').each(function() {
            resetButtonState($(this));
        });

        // 4. 移除所有停止按钮
        $('.stop-image-btn').remove();
    } catch (error) {
        log.error('Error during abort:', error);
        // 确保按钮状态被恢复
        isGenerating = false;
        $('.generate-image-btn.generating').each(function() {
            resetButtonState($(this));
        });
    }
}

/**
 * 恢复按钮状态
 */
function resetButtonState($btn: JQuery): void {
    const $btnText = $btn.find('.btn-text');
    const $btnLoading = $btn.find('.btn-loading');

    $btn.removeClass('generating');
    $btnText.text('生成图片').show();
    $btnLoading.hide();
    $btn.prop('disabled', false).removeClass('disabled');

    // 移除停止按钮
    $btn.siblings('.stop-image-btn').remove();

    isGenerating = false;
    currentGenerationAbortController = null;
}

// 添加生成图片按钮
function addGenerateImageButton($message: JQuery, $imgContainer: JQuery, mesId: string): void {
    // 创建按钮
    const $button = $(createGenerateButtonHTML(mesId));

    // 应用样式
    applyButtonStyles($button);
    setupButtonHoverEffects($button);

    // 将按钮插入到图片容器之前
    $imgContainer.before($button);

    // 事件绑定在初始化时统一处理，这里不需要重复绑定
}

// "生成图片"按钮状态：不管有没有先删，然后没图再添加
export async function syncGenerateButtonStateForMessage($message: JQuery, mesId: string): Promise<void> {


    // 检查扩展是否启用
    const settings = getSettings();
    if (!settings.extensionEnabled) {
        log.info('扩展已禁用，移除所有生成按钮');
        const $ImageBtn = $message.find('.generate-image-btn');
        if ($ImageBtn.length) {
            $ImageBtn.remove();
        }
        return;
    }

    // 先删除已有的按钮
    const $ImageBtn = $message.find('.generate-image-btn');
    if ($ImageBtn.length) {
        $ImageBtn.remove();
    }

    // 若主站仍在流式生成中，暂不处理
    // 获取这个标志位延迟100ms
    if (await isMainGeneratingDelayed(1)) {
        return;
    }

    const $imgContainer = $message.find('.mes_img_container');
    if ($imgContainer.is(':visible')) {
        return;
    }
    addGenerateImageButton($message, $imgContainer, mesId);
}

/**
 * 聊天加载触发事件
 */
export const handleChatLoaded = async (): Promise<void> => {

    // 检查扩展是否启用
    const settings = getSettings();
    if (!settings.extensionEnabled) {
        return;
    }

    // 查找聊天消息容器
    const chatContainer = $('#chat');
    if (!chatContainer.length) {
        log.warn('未找到聊天容器');
        return;
    }

    // 先查找所有消息元素
    const allMessages: JQuery<HTMLElement> = chatContainer.find('.mes');

    // 从所有消息中筛选出AI消息（非用户消息）
    const aiMessages: JQuery<HTMLElement>[] = [];

    allMessages.each((index, element) => {
        const $message = $(element);
        // 获取消息ID
        const mesId = $message.attr('mesid');
        // 检查是否是用户消息
        const isUserMessage =
            $message.attr('is_user') === 'true' || $message.hasClass('user-message');
        if (!isUserMessage) {
            aiMessages.push($message);
            if (mesId !== undefined) {
                syncGenerateButtonStateForMessage($message, mesId);
            }
        }
    });

    // 设置删除监听器
    setupDeleteListener();
};

export const handlePartialRender = (mesId: string, type: string): void => {
    // 检查扩展是否启用
    const settings = getSettings();
    if (!settings.extensionEnabled) {
        return;
    }

    const $message = $(`[mesid="${mesId}"]`);
    if (!$message.length) return;
    const isUserMessage = $message.attr('is_user') === 'true' || $message.hasClass('user-message');
    if (isUserMessage) return;
    syncGenerateButtonStateForMessage($message, mesId);
};
