import execSteps from './execSteps'

function execStepsWithDelay(steps, delay, done) {
  var execNextStep = execSteps(steps, done)

  return function () {
    var context = this, args = Array.prototype.slice.call(arguments, 0)

    return setTimeout(function () {
      execNextStep.apply(context, args)
    }, delay)
  }
}

export default execStepsWithDelay
