// Text-Image-Generator 扩展 - 基础版本

import log from '@/component/logger';
import { EventManager } from '@/component/services/event-manager';
import { UIInitializer } from '@/component/services/ui-initializer';

/**
 * 初始化第三方挂载
 */
function initThirdPartyMount() {
    // 日志级别已在logger.ts中根据环境变量设置
    globalThis.log = log;
}

/**
 * 扩展初始化主函数
 */
async function initializeExtension() {
    log.info('Text-Image-Generator extension loading...');

    // 基础初始化
    initThirdPartyMount();

    // 创建并绑定事件
    const eventManager = new EventManager();
    eventManager.bindEvents();
    eventManager.exposeToGlobal();

    // 初始化UI
    const uiInitializer = new UIInitializer();
    await uiInitializer.initializeUI();

    log.info('Text-Image-Generator extension initialization completed');
}

// 扩展初始化
jQuery(initializeExtension);
