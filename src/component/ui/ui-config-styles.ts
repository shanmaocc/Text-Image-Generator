/**
 * 样式管理模块
 */

import { getExtensionRoot } from '../../utils/dom-utils';
import type { Style } from '../types';

/**
 * 样式存储类型
 */
type StyleStore = Record<string, Style>;

/**
 * 保存样式
 */
export function saveStyle(): void {
    const styleName = prompt('请输入样式名称');
    if (!styleName) return;

    const $root = getExtensionRoot();
    const promptPrefix = ($root.find('#prompt-prefix-textarea').val() as string) || '';
    const negativePrompt = ($root.find('#negative-prompt-textarea').val() as string) || '';

    const styles = getStyles();
    styles[styleName] = {
        promptPrefix,
        negativePrompt,
    };

    localStorage.setItem('textToPicStyles', JSON.stringify(styles));
    updateStyleSelect();
    toastr.success('样式保存成功');
}

/**
 * 删除样式
 */
export function deleteStyle(): void {
    const $root = getExtensionRoot();
    const selectedStyle = ($root.find('#style-select').val() as string) || '';
    if (!selectedStyle) {
        toastr.warning('请先选择一个样式');
        return;
    }

    if (confirm(`确定要删除样式 "${selectedStyle}" 吗？`)) {
        const styles = getStyles();
        delete styles[selectedStyle];
        localStorage.setItem('textToPicStyles', JSON.stringify(styles));
        updateStyleSelect();
        toastr.success('样式删除成功');
    }
}

/**
 * 获取样式
 */
export function getStyles(): StyleStore {
    try {
        const saved = localStorage.getItem('textToPicStyles');
        return saved ? JSON.parse(saved) : {};
    } catch (error) {
        logger.warn('Failed to load styles from localStorage:', error);
        return {};
    }
}

/**
 * 更新样式选择器
 */
export function updateStyleSelect(): void {
    const styles = getStyles();
    const $root = getExtensionRoot();
    const styleSelect = $root.find('#style-select');

    styleSelect.empty();
    styleSelect.append('<option value="">无样式</option>');

    Object.keys(styles).forEach(styleName => {
        styleSelect.append(`<option value="${styleName}">${styleName}</option>`);
    });
}
