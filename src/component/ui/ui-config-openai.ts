import { getRequestHeaders } from '@sillytavern/script';
import log from '../logger';
import { getSettings, saveSetting, UISettings } from '../services/ui-manager';

/**
 * 刷新OpenAI模型列表
 */
export async function refreshOpenAIModels(): Promise<void> {
    try {
        const settings = getSettings();
        let req = {
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
            .map((m: any) => m?.id)
            .filter((v: any) => typeof v === 'string');

        const metaText = `已加载 ${modelIds.length} 个可用模型`;
        const select = $('#openai-model-select');
        select.empty();
        select.append('<option value="">-- 选择模型 --</option>');
        modelIds.forEach((id: string) => select.append(`<option value="${id}">${id}</option>`));
        $('#openai-models-meta').text(metaText);

        const cur = settings.openaiModel;
        if (cur) select.val(cur);

        toastr.success(`成功加载 ${modelIds.length} 个模型`);
    } catch (err: any) {
        toastr.error(`刷新模型列表异常：${err?.message || '网络错误'}`);
        log.error('Failed to refresh OpenAI models:', err);
    }
}

/**
 * 填充OpenAI模型下拉框
 */
export function populateOpenAIModels(settings: UISettings): void {
    const select = $('#openai-model-select');
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
    $('#openai-models-meta').text('已加载 0 个可用模型');
}
