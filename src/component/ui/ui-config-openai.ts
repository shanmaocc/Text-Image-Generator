import { getRequestHeaders } from '@sillytavern/script';
// 使用全局 log 对象，无需导入
import { getSettings, UISettings } from '../services/ui-manager';
import { getExtensionRoot } from '../../utils/dom-utils';

/**
 * 刷新OpenAI模型列表
 */
export async function refreshOpenAIModels(): Promise<void> {
    try {
        const settings = getSettings();
        const req = {
            reverse_proxy: settings.openaiApiUrl,
            proxy_password: settings.openaiApiKey,
            chat_completion_source: settings.chat_completion_source,
        };
        const statusResp = await fetch('/api/backends/chat-completions/status', {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify(req),
            cache: 'no-cache',
        });
        if (!statusResp.ok) {
            const text = await statusResp.text().catch(() => '');
            throw new Error(text || statusResp.statusText);
        }

        const data = await statusResp.json();
        const models = Array.isArray(data?.data) ? data.data : [];
        const modelIds: string[] = models
            .map((m: unknown) => {
                if (m && typeof m === 'object' && 'id' in m) {
                    return (m as { id: unknown }).id;
                }
                return undefined;
            })
            .filter((v: unknown): v is string => typeof v === 'string');

        const metaText = `已加载 ${modelIds.length} 个可用模型`;
        const $root = getExtensionRoot();
        const select = $root.find('#openai-model-select');
        select.empty();
        select.append('<option value="">-- 选择模型 --</option>');
        modelIds.forEach((id: string) => select.append(`<option value="${id}">${id}</option>`));
        $root.find('#openai-models-meta').text(metaText);

        const cur = settings.openaiModel;
        if (cur) select.val(cur);

        toastr.success(`成功加载 ${modelIds.length} 个模型`);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '网络错误';
        toastr.error(`刷新模型列表异常：${errorMessage}`);
        logger.error('Failed to refresh OpenAI models:', err);
    }
}

/**
 * 填充OpenAI模型下拉框
 */
export function populateOpenAIModels(settings: UISettings): void {
    const $root = getExtensionRoot();
    const select = $root.find('#openai-model-select');
    if (!select.children().length) {
        select.append('<option value="">-- 选择模型 --</option>');
    }
    if (settings.openaiModel) {
        if (!select.find(`option[value="${settings.openaiModel}"]`).length) {
            select.append(
                `<option value="${settings.openaiModel}">${settings.openaiModel}</option>`
            );
        }
        select.val(settings.openaiModel);
    }
    $root.find('#openai-models-meta').text('已加载 0 个可用模型');
}
