/**
 * OpenAI API 客户端模块
 * 提供与 OpenAI 兼容 API 的交互功能
 */

import type { UISettings } from '../../@types';
import { AIMessage } from '../types';
import { sanitizeForLog } from './security';

/**
 * 调用OpenAI兼容API进行对话请求（直接访问）
 * @param messages 消息数组，包含对话历史
 * @param options  OpenAI兼容API请求参数
 * @returns        返回AI回复的内容字符串
 * @throws         请求失败时抛出异常
 */
export async function callOpenAICompatible(
    messages: AIMessage[],
    options: {
        apiUrl: string;
        apiKey: string;
        model: string;
        maxTokens?: number;
        temperature?: number;
        abortSignal?: AbortSignal;
    }
): Promise<string> {
    const baseUrl = options.apiUrl.replace(/\/$/, '').replace(/\/v1$/, '');
    const apiUrl = `${baseUrl}/v1/chat/completions`;
    const fetchOptions: RequestInit = {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${options.apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: options.model,
            messages: messages,
            max_tokens: options.maxTokens,
            temperature: options.temperature,
            stream: false,
        }),
    };

    if (options.abortSignal) {
        fetchOptions.signal = options.abortSignal;
    }

    const response = await fetch(apiUrl, fetchOptions);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI兼容API请求失败: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    return responseData?.choices?.[0]?.message?.content ?? '';
}

/**
 * 通过SillyTavern API代理调用OpenAI兼容API
 * @param messages 消息数组
 * @param settings 用户设置
 * @param abortSignal 中止信号
 * @returns AI回复内容
 */
export async function callSillyTavernOpenAI(
    messages: AIMessage[],
    settings: Pick<
        UISettings,
        | 'openaiApiUrl'
        | 'openaiApiKey'
        | 'openaiModel'
        | 'openaiMaxTokens'
        | 'openaiTemperature'
        | 'chat_completion_source'
    >,
    abortSignal?: AbortSignal
): Promise<string> {
    const { getRequestHeaders } = await import('@sillytavern/script');
    const requestHeaders = getRequestHeaders();

    const requestBody = {
        reverse_proxy: settings.openaiApiUrl,
        proxy_password: settings.openaiApiKey || '',
        chat_completion_source: settings.chat_completion_source || 'openai',
        model: settings.openaiModel,
        messages: messages,
        max_tokens: settings.openaiMaxTokens || 1000,
        temperature: settings.openaiTemperature || 0.7,
        stream: false,
        custom_prompt_post_processing: false,
    };

    const fetchOptions: RequestInit = {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
    };

    if (abortSignal) {
        fetchOptions.signal = abortSignal;
    }

    const generate_url = '/api/backends/chat-completions/generate';

    logger.debug('发送 OpenAI 请求:', sanitizeForLog(requestBody));

    const response = await fetch(generate_url, fetchOptions);

    if (!response.ok) {
        const errorText = await response.text();
        logger.error('OpenAI API 请求失败:', response.status, sanitizeForLog(errorText));
        throw new Error(`SillyTavern OpenAI API请求失败: ${response.status}`);
    }

    const responseData = await response.json();
    logger.debug('OpenAI 响应成功');
    return responseData?.choices?.[0]?.message?.content ?? '';
}
