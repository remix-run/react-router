var execSync = require('child_process').execSync
var stat = require('fs').stat

function exec(command) {
  execSync(command, { stdio: [0, 1, 2] })
}

stat('lib', function (error, stat) {
  if (error || !stat.isDirectory())
    exec('npm run build')
})
