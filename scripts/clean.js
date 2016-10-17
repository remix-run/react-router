const fs = require('fs')
const path = require('path')

const root = (...args) => path.join(__dirname, '..', ...args)

const files = fs.readdirSync(root('modules'))
  .filter(file => file.includes('.js'))

const promises = Promise.all(
  files.map(file => new Promise((resolve, reject) => {
    if (!fs.existsSync(root(file))) {
      return resolve()
    }
    try {
      fs.unlinkSync(root(file))
      resolve()
    } catch (e) {
      reject(e)
    }
  }))
)

promises
  .then(() => {
    console.log('Clean task complete')
  })
  .catch(err => {
    console.log('Clean task failed')
    console.log(err)
  })
