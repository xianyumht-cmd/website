module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true,
    jest: true
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  extends: ['eslint:recommended'],
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'test-results/',
    'playwright-report/',
    '**/*.min.js'
  ],
  rules: {
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      caughtErrors: 'none',
      varsIgnorePattern: '^_'
    }]
  }
}
