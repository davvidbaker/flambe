/**
 * Borrowed some (not all) conventions from Scott Nonnenberg. 👍
 * https://blog.scottnonnenberg.com/eslint-part-1-exploration/
 *
 * - Always use ‘error’ or ‘off’ instead of 0 and 2. Numbers are for real config values.
 * - Rules are in alphabetical order: first core ESLint, then plugins sorted by name.
 */

module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    'cypress/globals': true,
  },
  parser: 'babel-eslint',
  extends: 'airbnb',
  parserOptions: {
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
    },
    // ecmaVersion: 6,
    sourceType: 'module',
  },
  plugins: ['babel', 'import', 'react', 'jsx-a11y', 'cypress', 'react-hooks'],
  globals: {
    NODE_ENV: true,
    SERVER: true,
    describe: true,
    it: true,
    expect: true,
  },
  rules: {
    'arrow-parens': 'off',
    camelcase: 'off',
    'comma-dangle': 2,
    'max-len': 'off',
    'one-var': 'off',
    'no-bitwise': 'off',
    'no-case-declarations': 'off',
    'no-console': 'off',
    'no-debugger': 'off',
    'no-nested-ternary': 'off',
    'no-plusplus': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-unused-expressions': 'off',
    indent: [
      'error',
      2,
      {
        SwitchCase: 1,
      },
    ],
    quotes: 'off',
    'babel/no-unused-expressions': 'error',
    'babel/quotes': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',
    'import/no-unresolved': 'off',
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
      },
    ],
    'jsx-a11y/label-has-associated-control': 'off',
    'jsx-a11y/accessible-emoji': 'off',
    'jsx-a11y/href-no-hash': 'off',
    'jsx-a11y/label-has-for': 'off',
    'react/jsx-curly-brace-presence': 'off',
    'react/jsx-filename-extension': 'off',
    'react/no-multi-comp': 'off',
    'react/prop-types': 'off',
    'react/sort-comp': 'off',
    'react-hooks/rules-of-hooks': 'error',
  },
  settings: {
    'import/resolver': {
      webpack: {
        config: './webpack.common.js',
      },
    },
  },
};
