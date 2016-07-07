const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

const HASH = '[chunkHash]'
const PROD = process.env.NODE_ENV === 'production'

module.exports = {

  devtool: 'source-map',

  entry: {
    app: path.join(__dirname, 'index.js'),
    vendor: [ 'react', 'react-dom', 'react-router' ]
  },

  output: {
    path: path.join(__dirname, 'build'),
    filename: `bundle-${HASH}.js`,
    chunkFileName: `[name]-${HASH}.js`
  },

  plugins: [
    new webpack.optimize.CommonsChunkPlugin('vendor', `vendor-${HASH}.js`),
    new HtmlWebpackPlugin({
      baseHref: PROD ? '//reactjstraining.github.io/react-router/' : '/',
      template: 'index.html.ejs'
    })
  ].concat(PROD ? [
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin()
  ] : []),

  resolve: {
    alias: {
      'react-router': path.join(__dirname, '..', 'modules')
    }
  },

  module: {
    loaders: [
      { test: /\.js$/,
        exclude: /node_modules|\.examples/,
        loader: 'babel-loader'
      },
      { test: /\.css$/,
        exclude: /prismjs/,
        loader: 'style-loader!css-loader?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]!postcss-loader'
      },
      { test: /\.css$/,
        include: /prismjs/,
        loader: 'style-loader!css-loader'
      },
      { test: /\.md$/,
        loader: './webpack/markdown-loader'
      },
      { test: /\.(gif|jpe?g|png|ico)$/,
        loader: 'url-loader?limit=10000'
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
