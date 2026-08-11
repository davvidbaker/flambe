module.exports = {
  modulePaths: ['<rootDir>/packages/*/src'],
  testMatch: ['<rootDir>/packages/core/src/**/*.test.ts'],
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
            test: /\.tsx?$/,
            presets: ['@babel/preset-typescript'],
          },
        ],
        plugins: [],
      },
    ],
  },
};
