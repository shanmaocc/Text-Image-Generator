// Text-Image-Generator 扩展 - 基础版本

import logFactory from 'loglevel';
import { EventManager } from '@/component/services/event-manager';
import { UIInitializer } from '@/component/services/ui-initializer';
import { logger } from '@/utils/logger';

/**
 * 初始化第三方挂载
 */
function initThirdPartyMount() {
    // 设置插件专属日志级别
    const logLevel = (import.meta.env.VITE_LOG_LEVEL as logFactory.LogLevelDesc) || 'info';
    logger.setLevel(logLevel);

    globalThis.logger = logger;

    logger.info(`Text-Image-Generator 插件已加载，日志级别: ${logLevel}`);
}

/**
 * 扩展初始化主函数
 */
async function initializeExtension() {
    logger.info('Text-Image-Generator extension loading...');

    // 基础初始化
    initThirdPartyMount();

    // 创建并绑定事件
    const eventManager = new EventManager();
    eventManager.bindEvents();
    eventManager.exposeToGlobal();

    // 初始化UI
    const uiInitializer = new UIInitializer();
    await uiInitializer.initializeUI();

    logger.info('Text-Image-Generator extension initialization completed');
}

// 扩展初始化
jQuery(initializeExtension);
