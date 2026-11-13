import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/artifacts/**', '**/test-results/**', '**/playwright-report/**'] },
  {
    files: ['**/*.{ts,tsx,mjs}'],
    languageOptions: { parser: tseslint.parser },
    rules: {
      curly: ['error', 'all'],
      'max-len': ['error', { code: 120, tabWidth: 2 }],
    },
  },
);
