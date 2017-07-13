const execSteps = (steps, history, done) => {
  let index = 0, unlisten, cleanedUp = false

  const cleanup = (...args) => {
    if (!cleanedUp) {
      cleanedUp = true
      unlisten()
      done(...args)
    }
  }

  const execNextStep = (...args) => {
    try {
      const nextStep = steps[index++]

      if (!nextStep)
        throw new Error('Test is missing step ' + index)

      nextStep(...args)

      if (index === steps.length)
        cleanup()
    } catch (error) {
      cleanup(error)
    }
  }

  if (steps.length) {
    unlisten = history.listen(execNextStep)
    execNextStep(history.location)
  } else {
    done()
  }
}

export default execSteps
