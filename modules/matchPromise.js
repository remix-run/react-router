import match from './match'

/**
 * A high-level API to be used for server-side rendering.
 *
 * This function wraps the match module in a promise and resolves
 * with redirectLocation and renderProps or rejects if an error is returned
 *
 */

const matchPromise = (...args) => new Promise((resolve, reject) => {
  match(...args, (err, redirectLocation, renderProps) => {
    if (err) {
      reject(err)
    } else {
      resolve({ redirectLocation, renderProps })
    }
  })
})

export default matchPromise
