const webpack = require('webpack');

module.exports = {
  entry: {
    app: ['react-hot-loader/patch', './src/index.js'],
  },

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: { loader: 'babel-loader', options: { extends: '../../.babelrc' } },
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
    modules: ['node_modules'],
    extensions: ['.js', '.jsx'],
    mainFiles: ['index'],
  },

  plugins: [
    /* ⚠️ webpack.optimize.CommonsChunkPlugin has been removed, please use config.optimization.splitChunks instead.
 */
    // new webpack.optimize.CommonsChunkPlugin({
    //   name: 'vendor',

    //   // filename: "vendor.js"
    //   // (Give the chunk a different name)

    //   minChunks: Infinity,
    //   // (with more entries, this ensures that no other module
    //   //  goes into the vendor chunk)
    // }),
  ],
};
