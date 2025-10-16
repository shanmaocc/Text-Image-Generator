import { event_types } from '@sillytavern/script';
import log from '../logger';
import { getSettings } from '../services/ui-manager';
import { setupDeleteListener, syncGenerateButtonStateForMessage } from './button-manager';
import {
    getGenerationState,
    handleAbortGeneration,
    handleStartGeneration,
} from './image-generator';

/**
 * 部分渲染事件列表
 */
export const partialRenderEvents = [
    event_types.CHARACTER_MESSAGE_RENDERED,
    event_types.MESSAGE_SWIPED,
];

/**
 * 统一的生成图片按钮点击处理函数
 * 根据当前状态决定是开始生成还是中止生成
 */
export async function handleGenerateImageButtonClick(this: HTMLElement): Promise<void> {
    log.info('Generate image button clicked');
    const $btn = $(this);

    const { isGenerating } = getGenerationState();
    const isCurrentlyGenerating = $btn.hasClass('generating') || isGenerating;

    if (isCurrentlyGenerating) {
        await handleAbortGeneration($btn);
    } else {
        await handleStartGeneration($btn);
    }
}

/**
 * 聊天加载触发事件
 */
export const handleChatLoaded = async (): Promise<void> => {
    log.info('🔥 handleChatLoaded triggered');

    const settings = getSettings();
    log.info(`Extension enabled: ${settings.extensionEnabled}`);

    if (!settings.extensionEnabled) {
        log.info('Extension disabled, skipping button addition');
        return;
    }

    const chatContainer = $('#chat');
    if (!chatContainer.length) {
        log.warn('未找到聊天容器');
        return;
    }

    const allMessages: JQuery<HTMLElement> = chatContainer.find('.mes');
    log.info(`Found ${allMessages.length} total messages`);

    const aiMessages: JQuery<HTMLElement>[] = [];
    let processedCount = 0;

    allMessages.each((index, element) => {
        const $message = $(element);
        const mesId = $message.attr('mesid');
        const isUserMessage =
            $message.attr('is_user') === 'true' || $message.hasClass('user-message');
        if (!isUserMessage) {
            aiMessages.push($message);
            if (mesId !== undefined) {
                processedCount++;
                // 异步处理按钮，不等待完成
                syncGenerateButtonStateForMessage($message, mesId, settings.extensionEnabled);
            }
        }
    });

    log.info(`Processed ${processedCount} AI messages`);
    setupDeleteListener();
};

/**
 * 部分渲染事件处理
 */
export const handlePartialRender = (mesId: string, type: string): void => {
    const settings = getSettings();
    if (!settings.extensionEnabled) {
        return;
    }

    const $message = $(`[mesid="${mesId}"]`);
    if (!$message.length) return;
    const isUserMessage = $message.attr('is_user') === 'true' || $message.hasClass('user-message');
    if (isUserMessage) return;
    syncGenerateButtonStateForMessage($message, mesId, settings.extensionEnabled);
};
