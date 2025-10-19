/**
 * 安全工具模块
 * 提供 XSS 防护、API 密钥保护等安全功能
 */

/**
 * HTML 转义工具 - 防止 XSS 攻击
 * @param unsafe 不安全的字符串
 * @returns 转义后的安全字符串
 */
export function escapeHtml(unsafe: string): string {
    const div = document.createElement('div');
    div.textContent = unsafe;
    return div.innerHTML;
}

/**
 * 安全地转义 HTML 属性值
 * @param value 属性值
 * @returns 转义后的安全属性值
 */
export function safeAttr(value: string | number): string {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * 脱敏显示 API 密钥
 * @param key API 密钥
 * @returns 脱敏后的密钥显示
 */
export function maskApiKey(key: string): string {
    if (!key || key.length < 8) return '***';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

/**
 * 验证 API 密钥格式
 * @param key API 密钥
 * @returns 是否为有效格式
 */
export function validateApiKey(key: string): boolean {
    if (!key) return false;

    // OpenAI 格式：sk-xxx
    if (key.startsWith('sk-')) {
        return key.length >= 20;
    }

    // Anthropic 格式：sk-ant-xxx
    if (key.startsWith('sk-ant-')) {
        return key.length >= 30;
    }

    // 其他格式的基本检查
    return key.length >= 16;
}

/**
 * 清理日志中的敏感信息
 * @param data 要记录的数据
 * @returns 清理后的数据
 */
export function sanitizeForLog(data: unknown): unknown {
    if (typeof data === 'string') {
        // 替换各种 API 密钥格式
        return data
            .replace(/sk-[a-zA-Z0-9_-]{32,}/g, 'sk-***')
            .replace(/sk-ant-[a-zA-Z0-9_-]{32,}/g, 'sk-ant-***')
            .replace(/Bearer\s+[a-zA-Z0-9_-]{20,}/gi, 'Bearer ***');
    }

    if (Array.isArray(data)) {
        return data.map(item => sanitizeForLog(item));
    }

    if (typeof data === 'object' && data !== null) {
        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(data)) {
            const lowerKey = key.toLowerCase();
            // 脱敏字段：key, token, password, secret
            if (
                lowerKey.includes('key') ||
                lowerKey.includes('token') ||
                lowerKey.includes('password') ||
                lowerKey.includes('secret')
            ) {
                sanitized[key] = typeof value === 'string' ? maskApiKey(value) : '***';
            } else {
                sanitized[key] = sanitizeForLog(value);
            }
        }
        return sanitized;
    }

    return data;
}

/**
 * 安全的 JSON 解析
 * @param text JSON 文本
 * @param fallback 解析失败时的默认值
 * @returns 解析结果或默认值
 */
export function safeJsonParse<T>(text: string, fallback: T): T {
    try {
        return JSON.parse(text) as T;
    } catch {
        logger.warn('JSON 解析失败，使用默认值');
        return fallback;
    }
}

/**
 * 安全的 JSON 字符串化
 * @param data 要序列化的数据
 * @param fallback 序列化失败时的默认值
 * @returns JSON 字符串或默认值
 */
export function safeJsonStringify(data: unknown, fallback: string = '{}'): string {
    try {
        return JSON.stringify(data);
    } catch {
        logger.warn('JSON 序列化失败，使用默认值');
        return fallback;
    }
}
