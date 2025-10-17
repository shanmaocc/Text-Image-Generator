# 环境变量配置说明

## 📖 概述

本项目使用 **Vite 的环境变量系统**来管理配置参数，支持在开发和构建时自定义配置。

## 🔧 工作原理

### 1. **什么是 `import.meta.env`？**

`import.meta.env` 是 Vite 提供的环境变量访问接口：

```typescript
// 源代码
const url = import.meta.env.VITE_DEFAULT_COMFY_URL || 'http://127.0.0.1:8188';

// 构建后（假设 .env 中设置了 VITE_DEFAULT_COMFY_URL=http://192.168.1.100:8188）
const url = 'http://192.168.1.100:8188' || 'http://127.0.0.1:8188';
```

### 2. **工作流程**

1. **读取配置**：Vite 在开发/构建时读取 `.env` 文件
2. **编译时替换**：`import.meta.env.VITE_*` 被直接替换为字符串字面量
3. **Tree-shaking**：未使用的代码和环境变量会被优化掉
4. **运行时**：代码中已经是硬编码的值，性能更好

### 3. **与传统环境变量的区别**

| 特性         | 传统 `process.env` | Vite `import.meta.env`    |
| ------------ | ------------------ | ------------------------- |
| 替换时机     | 运行时             | 编译时                    |
| 性能         | 需要运行时查找     | 直接内联，零开销          |
| Tree-shaking | 不支持             | 支持                      |
| 浏览器支持   | ❌ 不支持          | ✅ 支持                   |
| 安全性       | 可能泄露服务端变量 | 只暴露 `VITE_` 前缀的变量 |

## 📝 配置文件

### `.env.example` - 配置模板

```bash
# Text-Image-Generator extension environment variables example
# Copy this file to .env and modify as needed

# ========== ComfyUI Config ==========
VITE_DEFAULT_COMFY_URL=http://127.0.0.1:8188

# ========== OpenAI Config ==========
VITE_DEFAULT_OPENAI_API_URL=
VITE_DEFAULT_OPENAI_MAX_TOKENS=65500
VITE_DEFAULT_OPENAI_TEMPERATURE=1.2
VITE_DEFAULT_OPENAI_CONTEXT_COUNT=2

# ========== Debug Config ==========
# Debug mode (true/false)
VITE_DEBUG_MODE=false

# Log level (trace/debug/info/warn/error/silent)
VITE_LOG_LEVEL=info
```

### `.env` - 本地配置（不提交到 Git）

复制 `.env.example` 并根据需要修改：

```bash
cp .env.example .env
```

## 🎯 使用方法

### 1. **在代码中使用**

```typescript
// src/component/config/constants.ts
export const APP_CONSTANTS = {
    // 从环境变量读取，提供默认值
    DEFAULT_COMFY_URL: import.meta.env.VITE_DEFAULT_COMFY_URL || 'http://127.0.0.1:8188',

    // 布尔值需要字符串比较
    DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',

    // 数值需要解析
    DEFAULT_SETTINGS: {
        openaiMaxTokens: parseInt(import.meta.env.VITE_DEFAULT_OPENAI_MAX_TOKENS) || 65500,
        openaiTemperature: parseFloat(import.meta.env.VITE_DEFAULT_OPENAI_TEMPERATURE) || 1.2,
    },
};
```

### 2. **TypeScript 类型支持**

类型定义在 `src/@types/env.d.ts`：

```typescript
declare global {
    interface ImportMetaEnv {
        readonly VITE_DEFAULT_COMFY_URL?: string;
        readonly VITE_DEBUG_MODE?: string;
        // ... 其他变量
    }

    interface ImportMeta {
        readonly env: ImportMetaEnv;
    }
}
```

这样就能获得完整的 **TypeScript 智能提示** 和 **类型检查**！

## 🔒 安全性

### ⚠️ 重要提示

1. **只有 `VITE_` 前缀的变量会被暴露到客户端代码**
2. **不要在 `.env` 中存储敏感信息**（如私钥、密码等）
3. **`.env` 文件已在 `.gitignore` 中，不会被提交到 Git**

### 安全的做法 ✅

```bash
# 可以安全暴露的配置
VITE_DEFAULT_COMFY_URL=http://127.0.0.1:8188
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

### 不安全的做法 ❌

```bash
# 不要这样做！这些会被编译到客户端代码中
VITE_OPENAI_SECRET_KEY=sk-xxxxxxxxxxxx  # ❌ 危险
VITE_DATABASE_PASSWORD=mypassword123    # ❌ 危险
```

## 🎨 不同环境的配置

Vite 支持多个环境文件：

```
.env                # 所有环境都会加载
.env.local          # 所有环境，但会被 Git 忽略
.env.development    # 开发环境
.env.production     # 生产环境
```

优先级（从高到低）：

1. `.env.production.local` (生产 + 本地)
2. `.env.production` (生产)
3. `.env.local` (本地)
4. `.env` (通用)

## 🐛 调试

### 开启调试模式

```bash
# .env
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

### 查看构建后的值

```bash
npm run build
cat dist/index.js | grep "127.0.0.1"  # 查看 ComfyUI URL 是否被正确替换
```

### 验证环境变量是否生效

在浏览器控制台中：

```javascript
// 如果使用了 DEBUG_MODE，会看到更多日志
console.log(log.getLevel()); // 应该显示对应的日志级别
```

## 📚 参考资料

- [Vite 环境变量文档](https://vitejs.dev/guide/env-and-mode.html)
- [TypeScript 全局类型声明](https://www.typescriptlang.org/docs/handbook/declaration-files/templates/global-d-ts.html)
