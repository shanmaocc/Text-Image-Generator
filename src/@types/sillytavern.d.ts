/**
 * SillyTavern 主站类型定义
 * 参考: G:\SillyTavern\public\scripts\st-context.js
 *
 * 你也可以在主站页面按 F12，在控制台中输入 `window.SillyTavern.getContext()` 来查看当前主站提供的接口
 */

declare namespace SillyTavern {
    /**
     * 聊天消息的 extra 字段类型
     * 包含图片、音频等媒体信息
     */
    export interface MessageExtra {
        /** 图片路径 */
        image?: string;
        /** 图片标题 */
        title?: string;
        /** 是否内联显示图片 */
        inline_image?: boolean;
        /** 音频路径 */
        audio?: string;
        /** 消息类型（如 'narrator' 表示旁白） */
        type?: string;
        /** 其他扩展字段 */
        [key: string]: any;
    }

    /**
     * 聊天消息类型
     */
    export interface ChatMessage {
        /** 消息发送者名称 */
        name: string;
        /** 是否为用户消息 */
        is_user: boolean;
        /** 是否为系统消息（隐藏，不发给 LLM） */
        is_system: boolean;
        /** 消息内容 */
        mes: string;
        /** 当前滑动索引 */
        swipe_id?: number;
        /** 所有滑动选项 */
        swipes?: string[];
        /** 消息变量 */
        variables?: Record<string, any>[] | { [swipe_id: number]: Record<string, any> };
        /**
         * 额外数据
         * 包含图片、音频等媒体信息
         */
        extra?: MessageExtra;
        /** 发送日期 */
        send_date?: number;
        /** 生成日期 */
        gen_started?: number;
        /** 生成完成日期 */
        gen_finished?: number;
        /** Token 数量 */
        token_count?: number;
        /** 其他扩展字段 */
        [key: string]: any;
    }

    /**
     * 扩展设置类型
     */
    export interface ExtensionSettings {
        /** Stable Diffusion 扩展设置 */
        sd?: {
            /** ComfyUI 服务器地址 */
            comfy_url?: string;
            [key: string]: any;
        };
        [key: string]: any;
    }

    /**
     * OpenAI 预设类型
     */
    export interface OpenAIPreset {
        /** 预设名称 */
        name?: string;
        /** 预设标题 */
        title?: string;
        /** 预设标签 */
        label?: string;
        /** 预设 ID */
        id?: string;
        /** 越狱提示词 */
        jailbreak_prompt?: string;
        /** 主提示词 */
        main_prompt?: string;
        /** 提示词前缀 */
        prompt_prefix?: string;
        /** 提示词 */
        prompt?: string;
        /** 文本内容 */
        text?: string;
        /** 内容 */
        content?: string;
        /** 负面提示词 */
        negative_prompt?: string;
        /** 负面 */
        negative?: string;
        /** 负面提示词（简写） */
        neg_prompt?: string;
        /** 其他字段 */
        [key: string]: any;
    }

    /**
     * 弹窗选项类型
     */
    export interface PopupOptions {
        /** 自定义确认按钮文本，或 true 使用默认文本 */
        okButton?: string | boolean;
        /** 自定义取消按钮文本，或 true 使用默认文本 */
        cancelButton?: string | boolean;
        /** 输入框行数 */
        rows?: number;
        /** 是否使用宽屏模式（1:1 宽高比） */
        wide?: boolean;
        /** 是否使用更宽模式（仅加宽，不调整高度） */
        wider?: boolean;
        /** 是否使用大尺寸模式（占屏幕 90%） */
        large?: boolean;
        /** 是否使用透明模式（无背景、边框、阴影） */
        transparent?: boolean;
        /** 是否允许水平滚动 */
        allowHorizontalScrolling?: boolean;
        /** 是否允许垂直滚动 */
        allowVerticalScrolling?: boolean;
        /** 内容是否默认左对齐 */
        leftAlign?: boolean;
        /** 动画速度 */
        animation?: 'slow' | 'fast' | 'none';
        /** 按下 Enter 时的默认结果 */
        defaultResult?: number;
        /** 自定义按钮列表 */
        customButtons?:
            | Array<{
                  text: string;
                  result?: number;
                  classes?: string[] | string;
                  action?: () => void;
                  appendAtEnd?: boolean;
              }>
            | string[];
        /** 关闭前回调，返回 false 可取消关闭 */
        onClosing?: (popup: any) => Promise<boolean | void>;
        /** 关闭后回调，DOM 清理前执行 */
        onClose?: (popup: any) => Promise<void>;
        /** 打开后回调 */
        onOpen?: (popup: any) => Promise<void>;
    }
}

/**
 * SillyTavern 主站提供给插件的稳定接口
 * 具体内容见于 SillyTavern/public/scripts/st-context.js
 */
declare const SillyTavern: {
    // ========== 核心状态 ==========
    /** 账户存储 */
    readonly accountStorage: any;
    /** 当前聊天记录 */
    readonly chat: Array<SillyTavern.ChatMessage>;
    /** 角色列表 */
    readonly characters: any[];
    /** 群组列表 */
    readonly groups: any[];
    /** 用户名称 */
    readonly name1: string;
    /** 角色名称 */
    readonly name2: string;
    /** 当前角色 ID (this_chid) */
    readonly characterId: number | undefined;
    /** 当前群组 ID */
    readonly groupId: string | undefined;
    /** 当前聊天 ID */
    readonly chatId: string | undefined;

    // ========== 设置相关 ==========
    /** 扩展设置 (extension_settings) */
    readonly extensionSettings: SillyTavern.ExtensionSettings;
    /** 聊天补全设置 (oai_settings) */
    readonly chatCompletionSettings: any;
    /** 文本补全设置 (textgenerationwebui_settings) */
    readonly textCompletionSettings: any;
    /** 高级用户设置 (power_user) */
    readonly powerUserSettings: any;
    /** 当前 API 类型 */
    readonly mainApi: string;
    /** 最大上下文长度 */
    readonly maxContext: number;
    /** 在线状态 */
    readonly onlineStatus: string;

    // ========== 元数据 ==========
    /** 聊天元数据 (chat_metadata) */
    readonly chatMetadata: Record<string, any>;

    // ========== 函数 - 导航与状态 ==========
    /** 获取当前聊天 ID */
    readonly getCurrentChatId: () => string;
    /** 获取请求头 */
    readonly getRequestHeaders: () => Record<string, string>;
    /** 重新加载当前聊天 */
    readonly reloadCurrentChat: () => Promise<void>;
    /** 重命名聊天 */
    readonly renameChat: (newName: string) => Promise<void>;
    /** 防抖保存设置 */
    readonly saveSettingsDebounced: () => void;
    /** 防抖保存元数据 */
    readonly saveMetadataDebounced: () => void;
    /** 保存聊天 */
    readonly saveChat: () => Promise<void>;
    /** 保存元数据 */
    readonly saveMetadata: () => Promise<void>;

    // ========== 函数 - 生成 ==========
    /** 生成消息 */
    readonly generate: (type: string, options?: any) => Promise<void>;
    /** 停止生成 */
    readonly stopGeneration: () => void;
    /** 发送生成请求 */
    readonly sendGenerationRequest: (options: any) => Promise<any>;
    /** 发送流式请求 */
    readonly sendStreamingRequest: (options: any) => Promise<any>;
    /** 静默生成 */
    readonly generateQuietPrompt: (
        quiet_prompt: string,
        quiet_to_loud: boolean,
        skip_wian: boolean,
        quiet_image?: string,
        quiet_name?: string,
        response_length?: number,
        force_chid?: number
    ) => Promise<string>;
    /** 原始生成 */
    readonly generateRaw: (prompt: string, options?: any) => Promise<string>;

    // ========== 函数 - UI ==========
    /** 显示加载动画 */
    readonly showLoader: () => void;
    /** 隐藏加载动画 */
    readonly hideLoader: () => void;
    /** 激活发送按钮 */
    readonly activateSendButtons: () => void;
    /** 禁用发送按钮 */
    readonly deactivateSendButtons: () => void;
    /** 是否移动端 */
    readonly isMobile: () => boolean;
    /** 是否在 Enter 时发送 */
    readonly shouldSendOnEnter: () => boolean;

    // ========== 函数 - 事件 ==========
    /** 事件源 */
    readonly eventSource: {
        on: (event: string, handler: (...args: any[]) => void) => void;
        off: (event: string, handler: (...args: any[]) => void) => void;
        emit: (event: string, ...args: any[]) => void;
        emitAndWait: (event: string, ...args: any[]) => Promise<void>;
        once: (event: string, handler: (...args: any[]) => void) => void;
        makeLast: (event: string, handler: (...args: any[]) => void) => void;
        makeFirst: (event: string, handler: (...args: any[]) => void) => void;
        removeListener: (event: string, handler: (...args: any[]) => void) => void;
    };
    /** 事件类型常量 */
    readonly eventTypes: Record<string, string>;

    // ========== 函数 - 消息 ==========
    /** 添加一条消息 */
    readonly addOneMessage: (mes: object, options: any) => Promise<void>;
    /** 删除最后一条消息 */
    readonly deleteLastMessage: () => Promise<void>;
    /** 更新消息块 */
    readonly updateMessageBlock: (
        message_id: number,
        message: object,
        options?: { rerenderMessage?: boolean }
    ) => void;
    /** 向消息添加媒体 */
    readonly appendMediaToMessage: (
        mes: object,
        messageElement: JQuery<HTMLElement>,
        adjust_scroll?: boolean
    ) => void;
    /** 打印所有消息 */
    readonly printMessages: () => Promise<void>;
    /** 清空聊天 */
    readonly clearChat: () => Promise<void>;
    /** 发送系统消息 */
    readonly sendSystemMessage: (type: any, text: any, extra?: any) => Promise<void>;
    /** 保存回复 */
    readonly saveReply: (options: any, ...args: any[]) => Promise<void>;

    // ========== 函数 - 工具 ==========
    /** 替换参数（宏） */
    readonly substituteParams: (text: string) => string;
    /** 扩展替换参数 */
    readonly substituteParamsExtended: (
        content: string,
        additional_macro?: Record<string, any>,
        post_process_function?: (text: string) => string
    ) => Promise<void>;
    /** 异步获取 token 数量 */
    readonly getTokenCountAsync: (text: string, padding?: number) => Promise<number>;
    /** 获取文本 tokens */
    readonly getTextTokens: (tokenizer_type: number, string: string) => Promise<number>;
    /** 获取分词器模型 */
    readonly getTokenizerModel: () => string;
    /** 分词器 */
    readonly tokenizers: any;
    /** 翻译函数 */
    readonly t: (key: string) => string;
    /** 翻译文本 */
    readonly translate: (text: string, key?: string | null) => string;
    /** 获取当前语言 */
    readonly getCurrentLocale: () => string;
    /** 添加语言数据 */
    readonly addLocaleData: (localeId: string, data: Record<string, string>) => void;
    /** UUID v4 生成器 */
    readonly uuidv4: () => string;
    /** 人性化时间格式 */
    readonly humanizedDateTime: () => string;
    /** 时间戳转 moment */
    readonly timestampToMoment: (timestamp: string | number) => any;

    // ========== 函数 - 扩展辅助 ==========
    /** 异步渲染扩展模板 */
    readonly renderExtensionTemplateAsync: (
        extension_name: string,
        template_id: string,
        template_data?: object,
        sanitize?: boolean,
        localize?: boolean
    ) => Promise<string>;
    /** 写入扩展字段 */
    readonly writeExtensionField: (character_id: number, key: string, value: any) => Promise<void>;
    /** 模块 Worker 包装器 */
    readonly ModuleWorkerWrapper: any;

    // ========== 函数 - 角色 ==========
    /** 获取角色列表 */
    readonly getCharacters: () => Promise<void>;
    /** 获取角色卡片字段 */
    readonly getCharacterCardFields: (options?: { chid?: number }) => any;
    /** 通过 ID 选择角色 */
    readonly selectCharacterById: (id: number, options?: { switchMenu?: boolean }) => Promise<void>;
    /** 打开角色聊天 */
    readonly openCharacterChat: (file_name: any) => Promise<void>;
    /** 获取缩略图 URL */
    readonly getThumbnailUrl: (type: any, file: any) => string;
    /** 反浅层化角色 */
    readonly unshallowCharacter: (character_id?: string) => Promise<void>;
    /** 消息格式化 */
    readonly messageFormatting: (
        message: string,
        ch_name: string,
        is_system: boolean,
        is_user: boolean,
        message_id: number,
        sanitizerOverrides?: object,
        isReasoning?: boolean
    ) => string;

    // ========== 函数 - 群组 ==========
    /** 打开群组聊天 */
    readonly openGroupChat: (group_id: any, chat_id: any) => Promise<void>;
    /** 反浅层化群组成员 */
    readonly unshallowGroupMembers: (group_id: string) => Promise<void>;

    // ========== 函数 - 世界书 ==========
    /** 加载世界书 */
    readonly loadWorldInfo: (name: string) => Promise<any | null>;
    /** 保存世界书 */
    readonly saveWorldInfo: (name: string, data: any, immediately?: boolean) => Promise<void>;
    /** 重新加载世界书编辑器 */
    readonly reloadWorldInfoEditor: (file: string, loadIfNotSelected?: boolean) => void;
    /** 更新世界书列表 */
    readonly updateWorldInfoList: () => Promise<void>;
    /** 转换角色书 */
    readonly convertCharacterBook: (character_book: any) => {
        entries: Record<string, any>;
        originalData: Record<string, any>;
    };
    /** 获取世界书提示词 */
    readonly getWorldInfoPrompt: (
        chat: string[],
        max_context: number,
        is_dry_run: boolean
    ) => Promise<{
        worldInfoString: string;
        worldInfoBefore: string;
        worldInfoAfter: string;
        worldInfoExamples: any[];
        worldInfoDepth: any[];
        anBefore: any[];
        anAfter: any[];
    }>;

    // ========== 函数 - 斜杠命令 ==========
    /** 斜杠命令解析器 */
    readonly SlashCommandParser: any;
    /** 斜杠命令类 */
    readonly SlashCommand: any;
    /** 斜杠命令参数类 */
    readonly SlashCommandArgument: any;
    /** 斜杠命令命名参数类 */
    readonly SlashCommandNamedArgument: any;
    /** 参数类型常量 */
    readonly ARGUMENT_TYPE: {
        STRING: string;
        NUMBER: string;
        RANGE: string;
        BOOLEAN: string;
        VARIABLE_NAME: string;
        CLOSURE: string;
        SUBCOMMAND: string;
        LIST: string;
        DICTIONARY: string;
    };
    /** 带选项执行斜杠命令 */
    readonly executeSlashCommandsWithOptions: (
        text: string,
        options?: any
    ) => Promise<{
        interrupt: boolean;
        pipe: string;
        isBreak: boolean;
        isAborted: boolean;
        isQuietlyAborted: boolean;
        abortReason: string;
        isError: boolean;
        errorMessage: string;
    }>;
    /** 注册斜杠命令（已废弃） */
    readonly registerSlashCommand: (...args: any[]) => void;
    /** 执行斜杠命令（已废弃） */
    readonly executeSlashCommands: (...args: any[]) => void;

    // ========== 函数 - 宏与工具 ==========
    /** 注册宏 */
    readonly registerMacro: (
        key: string,
        value: string | ((text: string) => string),
        description?: string
    ) => void;
    /** 注销宏 */
    readonly unregisterMacro: (key: string) => void;
    /** 注册函数工具 */
    readonly registerFunctionTool: (tool: {
        name: string;
        displayName: string;
        description: string;
        parameters: Record<string, any>;
        action: ((args: any) => string) | ((args: any) => Promise<string>);
        formatMessage?: (args: any) => string;
        shouldRegister?: (() => boolean) | (() => Promise<boolean>);
        stealth?: boolean;
    }) => void;
    /** 注销函数工具 */
    readonly unregisterFunctionTool: (name: string) => void;
    /** 是否支持工具调用 */
    readonly isToolCallingSupported: () => boolean;
    /** 能否执行工具调用 */
    readonly canPerformToolCalls: (type: string) => boolean;
    /** 工具管理器 */
    readonly ToolManager: any;
    /** 注册调试函数 */
    readonly registerDebugFunction: (
        function_id: string,
        name: string,
        description: string,
        fn: Function
    ) => void;

    // ========== 函数 - 弹窗 ==========
    /** 调用通用弹窗 */
    readonly callGenericPopup: (
        content: JQuery<HTMLElement> | string | Element,
        type: number,
        inputValue?: string,
        popupOptions?: SillyTavern.PopupOptions
    ) => Promise<number | string | boolean | undefined>;
    /** 调用弹窗（已废弃） */
    readonly callPopup: (...args: any[]) => any;
    /** 弹窗类 */
    readonly Popup: any;
    /** 弹窗类型常量 */
    readonly POPUP_TYPE: {
        TEXT: number;
        CONFIRM: number;
        INPUT: number;
        DISPLAY: number;
        CROP: number;
    };
    /** 弹窗结果常量 */
    readonly POPUP_RESULT: {
        AFFIRMATIVE: number;
        NEGATIVE: number;
        CANCELLED: number;
        [key: string]: number;
    };

    // ========== 函数 - 其他 ==========
    /** 注册数据库抓取器 */
    readonly registerDataBankScraper: (scraper: any) => Promise<void>;
    /** 获取预设管理器 */
    readonly getPresetManager: (apiId?: string) => any;
    /** 获取聊天补全模型 */
    readonly getChatCompletionModel: (source?: string) => string;
    /** 从数据中提取消息 */
    readonly extractMessageFromData: (data: object, activateApi?: string) => string;
    /** 获取文本生成服务器 */
    readonly getTextGenServer: (type?: string) => string;
    /** 更新推理 UI */
    readonly updateReasoningUI: (
        message_id_or_element: number | JQuery<HTMLElement> | HTMLElement,
        options?: { reset?: boolean }
    ) => void;
    /** 从字符串解析推理 */
    readonly parseReasoningFromString: (
        string: string,
        options?: { strict?: boolean }
    ) => any | null;

    // ========== 数据 ==========
    /** 标签列表 */
    readonly tags: any[];
    /** 标签映射 */
    readonly tagMap: { [identifier: string]: string[] };
    /** 菜单类型 */
    readonly menuType: any;
    /** 创建角色数据 */
    readonly createCharacterData: Record<string, any>;
    /** API 连接映射 */
    readonly CONNECT_API_MAP: Record<string, any>;
    /** 流式处理器 */
    readonly streamingProcessor: any;
    /** 扩展提示词 */
    readonly extensionPrompts: Record<
        string,
        {
            value: string;
            position: number;
            depth: number;
            scan: boolean;
            role: number;
            filter: () => Promise<boolean> | boolean;
        }
    >;
    /** 设置扩展提示词 */
    readonly setExtensionPrompt: (
        prompt_id: string,
        content: string,
        position: -1 | 1,
        depth: number,
        scan?: boolean,
        role?: number,
        filter?: () => Promise<boolean> | boolean
    ) => Promise<void>;
    /** 更新聊天元数据 */
    readonly updateChatMetadata: (new_values: any, reset: boolean) => void;
    /** 聊天补全服务 */
    readonly ChatCompletionService: any;
    /** 文本补全服务 */
    readonly TextCompletionService: any;
    /** 连接管理器请求服务 */
    readonly ConnectionManagerRequestService: any;
    /** 符号常量 */
    readonly symbols: {
        ignore: any;
    };

    /** 滑动功能 */
    readonly swipe: {
        left: () => void;
        right: () => void;
    };

    /** 变量管理 */
    readonly variables: {
        local: {
            get: (name: string) => any;
            set: (name: string, value: any) => void;
        };
        global: {
            get: (name: string) => any;
            set: (name: string, value: any) => void;
        };
    };
};

/**
 * 为 '@sillytavern/scripts/st-context' 模块声明类型
 * 使得可以在项目中 import getContext 并获得完整的类型提示
 */
declare module '@sillytavern/scripts/st-context' {
    /**
     * SillyTavern Context 类型
     * 直接使用 SillyTavern 对象的类型定义
     */
    type STContext = {
        readonly accountStorage: any;
        readonly chat: Array<SillyTavern.ChatMessage>;
        readonly characters: any[];
        readonly groups: any[];
        readonly name1: string;
        readonly name2: string;
        readonly characterId: number | undefined;
        readonly groupId: string | undefined;
        readonly chatId: string | undefined;
        readonly extensionSettings: SillyTavern.ExtensionSettings;
        readonly chatCompletionSettings: any;
        readonly textCompletionSettings: any;
        readonly powerUserSettings: any;
        readonly mainApi: string;
        readonly maxContext: number;
        readonly onlineStatus: string;
        readonly chatMetadata: Record<string, any>;
        readonly getCurrentChatId: () => string;
        readonly getRequestHeaders: () => Record<string, string>;
        readonly reloadCurrentChat: () => Promise<void>;
        readonly renameChat: (newName: string) => Promise<void>;
        readonly saveSettingsDebounced: () => void;
        readonly saveMetadataDebounced: () => void;
        readonly saveChat: () => Promise<void>;
        readonly saveMetadata: () => Promise<void>;
        readonly generate: (type: string, options?: any) => Promise<void>;
        readonly stopGeneration: () => void;
        readonly sendGenerationRequest: (options: any) => Promise<any>;
        readonly sendStreamingRequest: (options: any) => Promise<any>;
        readonly generateQuietPrompt: (
            quiet_prompt: string,
            quiet_to_loud: boolean,
            skip_wian: boolean,
            quiet_image?: string,
            quiet_name?: string,
            response_length?: number,
            force_chid?: number
        ) => Promise<string>;
        readonly generateRaw: (prompt: string, options?: any) => Promise<string>;
        readonly showLoader: () => void;
        readonly hideLoader: () => void;
        readonly activateSendButtons: () => void;
        readonly deactivateSendButtons: () => void;
        readonly isMobile: () => boolean;
        readonly shouldSendOnEnter: () => boolean;
        readonly eventSource: {
            on: (event: string, handler: (...args: any[]) => void) => void;
            off: (event: string, handler: (...args: any[]) => void) => void;
            emit: (event: string, ...args: any[]) => void;
            emitAndWait: (event: string, ...args: any[]) => Promise<void>;
            once: (event: string, handler: (...args: any[]) => void) => void;
            makeLast: (event: string, handler: (...args: any[]) => void) => void;
            makeFirst: (event: string, handler: (...args: any[]) => void) => void;
            removeListener: (event: string, handler: (...args: any[]) => void) => void;
        };
        readonly eventTypes: Record<string, string>;
        readonly addOneMessage: (mes: object, options: any) => Promise<void>;
        readonly deleteLastMessage: () => Promise<void>;
        readonly updateMessageBlock: (
            message_id: number,
            message: object,
            options?: { rerenderMessage?: boolean }
        ) => void;
        readonly appendMediaToMessage: (
            mes: object,
            messageElement: JQuery<HTMLElement>,
            adjust_scroll?: boolean
        ) => void;
        readonly printMessages: () => Promise<void>;
        readonly clearChat: () => Promise<void>;
        readonly sendSystemMessage: (type: any, text: any, extra?: any) => Promise<void>;
        readonly saveReply: (options: any, ...args: any[]) => Promise<void>;
        readonly substituteParams: (text: string) => string;
        readonly substituteParamsExtended: (
            content: string,
            additional_macro?: Record<string, any>,
            post_process_function?: (text: string) => string
        ) => Promise<void>;
        readonly getTokenCountAsync: (text: string, padding?: number) => Promise<number>;
        readonly getTextTokens: (tokenizer_type: number, string: string) => Promise<number>;
        readonly getTokenizerModel: () => string;
        readonly tokenizers: any;
        readonly t: (key: string) => string;
        readonly translate: (text: string, key?: string | null) => string;
        readonly getCurrentLocale: () => string;
        readonly addLocaleData: (localeId: string, data: Record<string, string>) => void;
        readonly uuidv4: () => string;
        readonly humanizedDateTime: () => string;
        readonly timestampToMoment: (timestamp: string | number) => any;
        readonly renderExtensionTemplateAsync: (
            extension_name: string,
            template_id: string,
            template_data?: object,
            sanitize?: boolean,
            localize?: boolean
        ) => Promise<string>;
        readonly writeExtensionField: (
            character_id: number,
            key: string,
            value: any
        ) => Promise<void>;
        readonly ModuleWorkerWrapper: any;
        readonly getCharacters: () => Promise<void>;
        readonly getCharacterCardFields: (options?: { chid?: number }) => any;
        readonly selectCharacterById: (
            id: number,
            options?: { switchMenu?: boolean }
        ) => Promise<void>;
        readonly openCharacterChat: (file_name: any) => Promise<void>;
        readonly getThumbnailUrl: (type: any, file: any) => string;
        readonly unshallowCharacter: (character_id?: string) => Promise<void>;
        readonly messageFormatting: (
            message: string,
            ch_name: string,
            is_system: boolean,
            is_user: boolean,
            message_id: number,
            sanitizerOverrides?: object,
            isReasoning?: boolean
        ) => string;
        readonly openGroupChat: (group_id: any, chat_id: any) => Promise<void>;
        readonly unshallowGroupMembers: (group_id: string) => Promise<void>;
        readonly loadWorldInfo: (name: string) => Promise<any | null>;
        readonly saveWorldInfo: (name: string, data: any, immediately?: boolean) => Promise<void>;
        readonly reloadWorldInfoEditor: (file: string, loadIfNotSelected?: boolean) => void;
        readonly updateWorldInfoList: () => Promise<void>;
        readonly convertCharacterBook: (character_book: any) => {
            entries: Record<string, any>;
            originalData: Record<string, any>;
        };
        readonly getWorldInfoPrompt: (
            chat: string[],
            max_context: number,
            is_dry_run: boolean
        ) => Promise<{
            worldInfoString: string;
            worldInfoBefore: string;
            worldInfoAfter: string;
            worldInfoExamples: any[];
            worldInfoDepth: any[];
            anBefore: any[];
            anAfter: any[];
        }>;
        readonly SlashCommandParser: any;
        readonly SlashCommand: any;
        readonly SlashCommandArgument: any;
        readonly SlashCommandNamedArgument: any;
        readonly ARGUMENT_TYPE: {
            STRING: string;
            NUMBER: string;
            RANGE: string;
            BOOLEAN: string;
            VARIABLE_NAME: string;
            CLOSURE: string;
            SUBCOMMAND: string;
            LIST: string;
            DICTIONARY: string;
        };
        readonly executeSlashCommandsWithOptions: (
            text: string,
            options?: any
        ) => Promise<{
            interrupt: boolean;
            pipe: string;
            isBreak: boolean;
            isAborted: boolean;
            isQuietlyAborted: boolean;
            abortReason: string;
            isError: boolean;
            errorMessage: string;
        }>;
        readonly registerSlashCommand: (...args: any[]) => void;
        readonly executeSlashCommands: (...args: any[]) => void;
        readonly registerMacro: (
            key: string,
            value: string | ((text: string) => string),
            description?: string
        ) => void;
        readonly unregisterMacro: (key: string) => void;
        readonly registerFunctionTool: (tool: {
            name: string;
            displayName: string;
            description: string;
            parameters: Record<string, any>;
            action: ((args: any) => string) | ((args: any) => Promise<string>);
            formatMessage?: (args: any) => string;
            shouldRegister?: (() => boolean) | (() => Promise<boolean>);
            stealth?: boolean;
        }) => void;
        readonly unregisterFunctionTool: (name: string) => void;
        readonly isToolCallingSupported: () => boolean;
        readonly canPerformToolCalls: (type: string) => boolean;
        readonly ToolManager: any;
        readonly registerDebugFunction: (
            function_id: string,
            name: string,
            description: string,
            fn: Function
        ) => void;
        readonly callGenericPopup: (
            content: JQuery<HTMLElement> | string | Element,
            type: number,
            inputValue?: string,
            popupOptions?: any
        ) => Promise<number | string | boolean | undefined>;
        readonly callPopup: (...args: any[]) => any;
        readonly Popup: any;
        readonly POPUP_TYPE: {
            TEXT: number;
            CONFIRM: number;
            INPUT: number;
            DISPLAY: number;
            CROP: number;
        };
        readonly POPUP_RESULT: {
            AFFIRMATIVE: number;
            NEGATIVE: number;
            CANCELLED: number;
            [key: string]: number;
        };
        readonly registerDataBankScraper: (scraper: any) => Promise<void>;
        readonly getPresetManager: (apiId?: string) => any;
        readonly getChatCompletionModel: (source?: string) => string;
        readonly extractMessageFromData: (data: object, activateApi?: string) => string;
        readonly getTextGenServer: (type?: string) => string;
        readonly updateReasoningUI: (
            message_id_or_element: number | JQuery<HTMLElement> | HTMLElement,
            options?: { reset?: boolean }
        ) => void;
        readonly parseReasoningFromString: (
            string: string,
            options?: { strict?: boolean }
        ) => any | null;
        readonly tags: any[];
        readonly tagMap: { [identifier: string]: string[] };
        readonly menuType: any;
        readonly createCharacterData: Record<string, any>;
        readonly CONNECT_API_MAP: Record<string, any>;
        readonly streamingProcessor: any;
        readonly extensionPrompts: Record<
            string,
            {
                value: string;
                position: number;
                depth: number;
                scan: boolean;
                role: number;
                filter: () => Promise<boolean> | boolean;
            }
        >;
        readonly setExtensionPrompt: (
            prompt_id: string,
            content: string,
            position: -1 | 1,
            depth: number,
            scan?: boolean,
            role?: number,
            filter?: () => Promise<boolean> | boolean
        ) => Promise<void>;
        readonly updateChatMetadata: (new_values: any, reset: boolean) => void;
        readonly ChatCompletionService: any;
        readonly TextCompletionService: any;
        readonly ConnectionManagerRequestService: any;
        readonly symbols: {
            ignore: any;
        };
        readonly swipe: {
            left: () => void;
            right: () => void;
        };
        readonly variables: {
            local: {
                get: (name: string) => any;
                set: (name: string, value: any) => void;
            };
            global: {
                get: (name: string) => any;
                set: (name: string, value: any) => void;
            };
        };
    };

    /**
     * 扩展的 Context 接口 - 用于访问 OpenAI 预设
     * 主站在某些情况下会额外提供这些字段
     */
    export interface STContextExtended extends STContext {
        /** OpenAI 预设名称列表 */
        openai_setting_names?: string[];
        /** OpenAI 预设数据列表 */
        openai_settings?: SillyTavern.OpenAIPreset[];
    }

    /**
     * 获取 SillyTavern Context 对象
     * @returns SillyTavern Context 对象，包含主站提供的所有API
     */
    export default function getContext(): STContext;
}
