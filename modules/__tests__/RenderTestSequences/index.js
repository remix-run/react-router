import PushEmitsANewLocation from './PushEmitsANewLocation'
import ReplaceEmitsANewLocation from './ReplaceEmitsANewLocation'
import PopEmitsANewLocation from './PopEmitsANewLocation'

const execSteps = (steps, done) => {
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

const sequenceRunner = steps => done => execSteps(steps, done)

const RenderTestSequences = {
  PushEmitsANewLocation: sequenceRunner(PushEmitsANewLocation),
  ReplaceEmitsANewLocation: sequenceRunner(ReplaceEmitsANewLocation),
  PopEmitsANewLocation: sequenceRunner(PopEmitsANewLocation)
}

export default RenderTestSequences
