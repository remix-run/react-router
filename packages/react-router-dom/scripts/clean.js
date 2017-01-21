const fs = require('fs')
const path = require('path')

const root = (...args) => path.relative(process.cwd(), path.resolve(__dirname, '..', ...args))

const files = fs.readdirSync(root('modules'))
  .filter(file => file.includes('.js'))

Promise.all(
  files.map(file => new Promise((resolve, reject) => {
    const f = root(file)

    if (fs.existsSync(f)) {
      try {
        fs.unlinkSync(f)
        console.log('Removed %s', f)
        resolve()
      } catch (e) {
        reject(e)
      }
    } else {
      resolve()
    }
  }))
).catch(error => {
  console.error(error)
})
