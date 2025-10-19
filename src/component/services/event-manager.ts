import {
    handleChatLoaded,
    handleGenerateImageButtonClick,
    handlePartialRender,
    partialRenderEvents,
} from '../image-generation/event-handlers';
import { getSettings } from './ui-manager';
import { eventSource } from '@sillytavern/script';

// 使用全局 logger 对象，无需导入

/**
 * 事件处理器类型
 */
interface EventHandlers {
    chatLoaded: () => Promise<void>;
    partialRender: (mesId: string, type: string) => void;
}

/**
 * 扩展 Window 接口以支持自定义属性
 */
declare global {
    interface Window {
        textToPicEventHandlers?: EventHandlers;
    }
}

/**
 * 事件管理器 - 负责所有事件的绑定和管理
 */
export class EventManager {
    private eventHandlers: EventHandlers;

    constructor() {
        this.eventHandlers = this.createEventHandlers();
    }

    /**
     * 创建事件处理器
     */
    private createEventHandlers(): EventHandlers {
        // 创建包装函数，检查扩展是否启用
        const wrappedHandleChatLoaded = async () => {
            const settings = getSettings();
            logger.info(`Extension enabled: ${settings.extensionEnabled}`);
            if (settings.extensionEnabled) {
                await handleChatLoaded();
            }
        };

        const wrappedHandlePartialRender = (mesId: string, type: string) => {
            const settings = getSettings();
            if (settings.extensionEnabled) {
                handlePartialRender(mesId, type);
            }
        };

        return {
            chatLoaded: wrappedHandleChatLoaded,
            partialRender: wrappedHandlePartialRender,
        };
    }

    /**
     * 绑定所有事件
     */
    bindEvents(): void {
        // 绑定聊天加载事件
        eventSource.on('chatLoaded', this.eventHandlers.chatLoaded);

        // 绑定部分渲染事件
        partialRenderEvents.forEach((eventType: string) => {
            eventSource.on(eventType, this.eventHandlers.partialRender);
        });

        // 绑定生成图片按钮的点击事件（使用事件委托，只绑定一次）
        $(document).off('click', '.generate-image-btn');
        $(document).on('click', '.generate-image-btn', handleGenerateImageButtonClick);

        logger.info('All events bound successfully');
    }

    /**
     * 暴露事件处理器到全局
     */
    exposeToGlobal(): void {
        window.textToPicEventHandlers = this.eventHandlers;
        logger.info('Event handlers exposed to global scope');
    }

    /**
     * 获取事件处理器引用
     */
    getEventHandlers(): EventHandlers {
        return this.eventHandlers;
    }
}
