# 贡献指南

感谢你考虑为 Text-Image-Generator 做出贡献！

## 开发流程

### 1. Fork 项目

在 GitHub 上 Fork 本项目到你的账户。

### 2. 克隆到本地

```bash
git clone https://github.com/你的用户名/Text-Image-Generator.git
cd Text-Image-Generator
npm install
```

### 3. 创建特性分支

```bash
git checkout -b feature/你的功能名称
# 或者
git checkout -b fix/修复问题描述
```

### 4. 开发和测试

#### 开发模式

```bash
npm run build:watch  # 监视文件变化并自动构建
```

#### 在 SillyTavern 中测试

1. 确保 SillyTavern 正在运行
2. 每次构建后刷新浏览器
3. 测试你的更改

### 5. 代码规范检查

```bash
npm run lint          # 检查代码规范
npm run lint:fix      # 自动修复问题
npm run format        # 格式化代码
npm run type-check    # TypeScript 类型检查
```

### 6. 提交代码

```bash
git add .
git commit -m "feat: 添加新功能"  # 使用语义化提交
git push origin feature/你的功能名称
```

### 7. 创建 Pull Request

在 GitHub 上创建 Pull Request，描述你的更改。

---

## 代码规范

### TypeScript 规范

- ✅ 使用 TypeScript 严格模式
- ✅ 禁止使用 `console.*`，使用 `log.*`
- ✅ 禁止使用 `as any`
- ✅ 所有公共函数添加 JSDoc 注释
- ✅ 使用类型守卫处理类型断言

### 命名规范

- ✅ 文件名：`kebab-case.ts`
- ✅ 变量/函数：`camelCase`
- ✅ 类/接口：`PascalCase`
- ✅ 常量：`UPPER_SNAKE_CASE`

### 目录结构

```
src/component/
  ├── config/              # 配置
  ├── image-generation/    # 图片生成
  ├── services/            # 服务层
  ├── ui/                  # UI 配置
  ├── types/               # 类型定义
  └── utils/               # 工具函数
```

---

## 提交规范

使用语义化提交信息：

- `feat:` 新功能
- `fix:` 修复 Bug
- `docs:` 文档更新
- `style:` 代码格式（不影响代码运行）
- `refactor:` 重构（不是新增功能，也不是修复 Bug）
- `perf:` 性能优化
- `chore:` 构建过程或辅助工具的变动

### 示例

```
feat: 添加图片放大功能
fix: 修复工作流加载失败的问题
docs: 更新 README 安装说明
refactor: 重构缓存系统使用 LRU 算法
perf: 优化 DOM 查询性能
```

---

## 测试指南

### 手动测试清单

在提交 PR 前，请确保测试以下功能：

- [ ] 插件加载成功
- [ ] 生成图片按钮正确显示
- [ ] 图片生成功能正常
- [ ] ComfyUI 连接测试通过
- [ ] 工作流选择和编辑正常
- [ ] 设置保存和恢复正常
- [ ] 样式管理功能正常
- [ ] 控制台无错误日志

### 测试环境

- SillyTavern 最新版
- ComfyUI 正常运行
- OpenAI 兼容 API 可用

---

## Pull Request 指南

### PR 标题

使用清晰的标题描述你的更改：

- `feat: 添加 xxx 功能`
- `fix: 修复 xxx 问题`

### PR 描述模板

```markdown
## 更改说明

简要描述你的更改。

## 更改类型

- [ ] 新功能
- [ ] Bug 修复
- [ ] 文档更新
- [ ] 代码重构
- [ ] 性能优化

## 测试

描述你如何测试这些更改。

## 截图（如适用）

添加截图帮助审查者理解更改。

## 相关 Issue

关闭 #issue_number
```

---

## 需要帮助？

- 📖 查看 [README.md](./README.md)
- 🏗️ 查看 [ARCHITECTURE.md](./ARCHITECTURE.md)
- 💬 创建 [Issue](https://github.com/shanmaocc/Text-Image-Generator/issues) 提问
- 📧 联系维护者

---

感谢你的贡献！🎉
