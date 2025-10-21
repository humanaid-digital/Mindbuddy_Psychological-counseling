module.exports = {
  ignorePatterns: ['public/js/api.js'],
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    // 에러 레벨 규칙
    'no-console': 'off', // 개발 중에는 console.log 허용
    'no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-dupe-keys': 'error',

    // 경고 레벨 규칙
    'prefer-const': 'warn',
    'no-var': 'warn',
    'eqeqeq': 'warn',
    'curly': 'warn',

    // 스타일 규칙
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'no-trailing-spaces': 'error',
    'eol-last': 'error'
  },
  overrides: [
    {
      files: ['tests/**/*.js'],
      env: {
        jest: true
      },
      rules: {
        'no-unused-expressions': 'off'
      }
    },
    {
      files: ['scripts/mongo-init.js'],
      env: {
        mongo: true
      },
      globals: {
        db: 'writable',
        print: 'readonly'
      }
    }
  ]
};
