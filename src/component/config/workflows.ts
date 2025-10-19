/**
 * ComfyUI 工作流配置
 */

/**
 * 工作流配置数组
 */
export const workflows = [
    // 工作流 0: 基础工作流
    {
        name: '基础工作流',
        description: '简单的文本到图像生成工作流',
        workflow: {
            '3': {
                class_type: 'KSampler',
                inputs: {
                    cfg: 7,
                    denoise: 1,
                    latent_image: ['5', 0],
                    model: ['4', 0],
                    negative: ['7', 0],
                    positive: ['6', 0],
                    sampler_name: 'euler',
                    scheduler: 'simple',
                    seed: '%seed%',
                    steps: 20,
                },
            },
            '4': {
                class_type: 'CheckpointLoaderSimple',
                inputs: {
                    ckpt_name: 'theDeepDark_v61Hybrid(动漫).safetensors',
                },
            },
            '5': {
                class_type: 'EmptyLatentImage',
                inputs: {
                    batch_size: 1,
                    height: 1024,
                    width: 1024,
                },
            },
            '6': {
                class_type: 'CLIPTextEncode',
                inputs: {
                    clip: ['4', 1],
                    text: '%prompt%',
                },
            },
            '7': {
                class_type: 'CLIPTextEncode',
                inputs: {
                    clip: ['4', 1],
                    text: '%negative_prompt%',
                },
            },
            '8': {
                class_type: 'VAEDecode',
                inputs: {
                    samples: ['3', 0],
                    vae: ['4', 2],
                },
            },
            '9': {
                class_type: 'SaveImage',
                inputs: {
                    filename_prefix: 'SillyTavern',
                    images: ['8', 0],
                },
            },
        },
    },
    // 工作流 1: 面部细化工作流
    {
        name: '面部细化工作流',
        description: '带有面部细化功能的高级工作流',
        workflow: {
            '4': {
                inputs: {
                    ckpt_name: 'theDeepDark_v61Hybrid(动漫).safetensors',
                },
                class_type: 'CheckpointLoaderSimple',
                _meta: {
                    title: 'Checkpoint加载器（简易）',
                },
            },
            '5': {
                inputs: {
                    width: 1024,
                    height: 1024,
                    batch_size: 1,
                },
                class_type: 'EmptyLatentImage',
                _meta: {
                    title: '空Latent图像',
                },
            },
            '6': {
                inputs: {
                    text: '(masterpiece:1.4), (best quality:1.3), (ultra detailed:1.3), (photorealistic:1.2),\n(soft natural light:1.3), (bright ambient light:1.3), (cinematic lighting:1.1), \n(soft shadows:1.2), (balanced exposure:1.2), (8k:1.1), (sharp focus:1.1),\n(beautiful woman:1.3), (1girl:1.2), (long hair:1.1), (dark hair:1.1), \n(clear skin:1.2), (subtle makeup:1.1), (smiling:1.1),\n(indoors:1.1), (bedroom:1.0), (soft background:1.2), (warm tones:1.2)\n',
                    clip: ['44', 0],
                },
                class_type: 'CLIPTextEncode',
                _meta: {
                    title: 'CLIP文本编码',
                },
            },
            '7': {
                inputs: {
                    text: '(low contrast), (underexposed), (dark shadows), (overexposed), \n(grainy), (blurry), (bad anatomy), (unnatural skin), (too dark), (harsh lighting)\n',
                    clip: ['44', 0],
                },
                class_type: 'CLIPTextEncode',
                _meta: {
                    title: 'CLIP文本编码',
                },
            },
            '25': {
                inputs: {
                    model_name: '4x_foolhardy_Remacri.pth',
                },
                class_type: 'UpscaleModelLoader',
                _meta: {
                    title: '加载放大模型',
                },
            },
            '29': {
                inputs: {
                    samples: ['65', 0],
                    vae: ['4', 2],
                },
                class_type: 'VAEDecode',
                _meta: {
                    title: 'VAE解码',
                },
            },
            '44': {
                inputs: {
                    stop_at_clip_layer: -2,
                    clip: ['4', 1],
                },
                class_type: 'CLIPSetLastLayer',
                _meta: {
                    title: '设置CLIP最后一层',
                },
            },
            '46': {
                inputs: {
                    lora_name: 'Expressive_H-000001(heitai).safetensors',
                    strength_model: 1,
                    model: ['4', 0],
                },
                class_type: 'LoraLoaderModelOnly',
                _meta: {
                    title: 'LoRA加载器（仅模型）',
                },
            },
            '49': {
                inputs: {
                    model_name: 'sam_vit_b_01ec64.pth',
                    device_mode: 'AUTO',
                },
                class_type: 'SAMLoader',
                _meta: {
                    title: 'SAM加载器',
                },
            },
            '50': {
                inputs: {
                    guide_size: 512,
                    guide_size_for: true,
                    max_size: 1024,
                    seed: '%seed%',
                    steps: 25,
                    cfg: 12,
                    sampler_name: 'euler_ancestral',
                    scheduler: 'normal',
                    denoise: 0.6,
                    feather: 5,
                    noise_mask: true,
                    force_inpaint: true,
                    bbox_threshold: 0.5,
                    bbox_dilation: 20,
                    bbox_crop_factor: 3,
                    sam_detection_hint: 'center-1',
                    sam_dilation: 0,
                    sam_threshold: 0.93,
                    sam_bbox_expansion: 0,
                    sam_mask_hint_threshold: 0.7,
                    sam_mask_hint_use_negative: 'False',
                    drop_size: 10,
                    wildcard: '',
                    cycle: 1,
                    inpaint_model: false,
                    noise_mask_feather: 20,
                    tiled_encode: {
                        __value__: [false, true],
                    },
                    tiled_decode: false,
                    image: ['29', 0],
                    model: ['46', 0],
                    clip: ['44', 0],
                    vae: ['4', 2],
                    positive: ['6', 0],
                    negative: ['7', 0],
                    bbox_detector: ['59', 0],
                    sam_model_opt: ['49', 0],
                },
                class_type: 'FaceDetailer',
                _meta: {
                    title: '面部细化',
                },
            },
            '59': {
                inputs: {
                    model_name: 'bbox/face_yolov8m.pt',
                },
                class_type: 'UltralyticsDetectorProvider',
                _meta: {
                    title: '检测加载器',
                },
            },
            '65': {
                inputs: {
                    seed: '%seed%',
                    steps: 25,
                    cfg: 12,
                    sampler_name: 'euler_ancestral',
                    scheduler: 'normal',
                    denoise: 1,
                    model: ['46', 0],
                    positive: ['6', 0],
                    negative: ['7', 0],
                    latent_image: ['5', 0],
                },
                class_type: 'KSampler',
                _meta: {
                    title: 'K采样器',
                },
            },
            '72': {
                inputs: {
                    filename_prefix: 'ComfyUI',
                    subdirectory_name: '',
                    output_format: 'png',
                    quality: 'max',
                    metadata_scope: 'full',
                    include_batch_num: true,
                    prefer_nearest: true,
                    images: ['50', 0],
                },
                class_type: 'SaveImageWithMetaData',
                _meta: {
                    title: 'Save Image With MetaData',
                },
            },
        },
    },
];

/**
 * 默认使用的工作流索引
 */
export const DEFAULT_WORKFLOW_INDEX = 1; // 默认使用面部细化工作流

/**
 * 兼容性导出（保持向后兼容）
 */
export const face_detailer_workflow = workflows[1]?.workflow;
