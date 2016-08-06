export default (steps, done) => {
  let index = 0

  return (...args) => {
    let value
    try {
      value = steps[index++](...args)

      if (index === steps.length)
        done()
    } catch (error) {
      done(error)
    }

    return value
  }
}
