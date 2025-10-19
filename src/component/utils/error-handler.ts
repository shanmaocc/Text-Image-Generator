// 错误处理工具模块

export interface ErrorInfo {
    message: string;
    code?: string | undefined;
    details?: unknown;
    timestamp: number;
}

/**
 * 错误类型枚举
 */
export enum ErrorType {
    NETWORK = 'NETWORK',
    API = 'API',
    VALIDATION = 'VALIDATION',
    WORKFLOW = 'WORKFLOW',
    UI = 'UI',
    UNKNOWN = 'UNKNOWN',
}

/**
 * 自定义错误类
 */
export class AppError extends Error {
    public readonly type: ErrorType;
    public readonly code?: string | undefined;
    public readonly details?: unknown;
    public readonly timestamp: number;

    constructor(
        message: string,
        type: ErrorType = ErrorType.UNKNOWN,
        code?: string | undefined,
        details?: unknown
    ) {
        super(message);
        this.name = 'AppError';
        this.type = type;
        this.code = code;
        this.details = details;
        this.timestamp = Date.now();
    }
}

/**
 * 错误处理器类
 */
export class ErrorHandler {
    private static instance: ErrorHandler;
    private errorLog: ErrorInfo[] = [];

    private constructor() {}

    public static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }

    /**
     * 处理错误
     */
    public handleError(error: Error | AppError, context?: string): void {
        const errorInfo: ErrorInfo = {
            message: error.message,
            code: error instanceof AppError ? error.code : undefined,
            details: error instanceof AppError ? error.details : undefined,
            timestamp: Date.now(),
        };

        // 记录错误日志
        this.errorlogger.push(errorInfo);
        logger.error(`[${context || 'Unknown'}] Error:`, errorInfo);

        // 显示用户友好的错误消�?        this.showUserError(error, context);
    }

    /**
     * 显示用户友好的错误消�?     */
    private showUserError(error: Error | AppError, _context?: string): void {
        let userMessage: string;

        if (error instanceof AppError) {
            switch (error.type) {
                case ErrorType.NETWORK:
                    userMessage = `网络连接失败�?{error.message}`;
                    break;
                case ErrorType.API:
                    userMessage = `API调用失败�?{error.message}`;
                    break;
                case ErrorType.VALIDATION:
                    userMessage = `输入验证失败�?{error.message}`;
                    break;
                case ErrorType.WORKFLOW:
                    userMessage = `工作流错误：${error.message}`;
                    break;
                case ErrorType.UI:
                    userMessage = `界面错误�?{error.message}`;
                    break;
                default:
                    userMessage = `未知错误�?{error.message}`;
            }
        } else {
            userMessage = `系统错误�?{error.message}`;
        }

        // 使用toastr显示错误消息
        if (typeof toastr !== 'undefined') {
            toastr.error(userMessage);
        } else {
            logger.error('Toastr 不可用，错误信息:', userMessage);
        }
    }

    /**
     * 获取错误日志
     */
    public getErrorLog(): ErrorInfo[] {
        return [...this.errorLog];
    }

    /**
     * 清空错误日志
     */
    public clearErrorLog(): void {
        this.errorLog = [];
    }

    /**
     * 创建网络错误
     */
    public static createNetworkError(message: string, details?: unknown): AppError {
        return new AppError(message, ErrorType.NETWORK, 'NETWORK_ERROR', details);
    }

    /**
     * 创建API错误
     */
    public static createAPIError(message: string, code?: string, details?: unknown): AppError {
        return new AppError(message, ErrorType.API, code, details);
    }

    /**
     * 创建验证错误
     */
    public static createValidationError(message: string, details?: unknown): AppError {
        return new AppError(message, ErrorType.VALIDATION, 'VALIDATION_ERROR', details);
    }

    /**
     * 创建工作流错�?     */
    public static createWorkflowError(message: string, details?: unknown): AppError {
        return new AppError(message, ErrorType.WORKFLOW, 'WORKFLOW_ERROR', details);
    }

    /**
     * 创建UI错误
     */
    public static createUIError(message: string, details?: unknown): AppError {
        return new AppError(message, ErrorType.UI, 'UI_ERROR', details);
    }
}

// 导出单例实例
export const errorHandler = ErrorHandler.getInstance();
