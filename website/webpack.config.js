const path = require('path')
const webpack = require('webpack')
const HTMLWebpackPlugin = require('html-webpack-plugin')

const HASH = '[chunkHash]'
const ROUTER_SRC = path.join(__dirname, '..', 'modules')

module.exports = {
  devtool: 'source-map',

  entry: {
    app: path.join(__dirname, 'index.js'),
    vendor: [ 'react', 'react-dom' ]
  },

  output: {
    path: path.join(__dirname, 'build'),
    filename: `bundle-${HASH}.js`,
    chunkFileName: `[name]-${HASH}.js`
  },

  plugins: [
    new webpack.optimize.CommonsChunkPlugin('vendor', `vendor-${HASH}.js`),
    new HTMLWebpackPlugin({
      template: 'index.html.ejs'
    })
  ],

  resolve: {
    alias: {
      'react-router/Miss': path.join(ROUTER_SRC, 'Miss'),
      'react-router/Match': path.join(ROUTER_SRC, 'Match'),
      'react-router/MatchRoutes': path.join(ROUTER_SRC, 'MatchRoutes'),
      'react-router/Link': path.join(ROUTER_SRC, 'Link'),
      'react-router/Redirect': path.join(ROUTER_SRC, 'Redirect'),
      'react-router/NavigationPrompt': path.join(ROUTER_SRC, 'NavigationPrompt'),
      'react-router/BrowserRouter': path.join(__dirname, 'components', 'ExampleRouter')
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
        loader: 'style!css?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]!postcss'
      },
      { test: /\.css$/,
        include: /prismjs/,
        loader: 'style!css'
      },
      { test: /\.md$/,
        loader: './webpack/markdown-loader'
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
