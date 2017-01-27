const path = require('path')
const webpack = require('webpack')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin')

const ReactRouterModules = path.resolve(__dirname, '../react-router/modules')
const ReactRouterDOMModules = path.resolve(__dirname, '../react-router-dom/modules')

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
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
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
      // Help the examples find the router modules. This is only for the examples.
      // All modules used to build the docs site itself should import directly
      // from packages/react-router.
      'react-router-dom/Link': path.join(ReactRouterDOMModules, 'Link'),
      'react-router-dom/Prompt': path.join(ReactRouterModules, 'Prompt'),
      'react-router-dom/Redirect': path.join(ReactRouterModules, 'Redirect'),
      'react-router-dom/Route': path.join(ReactRouterModules, 'Route'),
      'react-router-dom/Router': path.join(ReactRouterModules, 'Router'),
      'react-router-dom/Switch': path.join(ReactRouterModules, 'Switch'),
      'react-router-dom/withRouter': path.join(ReactRouterModules, 'withRouter'),

      // Shim the real router so people can copy paste examples into create-react-app
      'react-router-dom/BrowserRouter': path.resolve(__dirname, 'components/ExampleRouter')
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
