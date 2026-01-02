module.exports = {
    root: true,
    env: {
        browser: true,
        es2021: true,
        node: true,
        'react-native/react-native': true,
    },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
    ],
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    plugins: ['react', 'react-hooks'],
    settings: {
        react: {
            version: 'detect',
        },
    },
    rules: {
        // React rules
        'react/react-in-jsx-scope': 'off', // Not needed in React 17+
        'react/prop-types': 'off', // Using TypeScript for type checking
        'react/display-name': 'off',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',

        // General rules
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        'no-console': 'off', // Allow console for debugging
        'prefer-const': 'warn',
        'no-var': 'error',
        'eqeqeq': ['warn', 'always'],
        'curly': ['warn', 'multi-line'],

        // Style rules (handled by Prettier, so relaxed here)
        'indent': 'off',
        'quotes': 'off',
        'semi': 'off',
        'comma-dangle': 'off',
    },
    ignorePatterns: [
        'node_modules/',
        'dist/',
        'build/',
        '.expo/',
        'web-build/',
        '*.config.js',
    ],
    globals: {
        __DEV__: 'readonly',
    },
};
