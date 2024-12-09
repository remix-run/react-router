module.exports = {
  output: {
    library: 'ReactRouter',
    libraryTarget: 'umd',
    filename:
      process.env.NODE_ENV === 'production'
        ? 'ReactRouter.min.js'
        : 'ReactRouter.js'
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
    rules: [ { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' } ]
  }
}
