/**
 * 日志工具模块
 * 提供插件专属的日志实例，避免与其他插件冲突
 */

import logFactory from 'loglevel';

/**
 * 插件专属日志实例
 *
 * 为什么使用独立的日志实例？
 * - SillyTavern 的多个插件可能都会设置 globalThis.log
 * - 不同插件可能有不同的日志级别需求
 * - 使用 logger.getLogger() 创建命名日志器，可以独立控制日志级别
 *
 * 使用方法：
 * ```typescript
 * import { logger } from '@/utils/logger';
 *
 * logger.debug('调试信息');
 * logger.info('常规信息');
 * logger.warn('警告信息');
 * logger.error('错误信息');
 * ```
 */
export const logger = logFactory.getLogger('Text-Image-Generator');

/**
 * 设置日志级别
 * @param level 日志级别
 */
export function setLogLevel(level: logFactory.LogLevelDesc): void {
    logger.setLevel(level);
}

/**
 * 获取当前日志级别名称
 */
export function getLogLevelName(): string {
    const levelNames = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'SILENT'];
    return levelNames[logger.getLevel()] || 'UNKNOWN';
}
