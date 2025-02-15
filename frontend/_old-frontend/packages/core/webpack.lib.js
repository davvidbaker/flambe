const webpack = require('webpack');
const merge = require('webpack-merge');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const path = require('path');

const common = require('./webpack.common.js');

const reactExternal = {
  root: 'React',
  commonjs2: 'react',
  commonjs: 'react',
  amd: 'react',
};

const reactDOMExternal = {
  root: 'ReactDOM',
  commonjs2: 'react-dom',
  commonjs: 'react-dom',
  amd: 'react-dom',
};

module.exports = {
  devtool: 'source-map',

  entry: {
    app: './src/lib.js',
  },

  externals: {
    react: reactExternal,
    'react-dom': reactDOMExternal,
  },

  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: 'index.js',
    publicPath: '',
    libraryTarget: 'commonjs2'
  },

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: { loader: 'babel-loader', options: { extends: '../../.babelrc' } },
      },
    ],
  },

  resolve: {
    modules: ['node_modules'],
    extensions: ['.js', '.jsx'],
  },

  plugins: [
    new webpack.DefinePlugin({
      SERVER: "'localhost:7000'",
      NODE_ENV: "'production'",

      // this is for how react is told to use productino https://facebook.github.io/react/docs/optimizing-performance.html
      'process.env': {
        NODE_ENV: "'production'",
      },
    }),
  ],
};
