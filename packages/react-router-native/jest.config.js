const config = require('react-native/jest-preset')
const { resolve } = require('jest-config/build/utils')
const { join } = require('path')

const setupFilesPath = config.setupFiles[0]
console.log(setupFilesPath)
const here = __dirname
const root = join(__dirname, '../../')

try {
  const hereFiles = resolve(here, undefined, setupFilesPath)
  console.log('found setupFiles here')
} catch (e) {
  console.log('setupFiles not found here')
}

try {
  const rootFiles = resolve(root, undefined, setupFilesPath)
  console.log('found setupFiles in root')
} catch (e) {
  console.log('setupFiles not found in root')
}

module.exports = Object.assign({}, config)
