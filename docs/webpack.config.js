const path = require('path')

module.exports = {
  devtool: 'source-map',
  entry: path.join(__dirname, 'index.js'),
  output: {
    path: __dirname,
    filename: 'bundle.js',
    chunkFileName: '[name].js',
    publicPath: '/'
  },
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
      {
        test: /\.md$/,
        loader: './webpack/markdown-loader'
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
