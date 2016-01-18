export function loopAsync(turns, work, callback) {
  let currentTurn = 0, isDone = false
  let sync = false, hasNext = false

  function done() {
    isDone = true
    callback.apply(this, arguments)
  }

  function next() {
    hasNext = true

    if (sync) {
      // Iterate instead of recursing if possible.
      return
    }

    sync = true

    while (!isDone && currentTurn < turns && hasNext) {
      hasNext = false
      work.call(this, currentTurn++, next, done)
    }

    sync = false

    if (isDone) {
      return
    }
    if (currentTurn >= turns && hasNext) {
      done()
    }
  }

  next()
}

export function mapAsync(array, work, callback) {
  const length = array.length
  const values = []

  if (length === 0)
    return callback(null, values)

  let isDone = false, doneCount = 0

  function done(index, error, value) {
    if (isDone)
      return

    if (error) {
      isDone = true
      callback(error)
    } else {
      values[index] = value

      isDone = (++doneCount === length)

      if (isDone)
        callback(null, values)
    }
  }

  array.forEach(function (item, index) {
    work(item, index, function (error, value) {
      done(index, error, value)
    })
  })
}
