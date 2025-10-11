// 应用常量配置
export const APP_CONSTANTS = {
    // 默认ComfyUI URL - 提供默认值
    DEFAULT_COMFY_URL: 'http://127.0.0.1:8188',

    // 默认OpenAI API URL - 使用相对路径，让SillyTavern代理请求
    DEFAULT_OPENAI_API_URL: '',

    // 默认设置值
    DEFAULT_SETTINGS: {
        extensionEnabled: true,
        source: 'comfy',
        openaiProvider: 'openai-compatible',
        openaiMaxTokens: 65500,
        openaiTemperature: 1.2,
        openaiContextCount: 2,
        sd_resolution: 'sd_res_1024x1024',
        sd_steps: 20,
        sd_scale: 7,
        sd_width: 1024,
        sd_height: 1024,
        sd_denoising_strength: 0.7,
        sd_clip_skip: 1,
        sd_seed: -1,
        sd_prompt_prefix: 'best quality, absurdres, masterpiece,score_9, score_8_up, score_7_up, score_6_up, score_5_up, score_4_up, ',
        sd_negative_prompt: 'lowres, bad anatomy, bad hands, text, error, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry',
    },

    // 质量标签
    QUALITY_TAGS: 'best quality, absurdres, masterpiece,score_9, score_8_up, score_7_up, score_6_up, score_5_up, score_4_up, ',

    // 负面提示词
    NEGATIVE_PROMPT: 'lowres, bad anatomy, bad hands, text, error, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry',

    // 存储键
    STORAGE_KEYS: {
        SETTINGS: 'textToPicSettings',
        STYLES: 'textToPicStyles',
        WORKFLOWS: 'textToPicComfyWorkflows',
        CUSTOM_PLACEHOLDERS: 'textToPicCustomPlaceholders',
    },

    // 占位符列表
    PLACEHOLDERS: [
        'prompt',
        'negative_prompt',
        'model',
        'vae',
        'sampler',
        'scheduler',
        'steps',
        'scale',
        'denoise',
        'clip_skip',
        'width',
        'height',
        'user_avatar',
        'char_avatar',
    ],

    // 分辨率选项
    RESOLUTION_OPTIONS: [
        { value: 'sd_res_512x512', text: '512x512 (1:1, icons, profile pictures)' },
        { value: 'sd_res_600x600', text: '600x600 (1:1, icons, profile pictures)' },
        { value: 'sd_res_512x768', text: '512x768 (2:3, vertical character card)' },
        { value: 'sd_res_768x512', text: '768x512 (3:2, horizontal 35-mm movie film)' },
        { value: 'sd_res_960x540', text: '960x540 (16:9, horizontal wallpaper)' },
        { value: 'sd_res_540x960', text: '540x960 (9:16, vertical wallpaper)' },
        { value: 'sd_res_1920x1088', text: '1920x1088 (16:9, 1080p, horizontal wallpaper)' },
        { value: 'sd_res_1088x1920', text: '1088x1920 (9:16, 1080p, vertical wallpaper)' },
        { value: 'sd_res_1280x720', text: '1280x720 (16:9, 720p, horizontal wallpaper)' },
        { value: 'sd_res_720x1280', text: '720x1280 (9:16, 720p, vertical wallpaper)' },
        { value: 'sd_res_1024x1024', text: '1024x1024 (1:1, SDXL)' },
        { value: 'sd_res_1152x896', text: '1152x896 (9:7, SDXL)' },
        { value: 'sd_res_896x1152', text: '896x1152 (7:9, SDXL)' },
        { value: 'sd_res_1216x832', text: '1216x832 (19:13, SDXL)' },
        { value: 'sd_res_832x1216', text: '832x1216 (13:19, SDXL)' },
        { value: 'sd_res_1344x768', text: '1344x768 (4:3, SDXL)' },
        { value: 'sd_res_768x1344', text: '768x1344 (3:4, SDXL)' },
        { value: 'sd_res_1536x640', text: '1536x640 (24:10, SDXL)' },
        { value: 'sd_res_640x1536', text: '640x1536 (10:24, SDXL)' },
        { value: 'sd_res_1536x1024', text: '1536x1024 (3:2, ChatGPT)' },
        { value: 'sd_res_1024x1536', text: '1024x1536 (2:3, ChatGPT)' },
        { value: 'sd_res_1024x1792', text: '1024x1792 (4:7, DALL-E)' },
        { value: 'sd_res_1792x1024', text: '1792x1024 (7:4, DALL-E)' },
    ],

    // 渲染事件
    PARTIAL_RENDER_EVENTS: [
        'CHARACTER_MESSAGE_RENDERED', // 角色消息渲染
        // 'USER_MESSAGE_RENDERED', // 用户消息渲染（如需对用户消息也加按钮可开启）
        // 'MESSAGE_UPDATED', // 消息更新（编辑/再生成等）
        'MESSAGE_SWIPED', // 消息滑动(切换)
    ],

    // 渲染模式
    RENDER_MODES: {
        FULL: 'FULL',
        PARTIAL: 'PARTIAL',
    },

    // 延迟时间（毫秒）
    DELAYS: {
        DELETE_LISTENER: 400,
        MAIN_GENERATING_CHECK: 1,
    },

    // 检查范围
    CHECK_RANGE: {
        RECENT_MESSAGES: 20,
    },
};
