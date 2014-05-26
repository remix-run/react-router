var path = require('path');
var fs = require('fs');

function buildEntries() {
  return fs.readdirSync('examples').reduce(function(entries, dir) {
    var isDraft = dir.charAt(0) === '_';
    if (!isDraft && fs.lstatSync(path.join('examples', dir)).isDirectory()) {
      entries[dir] = './examples/'+dir+'/'+'app.js';
    }
    return entries;
  }, {});
}

console.log(buildEntries());

module.exports = {
  entry: buildEntries(),

  output: {
    path: path.join(__dirname, 'examples'),
    filename: '[name]/app.build.js',
  },

  module: {
    loaders: [
      {test: /\.js$/, loader: 'jsx-loader'}
    ]
  }
};

