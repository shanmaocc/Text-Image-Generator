// Text-Image-Generator 扩展 - 基础版本

import log from '@/component/logger';
import {
    handleChatLoaded,
    handleGenerateImageButtonClick,
    handlePartialRender,
    partialRenderEvents,
} from '@/component/render_image';
import { getSettings } from '@/component/services/ui-manager';
import { initializeUI } from '@/component/ui-config';
import { eventSource } from '@sillytavern/script';
import { renderExtensionTemplateAsync } from '@sillytavern/scripts/extensions';

const extensionName = 'Text-Image-Generator';
const extensionFolderPath = `third-party/${extensionName}`;

function initThirdPartyMount() {
    // 设置日志级别为 info，让 info 级别可见
    log.setLevel('info');
    globalThis.log = log;
}

// 扩展初始化
jQuery(async () => {
    console.log('Text-Image-Generator 扩展加载中...');
    initThirdPartyMount();
    const getContainer = () => $('#extensions_settings');
    const windowHtml = await renderExtensionTemplateAsync(`${extensionFolderPath}`, 'index');
    getContainer().append(windowHtml);
    // 初始化界面功能
    await initializeUI();
    console.log('Text-Image-Generator 扩展界面已加载');
    // 创建包装函数，检查扩展是否启用
    const wrappedHandleChatLoaded = async () => {
        const settings = getSettings();
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

    // 存储事件处理器引用，以便后续清理
    const eventHandlers = {
        chatLoaded: wrappedHandleChatLoaded,
        partialRender: wrappedHandlePartialRender
    };

    // 绑定事件
    eventSource.on('chatLoaded', eventHandlers.chatLoaded); //聊天加载
    partialRenderEvents.forEach((eventType: string) => {
        eventSource.on(eventType, eventHandlers.partialRender); //部分渲染
    });

    // 绑定生成图片按钮的点击事件（使用事件委托，只绑定一次）
    $(document).off('click', '.generate-image-btn');
    $(document).on('click', '.generate-image-btn', handleGenerateImageButtonClick);

    // 将事件处理器暴露到全局，以便UI配置可以访问
    (window as any).textToPicEventHandlers = eventHandlers;
});
