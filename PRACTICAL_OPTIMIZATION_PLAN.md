# 实用优化方案（移除测试部分）

## 📅 更新日期

2025年10月17日

## 🎯 优化原则

- ✅ 实用为主，不过度工程化
- ✅ 插件环境优先，直接在主站测试
- ✅ 快速见效，立即可用

---

## 🔴 高优先级（建议立即执行）

### 1. ✅ 添加 ESLint 和 Prettier 配置（30分钟）

**为什么需要：**

- 统一代码风格
- 自动发现潜在问题
- 提升代码质量

**操作步骤：**

```bash
# 检查是否已有配置文件
ls -la | grep -E ".eslintrc|.prettierrc"
```

如果没有，创建配置文件：

#### .eslintrc.js

```javascript
module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
    },
    plugins: ['@typescript-eslint'],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    rules: {
        // 禁止 console，使用 log
        'no-console': 'error',

        // 禁止 any
        '@typescript-eslint/no-explicit-any': 'error',

        // 未使用变量
        '@typescript-eslint/no-unused-vars': [
            'error',
            {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            },
        ],

        // 代码风格
        'prefer-const': 'error',
        'no-var': 'error',

        // 函数返回类型（警告即可）
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
    ignorePatterns: ['dist/', 'node_modules/', '*.js'],
};
```

#### .prettierrc

```json
{
    "semi": true,
    "trailingComma": "es5",
    "singleQuote": true,
    "printWidth": 100,
    "tabWidth": 4,
    "useTabs": false,
    "arrowParens": "avoid",
    "endOfLine": "auto"
}
```

#### .prettierignore

```
dist/
node_modules/
*.js.map
```

**验证：**

```bash
npm run lint
npm run format:check
```

---

### 2. 🔒 安全性修复（1小时）

#### 2.1 XSS 防护

**问题位置：**

- `src/component/image-generation/button-manager.ts`

**解决方案：**

```typescript
// src/component/utils/security.ts
/**
 * HTML 转义工具
 */
export function escapeHtml(unsafe: string): string {
    const div = document.createElement('div');
    div.textContent = unsafe;
    return div.innerHTML;
}

/**
 * 安全地设置属性值
 */
export function safeAttr(value: string | number): string {
    return String(value).replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
```

**更新 button-manager.ts：**

```typescript
import { safeAttr } from '../utils/security';

export function createGenerateButtonHTML(mesId: string): string {
    const safeMesId = safeAttr(mesId);
    return `
        <button class="generate-image-btn" data-mes-id="${safeMesId}">
            <span class="btn-text">生成图片</span>
            <i class="fa-solid fa-spinner fa-spin btn-loading" style="display:none;margin-left:8px;"></i>
        </button>
    `;
}
```

#### 2.2 API 密钥保护

**问题：**
API 密钥明文存储在 localStorage 中

**解决方案：**

```typescript
// src/component/utils/security.ts

/**
 * 脱敏显示 API 密钥
 */
export function maskApiKey(key: string): string {
    if (!key || key.length < 8) return '***';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

/**
 * 验证 API 密钥格式
 */
export function validateApiKey(key: string): boolean {
    // OpenAI 格式：sk-xxx
    if (key.startsWith('sk-')) {
        return key.length >= 20;
    }
    // 其他格式的基本检查
    return key.length >= 16;
}

/**
 * 清理日志中的敏感信息
 */
export function sanitizeForLog(data: unknown): unknown {
    if (typeof data === 'string') {
        // 替换 API 密钥
        return data.replace(/sk-[a-zA-Z0-9]{32,}/g, 'sk-***');
    }
    if (typeof data === 'object' && data !== null) {
        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(data)) {
            if (key.toLowerCase().includes('key') || key.toLowerCase().includes('token')) {
                sanitized[key] = '***';
            } else {
                sanitized[key] = sanitizeForLog(value);
            }
        }
        return sanitized;
    }
    return data;
}
```

**更新日志输出：**

```typescript
// src/component/utils/openai-client.ts
import { sanitizeForLog } from './security';

// 在日志中使用
log.debug('Request body:', sanitizeForLog(requestBody));
```

---

### 3. ⚡ 性能优化（2小时）

#### 3.1 改进缓存策略

**创建 LRU 缓存：**

```typescript
// src/component/utils/lru-cache.ts
/**
 * LRU 缓存实现
 */
export class LRUCache<K, V> {
    private cache = new Map<K, { value: V; timestamp: number; hits: number }>();
    private maxSize: number;
    private ttl: number;

    constructor(maxSize: number = 50, ttl: number = 5 * 60 * 1000) {
        this.maxSize = maxSize;
        this.ttl = ttl;
    }

    set(key: K, value: V): void {
        // 删除最旧的条目
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.findLeastRecentlyUsed();
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }

        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            hits: 0,
        });
    }

    get(key: K): V | null {
        const item = this.cache.get(key);
        if (!item) return null;

        // 检查是否过期
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        // 更新访问次数
        item.hits++;
        return item.value;
    }

    private findLeastRecentlyUsed(): K | null {
        let lruKey: K | null = null;
        let minHits = Infinity;

        for (const [key, item] of this.cache.entries()) {
            if (item.hits < minHits) {
                minHits = item.hits;
                lruKey = key;
            }
        }

        return lruKey;
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }
}
```

**应用到 API Service：**

```typescript
// src/component/services/api-service.ts
import { LRUCache } from '../utils/lru-cache';

// 替换原有的简单缓存
const optionsCache = new LRUCache<string, ComfyUIOption[]>(50, 5 * 60 * 1000);

export async function loadComfyModels(settings: ComfyUISettings): Promise<ComfyUIOption[]> {
    const cacheKey = `models_${settings.comfyUrl}`;

    // 检查缓存
    const cached = optionsCache.get(cacheKey);
    if (cached) {
        log.debug('使用缓存的模型列表');
        return cached;
    }

    // 加载并缓存
    const models = await callComfyAPI<ComfyUIOption[]>('/api/sd/comfy/models', settings);
    optionsCache.set(cacheKey, models);
    return models;
}
```

#### 3.2 DOM 查询优化

```typescript
// src/component/utils/dom-cache.ts
/**
 * DOM 元素缓存
 */
class DOMCache {
    private cache = new Map<string, JQuery<HTMLElement>>();
    private observer: MutationObserver;

    constructor() {
        // 监听 DOM 变化，清理无效缓存
        this.observer = new MutationObserver(() => {
            this.cache.clear();
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    get(selector: string): JQuery<HTMLElement> {
        if (!this.cache.has(selector)) {
            this.cache.set(selector, $(selector));
        }
        return this.cache.get(selector)!;
    }

    clear(): void {
        this.cache.clear();
    }
}

export const domCache = new DOMCache();
```

**使用示例：**

```typescript
// 替代频繁的 $('#chat') 查询
import { domCache } from '../utils/dom-cache';

const chatContainer = domCache.get('#chat');
```

---

## 🟡 中优先级（可选执行）

### 4. 📝 完善 Git 配置

#### .gitignore

```
# 依赖
node_modules/

# 构建输出
dist/
*.map

# 日志
*.log
npm-debug.log*

# 环境变量
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.sublime-*

# 操作系统
.DS_Store
Thumbs.db

# 临时文件
*.tmp
*.bak
*.swp
```

#### .gitattributes

```
# 统一行尾符
* text=auto
*.ts text eol=lf
*.js text eol=lf
*.json text eol=lf
*.md text eol=lf
```

---

### 5. 📚 最小化文档

#### CHANGELOG.md（简化版）

```markdown
# 更新日志

## [0.2.0] - 2025-10-17

### 新增

- 目录重命名优化（image → image-generation）
- 类型守卫和类型安全改进
- 安全性增强（XSS 防护、API 密钥保护）

### 优化

- 统一日志系统（移除所有 console 调用）
- 代码结构重构（config 拆分、utils 重组）
- 性能优化（LRU 缓存、DOM 查询优化）

### 修复

- 类型安全问题（移除所有 as any）
- 命名不一致问题

## [0.1.0] - 初始版本

- 基础图片生成功能
- ComfyUI 集成
- OpenAI API 集成
```

#### CONTRIBUTING.md（简化版）

```markdown
# 贡献指南

## 开发流程

1. Fork 项目
2. 克隆到本地
3. 创建特性分支：`git checkout -b feature/xxx`
4. 提交代码：`git commit -m "feat: xxx"`
5. 推送到 Fork：`git push origin feature/xxx`
6. 创建 Pull Request

## 代码规范

- 使用 TypeScript 严格模式
- 禁止使用 `console.*`，使用 `log.*`
- 禁止使用 `as any`
- 运行 `npm run lint` 和 `npm run format` 检查代码

## 测试

在 SillyTavern 主站环境中测试：

1. 复制到 `SillyTavern/public/scripts/extensions/third-party/Text-Image-Generator/`
2. 运行 `npm run build`
3. 重启 SillyTavern
4. 测试功能

## 提交规范

使用语义化提交：

- `feat:` 新功能
- `fix:` 修复
- `docs:` 文档
- `style:` 格式
- `refactor:` 重构
- `perf:` 性能
- `test:` 测试
- `chore:` 构建/工具
```

---

## 🟢 低优先级（未来考虑）

### 6. 🔧 开发工具配置

#### .vscode/settings.json

```json
{
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    },
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "typescript.tsdk": "node_modules/typescript/lib",
    "files.exclude": {
        "node_modules": true,
        "dist": true
    }
}
```

#### .vscode/extensions.json

```json
{
    "recommendations": ["dbaeumer.vscode-eslint", "esbenp.prettier-vscode", "usernamehw.errorlens"]
}
```

---

## 📊 优化收益（移除测试后）

| 优化项          | 工作量 | 代码质量 | 安全性     | 性能     | 推荐度 |
| --------------- | ------ | -------- | ---------- | -------- | ------ |
| ESLint/Prettier | 30分钟 | ⭐⭐⭐⭐ | -          | -        | ✅✅✅ |
| 安全性修复      | 1小时  | ⭐⭐⭐   | ⭐⭐⭐⭐⭐ | -        | ✅✅✅ |
| 性能优化        | 2小时  | ⭐⭐     | -          | ⭐⭐⭐⭐ | ✅✅   |
| 文档完善        | 1小时  | ⭐⭐     | -          | -        | ✅     |
| 开发工具        | 30分钟 | ⭐⭐     | -          | -        | ✅     |

---

## 🚀 快速执行方案

### 方案 A：最小化优化（3小时）✅ 推荐

**适合：** 快速提升代码质量

1. ✅ ESLint/Prettier 配置（30分钟）
2. ✅ 安全性修复（1小时）
3. ✅ 创建安全工具模块（30分钟）
4. ✅ 添加 CHANGELOG.md（30分钟）
5. ✅ 基础性能优化（30分钟）

### 方案 B：全面优化（5小时）

**适合：** 长期维护的项目

方案 A + 以下内容：

- ✅ 完整性能优化（2小时）
- ✅ 完善文档（1小时）
- ✅ 开发工具配置（30分钟）

---

## ✅ 执行清单

### 立即执行（高优先级）

- [ ] 创建 `.eslintrc.js`
- [ ] 创建 `.prettierrc`
- [ ] 创建 `src/component/utils/security.ts`
- [ ] 更新 `button-manager.ts` 使用安全工具
- [ ] 更新日志输出使用 `sanitizeForLog`
- [ ] 验证：`npm run lint` 和 `npm run format`

### 可选执行（中优先级）

- [ ] 创建 `src/component/utils/lru-cache.ts`
- [ ] 更新 `api-service.ts` 使用 LRU 缓存
- [ ] 创建 `CHANGELOG.md`
- [ ] 创建 `CONTRIBUTING.md`
- [ ] 更新 `.gitignore`

### 未来考虑（低优先级）

- [ ] VSCode 配置
- [ ] DOM 缓存优化
- [ ] 更多性能优化

---

## 🎯 成功标准

优化完成后，项目应该达到：

✅ **代码质量**

- 通过 ESLint 检查
- 统一的代码格式
- 零 console 调用
- 零 as any 使用

✅ **安全性**

- XSS 防护
- API 密钥保护
- 日志脱敏

✅ **性能**

- 智能缓存
- 减少不必要的 DOM 查询

✅ **可维护性**

- 清晰的文档
- 统一的代码风格
- 便于贡献

---

## 💡 总结

**移除测试后的优化方案更加实用：**

- ✅ 关注实际痛点（安全、性能、代码质量）
- ✅ 快速见效（3-5小时完成核心优化）
- ✅ 易于维护（无需复杂的测试基础设施）
- ✅ 符合插件开发模式（在主站环境测试）

**建议：从方案 A 开始，逐步实施！**
