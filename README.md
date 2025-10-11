# Text-Image-Generator

一个强大的SillyTavern扩展，集成了AI提示词生成和ComfyUI图片生成功能。

## ✨ 功能特性

- 🤖 **AI提示词生成** - 使用OpenAI兼容API自动生成高质量的图片提示词
- 🎨 **ComfyUI集成** - 支持ComfyUI工作流，可自定义图片生成参数
- ⚡ **实时生成** - 在聊天界面中一键生成图片
- 🔧 **灵活配置** - 支持多种模型、采样器、调度器配置
- 📊 **性能监控** - 显示AI访问和图片生成的耗时统计
- 🎯 **智能工作流** - 支持动态工作流替换和占位符系统

## 🚀 快速开始

### 安装

1. 将整个项目文件夹复制到SillyTavern的扩展目录：
   ```
   SillyTavern/public/scripts/extensions/third-party/Text-Image-Generator/
   ```

2. 重启SillyTavern

3. 在扩展设置中找到"Text Image Generator"并启用

### 配置

#### 1. AI API配置
- 在扩展设置中配置OpenAI兼容API的URL和模型
- 支持OpenAI、Claude、本地模型等

#### 2. ComfyUI配置
- 设置ComfyUI服务器地址（默认：http://127.0.0.1:8188）
- 配置模型、VAE、采样器等参数
- 选择或上传ComfyUI工作流文件

#### 3. 图片生成参数
- **分辨率**：支持多种预设分辨率
- **采样步数**：控制生成质量
- **CFG Scale**：控制提示词遵循程度
- **种子**：可设置固定种子或随机生成

## 📖 使用指南

### 基本使用

1. 在聊天界面中，AI回复消息后会出现"生成图片"按钮
2. 点击按钮，扩展会：
   - 使用AI分析消息内容生成提示词
   - 调用ComfyUI生成图片
   - 将图片插入到聊天中

### 高级功能

#### 工作流编辑器
- 支持可视化编辑ComfyUI工作流
- 实时预览工作流结构
- 支持占位符替换系统

#### 占位符系统
支持以下占位符：
- `%prompt%` - 正向提示词
- `%negative_prompt%` - 负面提示词
- `%model%` - 模型名称
- `%vae%` - VAE模型
- `%sampler%` - 采样器
- `%scheduler%` - 调度器
- `%steps%` - 采样步数
- `%scale%` - CFG Scale
- `%width%` - 图片宽度
- `%height%` - 图片高度
- `%seed%` - 随机种子

## 🛠️ 开发

### 项目结构

```
Text-Image-Generator/
├── src/                    # TypeScript源代码
│   ├── index.ts           # 主扩展文件
│   └── component/         # 组件模块
│       ├── config/        # 配置相关
│       ├── services/      # 服务层
│       ├── types/         # 类型定义
│       └── utils/         # 工具函数
├── dist/                  # 编译输出
├── @types/               # 类型定义文件
├── package.json          # 项目配置
├── tsconfig.json         # TypeScript配置
├── vite.config.ts        # Vite构建配置
├── manifest.json         # SillyTavern扩展清单
├── index.html            # 扩展界面模板
└── style.css             # 样式文件
```

### 构建

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build
```

### 技术栈

- **TypeScript** - 类型安全的JavaScript
- **Vite** - 快速构建工具
- **jQuery** - DOM操作和事件处理
- **SillyTavern API** - 扩展框架集成

## 📋 系统要求

- SillyTavern 1.10.0+
- Node.js 16+
- ComfyUI服务器
- OpenAI兼容API（可选）

## 🤝 贡献

欢迎提交Issue和Pull Request！

### 开发流程

1. Fork本项目
2. 创建功能分支：`git checkout -b feature/新功能`
3. 提交更改：`git commit -m '添加新功能'`
4. 推送分支：`git push origin feature/新功能`
5. 提交Pull Request

## 📄 许可证

本项目采用MIT许可证 - 查看[LICENSE](LICENSE)文件了解详情。

## 🙏 致谢

- [SillyTavern](https://github.com/SillyTavern/SillyTavern) - 优秀的AI聊天界面
- [ComfyUI](https://github.com/comfyanonymous/ComfyUI) - 强大的图片生成工作流
- 所有贡献者和用户的支持

## 📞 支持

如果遇到问题或有建议，请：

1. 查看[Issues](https://github.com/shanmaocc/Text-Image-Generator/issues)
2. 创建新的Issue描述问题
3. 加入讨论区交流

---

⭐ 如果这个项目对你有帮助，请给个Star支持一下！
