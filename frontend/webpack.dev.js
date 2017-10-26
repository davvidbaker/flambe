const webpack = require('webpack');
const merge = require('webpack-merge');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const common = require('./webpack.common.js');

module.exports = merge(common, {
  // hacky way to view on remote computer (dev machine local IP is 192.168.0.15)
  devServer: {
    host: '0.0.0.0',
    port: 8081,
    // contentBase: path.join(__dirname, 'dist'),
    hot: true,
    historyApiFallback: true,
  },

  devtool: 'cheap-module-eval-source-map',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js', // use npm run build to build production bundle
    publicPath: '/dist/',
  },

  plugins: [
    new webpack.DefinePlugin({
      SERVER: "'http://localhost:4000'",
      NODE_ENV: "'development'",
    }),

    // This plugin will cause the relative path of the module to be displayed when HMR is enabled.
    new webpack.NamedModulesPlugin(),

    new webpack.HotModuleReplacementPlugin({}),
    new HtmlWebpackPlugin({
      template: './index.dev.ejs',
      title: 'Flame-Chart'
    }),
  ],
});
