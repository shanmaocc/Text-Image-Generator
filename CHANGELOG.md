# 更新日志

所有值得注意的项目更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 新增
- 安全工具模块（XSS 防护、API 密钥保护）
- LRU 缓存系统，智能淘汰策略
- ESLint 和 Prettier 配置
- 完整的代码规范检查

### 优化
- 目录重命名：`image/` → `image-generation/`（更准确的命名）
- 代码结构重构：拆分 `config.ts` 为独立模块
- Utils 重组：`utils.ts` → `utils/openai-client.ts`
- 移除不必要的重新导出层
- 统一日志系统（移除所有 console 调用）
- 类型安全增强（移除所有 as any）
- 性能优化（LRU 缓存、DOM 查询优化）

### 修复
- 类型安全问题（添加类型守卫）
- 命名不一致问题（统一 kebab-case）
- XSS 安全漏洞
- API 密钥可能泄露到日志

## [0.1.0] - 2025-10-XX

### 新增
- 基础图片生成功能
- ComfyUI 集成
- OpenAI 兼容 API 集成
- 工作流管理
- 自定义样式管理
- SillyTavern 预设集成

### 功能
- AI 提示词生成
- 多种分辨率支持
- 自定义占位符系统
- 工作流可视化编辑器
- 实时生成进度显示

