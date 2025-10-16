/**
 * 样式管理模块
 */

/**
 * 保存样式
 */
export function saveStyle(): void {
    const styleName = prompt('请输入样式名称:');
    if (!styleName) return;

    const promptPrefix = $('#prompt-prefix-textarea').val() as string;
    const negativePrompt = $('#negative-prompt-textarea').val() as string;

    const styles = getStyles();
    styles[styleName] = {
        promptPrefix,
        negativePrompt,
    };

    localStorage.setItem('textToPicStyles', JSON.stringify(styles));
    updateStyleSelect();
    alert('样式保存成功！');
}

/**
 * 删除样式
 */
export function deleteStyle(): void {
    const selectedStyle = $('#style-select').val() as string;
    if (!selectedStyle) {
        alert('请先选择一个样式');
        return;
    }

    if (confirm(`确定要删除样式 "${selectedStyle}" 吗？`)) {
        const styles = getStyles();
        delete styles[selectedStyle];
        localStorage.setItem('textToPicStyles', JSON.stringify(styles));
        updateStyleSelect();
        alert('样式删除成功！');
    }
}

/**
 * 获取样式
 */
export function getStyles(): Record<string, any> {
    const saved = localStorage.getItem('textToPicStyles');
    return saved ? JSON.parse(saved) : {};
}

/**
 * 更新样式选择框
 */
export function updateStyleSelect(): void {
    const styles = getStyles();
    const styleSelect = $('#style-select');

    styleSelect.empty();
    styleSelect.append('<option value="">无样式</option>');

    Object.keys(styles).forEach(styleName => {
        styleSelect.append(`<option value="${styleName}">${styleName}</option>`);
    });
}
