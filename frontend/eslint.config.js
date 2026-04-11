const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');
const nextConfig = require('eslint-config-next/core-web-vitals');

module.exports = [
  // Next.js base rules (flat config array — already includes import, @typescript-eslint, react, react-hooks, jsx-a11y, @next/next)
  ...nextConfig,

  // Additional rules for TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      'prettier': prettierPlugin,
    },
    rules: {
      // Prettier como regla de ESLint
      'prettier/prettier': 'error',

      // TypeScript (plugin already registered by eslint-config-next)
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],

      // Imports (plugin already registered by eslint-config-next)
      'import/order': ['warn', {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      }],
      'import/no-duplicates': 'error',

      // Generales
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
    },
  },

  // Ignorar archivos generados
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**'],
  },

  prettierConfig,
];
