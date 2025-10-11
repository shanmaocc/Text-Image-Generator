#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Building Text-Image-Generator extension with Vite...');

try {
    // 清理dist目录
    if (fs.existsSync('./dist')) {
        fs.rmSync('./dist', { recursive: true });
    }

    // 使用 Vite 构建
    console.log('📦 Building with Vite...');
    execSync('npm run build', { stdio: 'inherit' });

    // 只构建 JS 文件，其他文件保持在根目录
    console.log('📋 Build completed - only JS file in dist/');

    console.log('✅ Build completed successfully!');
    console.log('📁 Output directory: ./dist');
    console.log('🎯 Ready for deployment to SillyTavern');
    console.log('📝 Extension file: index.js');

} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}

