var webpack = require('webpack');

module.exports = {

  output: {
    library: 'ReactRouter',
    libraryTarget: 'var'
  },

  externals: {
    react: 'React'
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
    })
  ]
  
};
