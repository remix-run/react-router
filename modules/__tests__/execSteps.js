function execSteps(steps, done) {
  let index = 0

  return function () {
    if (steps.length === 0) {
      done()
    } else {
      try {
        // TODO: Don't set `this` context on callback
        steps[index++].call(this, this.state)

        if (index === steps.length)
          done()
      } catch (error) {
        done(error)
      }
    }
  }
}

export default execSteps
