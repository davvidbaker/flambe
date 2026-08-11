module.exports = {
  modulePaths: ['<rootDir>/packages/*/src'],
  testMatch: ['<rootDir>/packages/core/src/**/*.test.js'],
  transform: {
    '\\.[jt]sx?$': [
      'babel-jest',
      {
        babelrc: false,
        configFile: false,
        presets: [
          ['@babel/preset-env', { modules: 'commonjs' }],
          ['@babel/preset-react', { runtime: 'automatic' }],
        ],
        overrides: [
          {
            test: /\.jsx?$/,
            presets: ['@babel/preset-flow'],
          },
          {
            test: /\.tsx?$/,
            presets: ['@babel/preset-typescript'],
          },
        ],
        plugins: [
          '@babel/plugin-proposal-optional-chaining',
          '@babel/plugin-proposal-class-properties',
          '@babel/plugin-proposal-object-rest-spread',
          '@babel/plugin-proposal-do-expressions',
          '@babel/plugin-syntax-dynamic-import',
          [
            '@babel/plugin-proposal-pipeline-operator',
            { proposal: 'minimal' },
          ],
          '@babel/plugin-transform-react-jsx',
          '@babel/plugin-transform-regenerator',
        ],
      },
    ],
  },
};
