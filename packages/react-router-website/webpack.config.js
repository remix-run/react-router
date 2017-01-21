const path = require('path')
const webpack = require('webpack')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin')

const PROD = process.env.NODE_ENV === 'production'
const ROUTER_SRC = path.resolve(__dirname, '../react-router/modules')

module.exports = {
  devtool: 'source-map',

  entry: {
    app: path.resolve(__dirname, 'index.js'),
    vendor: [ 'react', 'react-dom' ]
  },

  output: {
    path: path.resolve(__dirname, 'build'),
    filename: `bundle-[chunkHash].js`,
    chunkFileName: `[name]-[chunkHash].js`
  },

  plugins: [
    new webpack.DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV) }),
    new webpack.optimize.CommonsChunkPlugin('vendor', `vendor-[chunkHash].js`),
    new HTMLWebpackPlugin({ template: 'index.html.ejs' }),
    new CopyWebpackPlugin([
      { from: path.resolve(__dirname, 'static') }
    ]),
    new SWPrecacheWebpackPlugin({
      cacheId: 'react-router-website',
      staticFileGlobsIgnorePatterns: [ /\.map$/ ]
    })
  ].concat(PROD ? [
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin()
  ] : []),

  resolve: {
    alias: {
      // These are for the examples. All modules used to build the actual
      // site should import directly from packages/react-router
      'react-router/Link': path.join(ROUTER_SRC, 'Link'),
      'react-router/Prompt': path.join(ROUTER_SRC, 'Prompt'),
      'react-router/Redirect': path.join(ROUTER_SRC, 'Redirect'),
      'react-router/Route': path.join(ROUTER_SRC, 'Route'),
      'react-router/Router': path.join(ROUTER_SRC, 'Router'),
      'react-router/Switch': path.join(ROUTER_SRC, 'Switch'),
      'react-router/withRouter': path.join(ROUTER_SRC, 'withRouter'),
      // Shim the real router so people can copy paste examples into create-react-app
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
