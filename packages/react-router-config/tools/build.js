const fs = require('fs')
const execSync = require('child_process').execSync
const prettyBytes = require('pretty-bytes')
const gzipSize = require('gzip-size')

const exec = (command, extraEnv) =>
  execSync(command, {
    stdio: 'inherit',
    env: Object.assign({}, process.env, extraEnv)
  })

console.log('Building CommonJS modules ...')

exec('babel modules -d . --ignore __tests__', {
  BABEL_ENV: 'cjs'
})

console.log('\nBuilding ES modules ...')

exec('babel modules -d es --ignore __tests__', {
  BABEL_ENV: 'es'
})

console.log('\nBuilding react-router-config.js ...')

exec(
  'rollup -c -f umd -o umd/react-router-config.js',
  { NODE_ENV: 'development', BABEL_ENV: 'umd' }
)

console.log('\nBuilding react-router.min.js ...')

exec(
  'rollup -c -f umd -o umd/react-router-config.min.js',
  { NODE_ENV: 'production', BABEL_ENV: 'umd' }
)

const size = gzipSize.sync(
  fs.readFileSync('umd/react-router-config.min.js')
)

console.log('\ngzipped, the UMD build is %s', prettyBytes(size))
