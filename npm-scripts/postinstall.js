var execSync = require('child_process').execSync
var stat = require('fs').stat

function exec(command) {
  execSync(command, { stdio: [0, 1, 2] })
}

stat('lib', function (error, stat) {
  if (error || !stat.isDirectory())
  	console.log('directory name: ' + __dirname);
    exec('npm run build', {cwd: __dirname.replace('npm-scripts', '')})
})
