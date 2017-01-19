const resolvePath = require('path').resolve
const readFileSync = require('fs').readFileSync
const execSync = require('child_process').execSync
const inInstall = require('in-publish').inInstall
const prettyBytes = require('pretty-bytes')
const gzipSize = require('gzip-size')

if (inInstall())
  process.exit(0)

const exec = (command, env) =>
  execSync(command, { stdio: 'inherit', env })

const webpackEnv = Object.assign({}, process.env, {
  NODE_ENV: 'production'
})

exec('npm run build-lib')
exec('npm run build-umd', webpackEnv)
exec('npm run build-min', webpackEnv)

const size = gzipSize.sync(
  readFileSync(resolvePath(__dirname, '../umd/react-router.min.js'))
)

console.log('\ngzipped, the UMD build is %s', prettyBytes(size))
