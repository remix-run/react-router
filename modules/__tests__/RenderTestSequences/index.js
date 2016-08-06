import HashBangHashEncoding from './HashBangHashEncoding'
import NoSlashHashEncoding from './NoSlashHashEncoding'
import PopEmitsANewLocation from './PopEmitsANewLocation'
import PushEmitsANewLocation from './PushEmitsANewLocation'
import PushWithStateUsesAKey from './PushWithStateUsesAKey'
import PushWithoutStateOmitsTheKey from './PushWithoutStateOmitsTheKey'
import ReplaceEmitsANewLocation from './ReplaceEmitsANewLocation'
import SlashHashEncoding from './SlashHashEncoding'

const RenderTestSequences = {
  HashBangHashEncoding,
  NoSlashHashEncoding,
  PopEmitsANewLocation,
  PushEmitsANewLocation,
  PushWithStateUsesAKey,
  PushWithoutStateOmitsTheKey,
  ReplaceEmitsANewLocation,
  SlashHashEncoding
}

const createRenderProp = (steps, done) => {
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

const renderPropCreators = Object.keys(RenderTestSequences).reduce((memo, key) => {
  memo[key] = done => createRenderProp(RenderTestSequences[key], done)
  return memo
}, {})

export default renderPropCreators
