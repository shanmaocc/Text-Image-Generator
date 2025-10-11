# 发布指南

## 发布流程

### 自动构建策略

我们提供了两种构建策略：

#### 策略一：智能自动构建（默认）
- **触发条件**：只有当以下文件发生变化时才构建：
  - `src/**` - 源代码文件
  - `package.json` - 依赖配置
  - `tsconfig.json` - TypeScript配置
  - `vite.config.ts` - 构建配置
  - `manifest.json` - 扩展配置
- **优势**：避免不必要的构建，节省资源
- **适用场景**：日常开发，只修改代码时

#### 策略二：按需构建
- **触发条件**：
  - 手动触发（GitHub Actions页面）
  - 发布标签时（`v*`）
- **优势**：完全控制构建时机
- **适用场景**：需要精确控制构建时机的场景

### 开发流程

1. **日常开发**：
   ```bash
   git add .
   git commit -m "feat: 新功能描述"
   git push origin main
   ```
   - 如果修改了源代码，会自动构建
   - 如果只修改文档等，不会触发构建

2. **手动构建**（如果需要）：
   - 访问 GitHub Actions 页面
   - 选择 "Build on Demand" 工作流
   - 点击 "Run workflow"

### 版本发布

1. **使用发布脚本**：
   ```bash
   node scripts/release.js v1.0.0
   ```

2. **手动发布**：
   ```bash
   # 1. 更新版本号
   npm version patch  # 或 minor, major
   
   # 2. 构建项目
   npm run build
   
   # 3. 提交并推送
   git add .
   git commit -m "Release v1.0.0"
   git tag v1.0.0
   git push origin main
   git push origin v1.0.0
   ```

## 用户安装方式

### 方式一：SillyTavern 内置安装（推荐）

1. 打开 SillyTavern
2. 进入 **扩展设置** → **安装扩展**
3. 在 **Git 仓库 URL** 中输入：
   ```
   https://github.com/shanmaocc/Text-Image-Generator.git
   ```
4. 点击 **安装**
5. 安装完成后，在扩展列表中启用 **Text Image Generator**

### 方式二：手动安装

1. 克隆仓库：
   ```bash
   git clone https://github.com/shanmaocc/Text-Image-Generator.git
   ```

2. 复制到 SillyTavern 扩展目录：
   ```
   SillyTavern/public/scripts/extensions/third-party/Text-Image-Generator/
   ```

## 版本管理

- **主版本号**：不兼容的 API 修改
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正

## 发布检查清单

- [ ] 更新版本号
- [ ] 更新 CHANGELOG.md
- [ ] 测试构建
- [ ] 提交代码
- [ ] 创建标签
- [ ] 推送代码和标签
- [ ] 验证 GitHub Actions 构建成功
- [ ] 检查 Release 页面

## 故障排除

### 构建失败
- 检查 Node.js 版本（需要 16+）
- 清理 node_modules 并重新安装
- 检查 TypeScript 编译错误

### GitHub Actions 失败
- 检查 workflow 文件语法
- 查看 Actions 日志
- 确保仓库有正确的权限设置

### 用户安装问题
- 确保 SillyTavern 版本兼容
- 检查扩展目录权限
- 查看浏览器控制台错误
