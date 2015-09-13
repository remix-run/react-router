import execSteps from './execSteps'

function execStepsWithDelay(steps, delay, done) {
  const execNextStep = execSteps(steps, done)

  return function () {
    const context = this, args = Array.prototype.slice.call(arguments, 0)

    return setTimeout(function () {
      execNextStep.apply(context, args)
    }, delay)
  }
}

export default execStepsWithDelay
