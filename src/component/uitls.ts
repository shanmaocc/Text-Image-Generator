/**
 * 表示单条AI消息的接口
 */
export interface AIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

/**
 * OpenAI兼容API请求参数接口
 */
export interface OpenAICompatibleOptions {
    apiUrl: string; // OpenAI兼容API的根地址
    apiKey: string; // 用于认证的API密钥
    model: string; // 使用的模型名称
    maxTokens?: number; // 最大生成token数（可选）
    temperature?: number; // 采样温度（可选）
    abortSignal?: AbortSignal; // 中止信号（可选）
}

/**
 * 调用OpenAI兼容API进行对话请求（直接访问）
 * @param messages 消息数组，包含对话历史
 * @param options  OpenAI兼容API请求参数
 * @returns        返回AI回复的内容字符串
 * @throws         请求失败时抛出异常
 */
export async function callOpenAICompatible(
    messages: AIMessage[],
    options: OpenAICompatibleOptions
): Promise<string> {
    // 规范化API地址，去除末尾斜杠和/v1
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
    settings: any,
    abortSignal?: AbortSignal
): Promise<string> {
    // 导入getRequestHeaders
    const { getRequestHeaders } = await import('@sillytavern/script');

    // 获取SillyTavern的请求头（包含CSRF token等）
    const requestHeaders = getRequestHeaders();

    // 使用SillyTavern的聊天生成API
    const requestBody = {
        reverse_proxy: settings.openaiApiUrl,
        proxy_password: settings.openaiApiKey || '', // 允许空密码，SillyTavern可能不需要
        chat_completion_source: settings.chat_completion_source || 'openai',
        model: settings.openaiModel,
        messages: messages,
        max_tokens: settings.openaiMaxTokens || 1000,
        temperature: settings.openaiTemperature || 0.7,
        stream: false,
        // 添加SillyTavern需要的其他参数
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

    // 使用SillyTavern的聊天生成端点
    const generate_url = '/api/backends/chat-completions/generate';

    try {
        const response = await fetch(generate_url, fetchOptions);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`SillyTavern OpenAI API请求失败: ${response.status} - ${errorText}`);
        }

        const responseData = await response.json();
        return responseData?.choices?.[0]?.message?.content ?? '';
    } catch (error) {
        console.error('API调用异常:', error);
        throw error;
    }
}
