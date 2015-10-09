var execSync = require('child_process').execSync
var readFileSync = require('fs').readFileSync
var prettyBytes = require('pretty-bytes')
var gzipSize = require('gzip-size')

function exec(command) {
  execSync(command, { stdio: [0, 1, 2] })
}

exec('npm run build')
exec('npm run build-umd')
exec('npm run build-min')

console.log(
  '\ngzipped, the UMD build is ' + prettyBytes(
    gzipSize.sync(readFileSync('umd/ReactRouter.min.js'))
  )
)
