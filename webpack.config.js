module.exports = {
  entry: "./examples/partial-app-loading/partial-app.js",
  output: {
    path: __dirname + '/examples/partial-app-loading',
    filename: "bundle.js",
  },
  module: {
    loaders: [
      {test: /\.js$/, loader: 'jsx-loader'}
    ]
  }
};
