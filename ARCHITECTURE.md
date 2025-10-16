# Text-Image-Generator 架构文档

## 系统架构

本项目是一个SillyTavern扩展，集成了AI提示词生成和ComfyUI图片生成功能。

### 架构概览

```
用户交互(SillyTavern界面)
    ↓
事件处理层(event-handlers.ts)
    ↓
业务逻辑层(image-generator.ts, ui-config-*.ts)
    ↓
服务层(api-service.ts, ui-manager.ts, workflow-manager.ts)
    ↓
外部服务(ComfyUI, OpenAI API)
```

## 目录结构

```
src/
├── component/
│   ├── config/
│   │   ├── constants.ts          # 应用常量(支持环境变量)
│   │   └── config.ts             # 工作流配置
│   ├── services/
│   │   ├── api-service.ts        # ComfyUI API服务
│   │   ├── ui-manager.ts         # UI状态管理
│   │   └── workflow-manager.ts   # 工作流管理
│   ├── ui/
│   │   ├── ui-config-core.ts     # 核心UI配置
│   │   ├── ui-config-comfy.ts    # ComfyUI配置
│   │   ├── ui-config-openai.ts   # OpenAI配置
│   │   ├── ui-config-styles.ts   # 样式管理
│   │   └── ui-config-presets.ts  # 预设管理
│   ├── image/
│   │   ├── button-manager.ts     # 按钮UI管理
│   │   ├── image-generator.ts    # 图片生成核心
│   │   └── event-handlers.ts     # 事件处理
│   ├── types/
│   │   └── index.ts              # TypeScript类型定义
│   ├── utils/
│   │   ├── utils.ts              # 通用工具函数
│   │   └── error-handler.ts      # 错误处理
│   └── logger.ts                 # 日志系统
├── global.d.ts
└── index.ts                      # 扩展入口
```

## 模块职责

### 核心模块

#### 入口模块 (index.ts)

- 扩展初始化
- 事件监听器注册
- 全局状态设置

#### 配置模块 (config/)

- **constants.ts**: 应用级常量，支持环境变量
- **config.ts**: ComfyUI工作流配置

### 服务层 (services/)

#### api-service.ts

- ComfyUI API调用
- 模型/采样器/调度器/VAE加载
- 缓存管理(5分钟过期)
- 工作流文件管理

#### ui-manager.ts

- UI状态存储和读取
- 下拉框选项填充
- 设置保存到localStorage

#### workflow-manager.ts

- 工作流加载和保存
- 占位符替换
- 工作流编辑器

### UI层 (ui/)

#### ui-config-core.ts

- 核心UI初始化
- 事件监听器绑定
- 设置加载

#### ui-config-comfy.ts

- ComfyUI连接配置
- 选项加载

#### ui-config-openai.ts

- OpenAI API配置
- 模型列表刷新

#### ui-config-styles.ts

- 提示词样式管理
- 样式CRUD操作

#### ui-config-presets.ts

- SillyTavern预设集成
- 预设加载和应用

### 图片生成 (image/)

#### button-manager.ts

- 生成按钮创建和管理
- 按钮样式控制
- 删除监听器

#### image-generator.ts

- AI提示词生成
- ComfyUI图片生成
- 图片保存

#### event-handlers.ts

- 聊天事件处理
- 按钮点击处理
- 生成流程控制

### 工具模块 (utils/)

#### utils.ts

- OpenAI API调用
- SillyTavern代理请求

#### error-handler.ts

- 统一错误处理
- 错误日志记录
- 用户友好提示

#### logger.ts

- 日志系统
- 级别控制(环境变量)

## 数据流

### 图片生成流程

```
1. 用户点击"生成图片"按钮
   ↓
2. event-handlers.ts: handleGenerateImageButtonClick()
   ↓
3. image-generator.ts: handleStartGeneration()
   ↓
4. 生成AI提示词: generateComfyPromptFromMessage()
   ├─> utils.ts: callSillyTavernOpenAI()
   └─> OpenAI API
   ↓
5. 调用ComfyUI: callComfyUIGenerate()
   ├─> workflow-manager.ts: getSelectedWorkflow()
   ├─> api-service.ts: (替换占位符)
   └─> ComfyUI API
   ↓
6. 保存图片: saveGeneratedImage()
   └─> SillyTavern: saveBase64AsFile()
```

### 配置加载流程

```
1. 扩展初始化
   ↓
2. ui-config-core.ts: initializeUI()
   ↓
3. loadSettings()
   ├─> ui-manager.ts: getSettings()
   └─> localStorage
   ↓
4. populateComfyOptions()
   ├─> api-service.ts: loadAllComfyOptions()
   │   ├─> 检查缓存(5分钟)
   │   └─> ComfyUI API
   └─> ui-manager.ts: populateSelectOptions()
```

## 环境变量

支持通过环境变量配置：

- `VITE_DEBUG_MODE`: 调试模式
- `VITE_DEFAULT_COMFY_URL`: 默认ComfyUI地址
- `VITE_LOG_LEVEL`: 日志级别
- `VITE_CACHE_EXPIRE_TIME`: 缓存过期时间
- `VITE_DEFAULT_OPENAI_*`: OpenAI相关配置

## 缓存策略

- **模型/采样器/调度器/VAE**: 5分钟缓存
- **工作流列表**: 无缓存(实时)
- **用户设置**: localStorage持久化

## 错误处理

- 网络错误: 静默处理，返回空数组
- API错误: 记录日志，显示toast提示
- 用户操作错误: 友好提示

## 性能优化

- 并行加载ComfyUI选项(Promise.all)
- localStorage缓存减少API调用
- 事件委托减少监听器数量
- 延迟检查减少DOM查询

## 扩展点

### 添加新的UI配置模块

1. 在 `ui/` 目录创建新文件
2. 实现配置逻辑
3. 在 `ui-config.ts` 中重新导出
4. 在 `ui-config-core.ts` 中集成

### 添加新的服务

1. 在 `services/` 目录创建新文件
2. 实现服务逻辑
3. 在需要的地方导入使用

### 添加新的占位符

1. 在 `workflow-manager.ts` 的 `PLACEHOLDERS` 数组添加
2. 在 `replaceWorkflowPlaceholders()` 函数添加替换逻辑

## 版本兼容性

- Node.js: 16+
- TypeScript: 6.0+
- SillyTavern: 1.10.0+
- Vite: 5.0+
