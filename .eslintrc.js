module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.json',
  },
  env: {
    browser: true,
    commonjs: true,
    es6: true,
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    '@colony/eslint-config-colony',
    'prettier',
  ],
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    // Using the typescript-eslint version for these
    'no-unused-vars': 'off',
    'no-undef': 'off',
    // TypeScript overloads
    'no-dupe-class-members': 'off',
    'no-redeclare': 'off',
    '@typescript-eslint/no-redeclare': 'warn',
    camelcase: ['error', { allow: ['^TEMP_'] }],
    'eslint-comments/disable-enable-pair': ['error', { allowWholeFile: true }],

    // @typescript-eslint
    '@typescript-eslint/ban-ts-ignore': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/no-object-literal-type-assertion': 'off',
    '@typescript-eslint/prefer-interface': 'off',
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-empty-function': 'off',

    // import plugin (resolvers disabled in favour of using typescript)
    'import/no-unresolved': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/prefer-default-export': 'off',
    'import/order': [
      'error',
      {
        alphabetize: {
          caseInsensitive: true,
          order: 'asc',
        },
        groups: [
          ['builtin', 'external'],
          'internal',
          'parent',
          'sibling',
          'index',
          'object',
          'type',
        ],
        'newlines-between': 'always',
        pathGroups: [
          {
            pattern: '~*/**',
            group: 'internal',
          },
          {
            pattern: '~**',
            group: 'internal',
          },
          {
            pattern: '{.,..}/**/*.css',
            group: 'type',
            position: 'after',
          },
        ],
        warnOnUnassignedImports: true,
      },
    ],

    // Disallow TODO but not @todo; these are expected to be handled by the jsdoc plugin
    'no-warning-comments': [
      'error',
      { terms: ['fixme', 'todo', 'xxx', '@fixme'], location: 'start' },
    ],
    'jsdoc/check-indentation': 'off',
    'no-restricted-exports': 'off',
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': ['error', 'nofunc'],
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        fixStyle: 'inline-type-imports',
      },
    ],
    '@typescript-eslint/consistent-type-exports': [
      'error',
      {
        fixMixedExportsWithInlineTypeSpecifier: true,
      },
    ],
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': ['error'],
    '@typescript-eslint/ban-ts-comment': 'off',
    'default-param-last': 'off',
    'max-len': [
      'error',
      {
        code: 120,
        // Allow import, export and implements statements. Also long backticks
        ignorePattern: '^import [^,]+ from |^export | implements | `.{30,}`',
        ignoreComments: true,
        tabWidth: 2,
        ignoreUrls: true,
        ignoreStrings: true,
      },
    ],
    // Allow for-of loops
    'no-restricted-syntax': [
      'error',
      'ForInStatement',
      'LabeledStatement',
      'WithStatement',
    ],
    'no-underscore-dangle': ['error', { allow: ['__typename'] }],
    'max-params': ['error', { max: 3 }],
  },
};
