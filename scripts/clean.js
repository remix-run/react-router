const fs = require('fs')
const path = require('path')
const deleteFiles = require('delete')

const root = (...args) => path.join(__dirname, '..', ...args)

const files = fs.readdirSync(root('modules'))
  .filter(file => file.includes('.js'))

const promises = Promise.all(
  files.map(file => deleteFiles.promise(root(file)))
)

promises
  .then(() => {
    console.log('Clean task complete')
  })
  .catch(err => {
    console.log('Clean task failed')
    console.log(err)
  })
