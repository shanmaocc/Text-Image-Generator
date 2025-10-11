# Text-Image-Generator Extension - TypeScript Development Guide

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```
这将启动TypeScript编译器在监视模式下运行，自动重新编译文件更改。

### 构建生产版本
```bash
npm run build
```

### 类型检查
```bash
npm run type-check
```

### 代码检查
```bash
npm run lint
npm run lint:fix
```

## 📁 项目结构

```
Text-Image-Generator/
├── src/                    # TypeScript源代码
│   └── index.ts           # 主扩展文件
├── types/                 # 类型定义
│   └── sillytavern.d.ts   # SillyTavern类型定义
├── dist/                  # 编译输出目录
├── tsconfig.json          # TypeScript配置
├── package.json           # 项目配置
├── build.js              # 构建脚本
└── .eslintrc.js          # ESLint配置
```

## 🔧 开发工作流

1. **开发**: 在 `src/` 目录中编写TypeScript代码
2. **编译**: 运行 `npm run dev` 自动编译
3. **测试**: 在SillyTavern中测试扩展
4. **构建**: 运行 `npm run build` 生成生产版本
5. **部署**: 将 `dist/` 目录复制到SillyTavern扩展目录

## 📝 类型定义

项目包含完整的TypeScript类型定义：

- `AudioExtensionSettings`: 音频扩展设置类型
- `SillyTavernContext`: SillyTavern上下文类型
- `SlashCommand`: 斜杠命令类型
- 全局变量类型定义

## 🎯 主要功能

- ✅ 动态背景音乐切换
- ✅ 环境音效管理
- ✅ 斜杠命令支持 (`/music`, `/ambient`)
- ✅ 智能文件搜索
- ✅ 音量控制
- ✅ 移动设备支持

## 🔍 调试

使用浏览器开发者工具查看控制台输出：
- 扩展加载状态
- 音频文件搜索
- 斜杠命令执行
- 错误信息

## 📦 部署

1. 运行 `npm run build`
2. 将 `dist/` 目录重命名为扩展名称
3. 复制到SillyTavern的扩展目录
4. 重启SillyTavern

## 🛠️ 技术栈

- **TypeScript**: 类型安全的JavaScript
- **jQuery**: DOM操作和事件处理
- **Fuse.js**: 模糊搜索
- **ESLint**: 代码质量检查
- **SillyTavern API**: 扩展系统集成
