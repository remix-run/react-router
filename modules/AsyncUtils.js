export function loopAsync(turns, work, callback) {
  let currentTurn = 0, isDone = false

  function done() {
    isDone = true
    callback.apply(this, arguments)
  }

  function next() {
    if (isDone)
      return

    if (currentTurn < turns) {
      work.call(this, currentTurn++, next, done)
    } else {
      done.apply(this, arguments)
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
