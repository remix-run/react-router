const webpack = require('webpack')

module.exports = {
  output: {
    library: 'ReactRouter',
    libraryTarget: 'umd'
  },

  externals: {
    react: {
      root: 'React',
      commonjs2: 'react',
      commonjs: 'react',
      amd: 'react'
    }
  },

  module: {
    loaders: [ { test: /\.js$/, exclude: /node_modules/, loader: 'babel' } ]
  },

  node: {
    Buffer: false
  },

  resolve: {
    fallback: {
      assert: false
    }
  },

  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: process.env.NODE_ENV,
      NODE_DEBUG: false
    })
  ]
}
