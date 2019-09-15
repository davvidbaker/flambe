const webpack = require('webpack');
const merge = require('webpack-merge');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[hash].js', // use npm run build to build production bundle
    publicPath: '',
  },

  plugins: [
    new webpack.DefinePlugin({
      SERVER: "'ec2-54-81-246-103.compute-1.amazonaws.com'",
      NODE_ENV: "'production'",

      // this is for how react is told to use production https://facebook.github.io/react/docs/optimizing-performance.html
      'process.env': {
        NODE_ENV: "'production'",
      },
    }),
    new UglifyJSPlugin({
      sourceMap: true,
    }),
    new HtmlWebpackPlugin({
      template: './index.prod.ejs',
      title: 'Flame-Chart'
    }),
  ],
});
