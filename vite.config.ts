import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  // 构建配置
  build: {
    target: 'es2022', // 必须支持top-level await
    outDir: 'dist',
    rollupOptions: {
      // 入口配置
      input: {
        // 主入口
        index: resolve(__dirname, 'src/index.ts'),
      },
      output: {
        // 保持文件名简洁
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      },
      // 外部化 SillyTavern 依赖
      external: (id) => {
        return id.startsWith('@sillytavern/') ||
               id.startsWith('jquery') ||
               id.includes('pdf.min') ||
               id.includes('epub.min') ||
               id.includes('jszip.min')
      }
    },
    // 生成 source map，方便调试
    sourcemap: true,
    // 使用默认的 esbuild 压缩，更快
    minify: 'esbuild',
    // 减少chunk大小警告
    chunkSizeWarningLimit: 1000
  },

  // 开发服务器配置
  server: {
    port: 3000,
    open: false, // 不自动打开浏览器
    cors: true
  },

  // 预览服务器配置
  preview: {
    port: 4173,
    open: false
  },

  // 路径别名
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@types': resolve(__dirname, '@types'),
      // '@sillytavern': resolve(__dirname, '../../../../../'),
    }
  },

  // 优化配置
  optimizeDeps: {
    include: ['jquery']
  },

  // 插件配置
  plugins: [
    // 替换别名路径为相对路径
    {
      name: 'replace-alias-paths',
      generateBundle(options, bundle) {
        for (const fileName in bundle) {
          const chunk = bundle[fileName];
          if (chunk.type === 'chunk' && chunk.code) {
            // 替换 @sillytavern/ 为相对路径，并添加 .js 扩展名
            chunk.code = chunk.code.replace(/@sillytavern\/([^'"]*?)(?=['"])/g, (match, path) => {
              return `../../../../../${path}${path.endsWith('.js') ? '' : '.js'}`;
            });
          }
        }
      }
    }
  ]
})
