// 使用全局 log 对象，无需导入
import { initializeUI } from '../ui/ui-config-core';
import { renderExtensionTemplateAsync } from '@sillytavern/scripts/extensions';

/**
 * UI初始化管理器 - 负责UI的初始化和渲染
 */
export class UIInitializer {
    private extensionName = 'Text-Image-Generator';
    private extensionFolderPath = `third-party/${this.extensionName}`;

    /**
     * 初始化UI
     */
    async initializeUI(): Promise<void> {
        logger.info('Initializing UI...');

        // 获取容器并渲染UI模板
        const getContainer = () => $('#extensions_settings');
        const windowHtml = await renderExtensionTemplateAsync(this.extensionFolderPath, 'index');
        getContainer().append(windowHtml);

        // 初始化界面功能
        initializeUI();

        logger.info('Text-Image-Generator extension UI loaded');
    }
}
