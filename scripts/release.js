#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 获取版本号参数
const version = process.argv[2];
if (!version) {
    console.error('❌ 请提供版本号，例如: node scripts/release.js v1.0.0');
    process.exit(1);
}

// 验证版本号格式
if (!version.match(/^v\d+\.\d+\.\d+$/)) {
    console.error('❌ 版本号格式错误，请使用 v1.0.0 格式');
    process.exit(1);
}

console.log(`🚀 开始发布版本: ${version}`);

try {
    // 1. 更新 package.json 版本
    console.log('📝 更新 package.json 版本...');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    packageJson.version = version.substring(1); // 移除 'v' 前缀
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

    // 2. 更新 manifest.json 版本
    console.log('📝 更新 manifest.json 版本...');
    const manifestJson = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
    manifestJson.version = version.substring(1);
    fs.writeFileSync('manifest.json', JSON.stringify(manifestJson, null, 4));

    // 3. 构建项目
    console.log('🔨 构建项目...');
    execSync('npm run build', { stdio: 'inherit' });

    // 4. 提交更改
    console.log('📤 提交更改...');
    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "Release ${version}"`, { stdio: 'inherit' });

    // 5. 创建标签
    console.log('🏷️ 创建标签...');
    execSync(`git tag ${version}`, { stdio: 'inherit' });

    // 6. 推送代码和标签
    console.log('🚀 推送代码和标签...');
    execSync('git push origin main', { stdio: 'inherit' });
    execSync(`git push origin ${version}`, { stdio: 'inherit' });

    console.log('✅ 发布完成！');
    console.log(`🎉 版本 ${version} 已发布`);
    console.log('📋 GitHub Actions 将自动构建并创建 Release');
    console.log(`🔗 查看发布状态: https://github.com/shanmaocc/Text-Image-Generator/actions`);

} catch (error) {
    console.error('❌ 发布失败:', error.message);
    process.exit(1);
}
