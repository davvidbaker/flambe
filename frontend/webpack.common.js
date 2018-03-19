
const webpack = require('webpack');

module.exports = {
  entry: {
    vendor: [
      'history',
      'react',
      'react-color',
      'react-dom',
      'react-dnd',
      'react-dnd-html5-backend',
      'react-modal',
      'react-redux',
      'react-router',
      'react-router-dom',
      'react-router-redux',
      'redux',
      'redux-saga',
      'styled-components',
      'tinycolor2',
      // including lodash here was bringing in the entire lodash library... not sure why 🤔
      // 'lodash'
    ],
    app: ['react-hot-loader/patch', './src/index.js'],
  },

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loaders: ['babel-loader'],
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loaders: [
          'file-loader?hash=sha512&digest=hex&name=[hash].[ext]',
          'image-webpack-loader?bypassOnDebug&optimizationLevel=7&interlaced=false',
        ],
      },
    ],
  },

  resolve: {
    modules: ['src', 'node_modules'],
    extensions: ['.js', '.jsx'],
    mainFiles: ['index'],
  },

  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',

      // filename: "vendor.js"
      // (Give the chunk a different name)

      minChunks: Infinity,
      // (with more entries, this ensures that no other module
      //  goes into the vendor chunk)
    })
  ],
};
