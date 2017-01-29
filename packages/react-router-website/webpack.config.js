const path = require('path')
const webpack = require('webpack')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin')

module.exports = {
  devtool: 'source-map',

  entry: {
    app: path.resolve(__dirname, 'modules/index.js'),
    vendor: [ 'react', 'react-dom' ]
  },

  output: {
    path: path.resolve(__dirname, 'build'),
    filename: `bundle-[chunkHash].js`,
    chunkFileName: `[name]-[chunkHash].js`,
    publicPath: '/'
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    }),
    new webpack.optimize.CommonsChunkPlugin('vendor', `vendor-[chunkHash].js`),
    new HTMLWebpackPlugin({
      template: 'index.html.ejs'
    }),
    new CopyWebpackPlugin([
      { from: path.resolve(__dirname, 'static') }
    ])
  ].concat(process.env.NODE_ENV === 'production' ? [
    new SWPrecacheWebpackPlugin({
      cacheId: 'react-router-website',
      staticFileGlobsIgnorePatterns: [ /\.map$/ ]
    })
  ] : []),

  resolve: {
    alias: {
      'react-router-dom': path.resolve(__dirname, 'modules/ReactRouterDOMShim')
    }
  },

  module: {
    loaders: [
      { test: /\.js$/,
        exclude: /node_modules|examples/,
        loader: 'babel'
      },
      { test: /\.css$/,
        exclude: /prismjs/,
        loader: 'style!css'
      },
      { test: /\.css$/,
        include: /prismjs/,
        loader: 'style!css'
      },
      { test: /\.md$/,
        loader: path.join(__dirname, 'webpack', 'markdown-loader')
      },
      { test: /\.(gif|jpe?g|png|ico)$/,
        loader: 'url?limit=10000'
      }
    ]
  },

  devServer: {
    historyApiFallback: true,
    quiet: false,
    noInfo: false,
    stats: {
      assets: true,
      version: false,
      hash: false,
      timings: false,
      chunks: false,
      chunkModules: true
    }
  }
}
