const webpack = require('webpack');
const merge = require('webpack-merge');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const path = require('path');

const common = require('./webpack.common.js');

module.exports = merge(common, {
  devtool: 'source-map',

  entry: {
    app: './src/lib.js'
  },

  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: '[name].js', // use npm run build to build production bundle
    publicPath: ''
  },

  plugins: [
    new webpack.DefinePlugin({
      SERVER: "'localhost:7000'",
      NODE_ENV: "'production'",

      // this is for how react is told to use productino https://facebook.github.io/react/docs/optimizing-performance.html
      'process.env': {
        NODE_ENV: "'production'"
      }
    }),
    new UglifyJSPlugin({
      sourceMap: true
    })
  ]
});