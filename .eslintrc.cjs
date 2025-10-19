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
        // 禁止 console，强制使用 log
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

        // 函数返回类型（不强制，因为 TS 推断已经很好）
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',

        // 允许空函数（单例模式的私有构造函数需要）
        '@typescript-eslint/no-empty-function': ['warn', { allow: ['private-constructors'] }],

        // 允许 require
        '@typescript-eslint/no-require-imports': 'off',
    },
    ignorePatterns: [
        'dist/',
        'node_modules/',
        '*.js',
        '*.cjs',
        'vite.config.ts',
        'src/@types/**/*', // 类型定义文件允许使用 any
    ],
};
