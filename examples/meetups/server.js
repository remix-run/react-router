/* eslint no-console:0 */

const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const config = require('./webpack.config');

new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  hot: true,
  historyApiFallback: true,
  stats: {
    colors: true,
  },
}).listen(3000, 'localhost', function(err) {
  if (err) {
    console.log(err);
  }

  console.log('Listening at localhost:3000');
});
