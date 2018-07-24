const webpack = require('webpack');
const merge = require('webpack-merge');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  // potentially insecure way to view on remote computer
  devServer: {
    host: "localhost",
    port: 8081,
    hot: true,
    historyApiFallback: true,
    https: true
  },

  devtool: 'source-map',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js', // use npm run build to build production bundle
    publicPath: '/dist/'
  },

  plugins: [
    new webpack.DefinePlugin({
      SERVER: "'http://localhost:4000'",
      SOCKET_SERVER: "'ws://localhost:4000'",
      NODE_ENV: "'development'"
    }),

    // This plugin will cause the relative path of the module to be displayed when HMR is enabled.
    new webpack.NamedModulesPlugin(),

    new webpack.HotModuleReplacementPlugin({})
    // new HtmlWebpackPlugin({
    //   template: './index.dev.ejs',
    //   title: 'Flame-Chart'
    // })
  ]
});
