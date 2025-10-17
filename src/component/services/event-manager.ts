// 使用全局 log 对象，无需导入
import {
    handleChatLoaded,
    handleGenerateImageButtonClick,
    handlePartialRender,
    partialRenderEvents,
} from '../render_image';
import { getSettings } from './ui-manager';
import { eventSource } from '@sillytavern/script';

/**
 * 事件管理器 - 负责所有事件的绑定和管理
 */
export class EventManager {
    private eventHandlers: {
        chatLoaded: () => Promise<void>;
        partialRender: (mesId: string, type: string) => void;
    };

    constructor() {
        this.eventHandlers = this.createEventHandlers();
    }

    /**
     * 创建事件处理器
     */
    private createEventHandlers() {
        // 创建包装函数，检查扩展是否启用
        const wrappedHandleChatLoaded = async () => {
            const settings = getSettings();
            log.info(`Extension enabled: ${settings.extensionEnabled}`);
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

        log.info('All events bound successfully');
    }

    /**
     * 暴露事件处理器到全局
     */
    exposeToGlobal(): void {
        (window as any).textToPicEventHandlers = this.eventHandlers;
        log.info('Event handlers exposed to global scope');
    }

    /**
     * 获取事件处理器引用
     */
    getEventHandlers() {
        return this.eventHandlers;
    }
}
