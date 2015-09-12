function execSteps(steps, done) {
  var index = 0

  return function () {
    if (steps.length === 0) {
      done()
    } else {
      try {
        steps[index++].apply(this, arguments)

        if (index === steps.length)
          done()
      } catch (error) {
        done(error)
      }
    }
  }
}

export default execSteps
