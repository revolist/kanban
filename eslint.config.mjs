import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/artifacts/**',
      '**/.artifacts/**',
      '**/test-results/**',
      '**/playwright-report/**',
    ],
  },
  {
    files: [
      'package/**/*.{ts,tsx}',
      'src/examples/community/*.{ts,tsx}',
      'scripts/*package.mjs',
      'scripts/prepare-public-workspace.mjs',
      'scripts/core-contracts.test.mjs',
      'scripts/prepare-consumer.mjs',
      'tests/community/**/*.{ts,mjs}',
      '*config.{ts,mjs}',
    ],
    languageOptions: { parser: tseslint.parser },
    rules: {
      curly: ['error', 'all'],
      'max-len': ['error', { code: 120, tabWidth: 2 }],
    },
  },
);
