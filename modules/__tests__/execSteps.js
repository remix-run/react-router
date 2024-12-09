function execSteps(steps, done) {
  let index = 0

  return function () {
    if (steps.length === 0) {
      done()
    } else {
      try {
        if (this) {
          steps[index++].call(this, this.state)
        } else {
          steps[index++]()
        }

        if (index === steps.length)
          done()
      } catch (error) {
        done(error)
      }
    }
  }
}

export default execSteps
