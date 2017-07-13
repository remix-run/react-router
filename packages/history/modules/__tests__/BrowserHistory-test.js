import createHistory from '../createBrowserHistory'
import { canUseDOM, supportsHistory } from '../DOMUtils'
import * as TestSequences from './TestSequences'

const canUseHistory = canUseDOM && supportsHistory()
const describeHistory = canUseHistory ? describe : describe.skip

describeHistory('a browser history', () => {
  beforeEach(() => {
    window.history.replaceState(null, null, '/')
  })

  describe('by default', () => {
    let history
    beforeEach(() => {
      history = createHistory()
    })

    describe('listen', () => {
      it('does not immediately call listeners', (done) => {
        TestSequences.Listen(history, done)
      })
    })

    describe('the initial location', () => {
      it('does not have a key', (done) => {
        TestSequences.InitialLocationNoKey(history, done)
      })
    })

    describe('push a new path', () => {
      it('calls change listeners with the new location', (done) => {
        TestSequences.PushNewLocation(history, done)
      })
    })

    describe('push the same path', () => {
      it('calls change listeners with the new location', (done) => {
        TestSequences.PushSamePath(history, done)
      })
    })

    describe('push state', () => {
      it('calls change listeners with the new location', (done) => {
        TestSequences.PushState(history, done)
      })
    })

    describe('push with no pathname', () => {
      it('calls change listeners with the normalized location', (done) => {
        TestSequences.PushMissingPathname(history, done)
      })
    })

    describe('push with a relative pathname', () => {
      it('calls change listeners with the normalized location', (done) => {
        TestSequences.PushRelativePathname(history, done)
      })
    })

    describe('push with a unicode path string', () => {
      it('creates a location with decoded properties', (done) => {
        TestSequences.PushUnicodeLocation(history, done)
      })
    })

    describe('push with an encoded path string', () => {
      it('creates a location object with decoded properties', (done) => {
        TestSequences.PushEncodedLocation(history, done)
      })
    })

    describe('replace a new path', () => {
      it('calls change listeners with the new location', (done) => {
        TestSequences.ReplaceNewLocation(history, done)
      })
    })

    describe('replace the same path', () => {
      it('calls change listeners with the new location', (done) => {
        TestSequences.ReplaceSamePath(history, done)
      })
    })

    describe('replace state', () => {
      it('calls change listeners with the new location', (done) => {
        TestSequences.ReplaceState(history, done)
      })
    })

    describe('goBack', () => {
      it('calls change listeners with the previous location', (done) => {
        TestSequences.GoBack(history, done)
      })
    })

    describe('goForward', () => {
      it('calls change listeners with the next location', (done) => {
        TestSequences.GoForward(history, done)
      })
    })

    describe('block', () => {
      it('blocks all transitions', (done) => {
        TestSequences.BlockEverything(history, done)
      })
    })

    describe('block a POP without listening', () => {
      it('receives the next location and action as arguments', (done) => {
        TestSequences.BlockPopWithoutListening(history, done)
      })
    })
  })

  describe('that denies all transitions', () => {
    const getUserConfirmation = (_, callback) => callback(false)

    let history
    beforeEach(() => {
      history = createHistory({
        getUserConfirmation
      })
    })

    describe('clicking on a link (push)', () => {
      it('does not update the location', (done) => {
        TestSequences.DenyPush(history, done)
      })
    })

    describe('clicking the back button (goBack)', () => {
      it('does not update the location', (done) => {
        TestSequences.DenyGoBack(history, done)
      })
    })

    describe('clicking the forward button (goForward)', () => {
      it('does not update the location', (done) => {
        TestSequences.DenyGoForward(history, done)
      })
    })
  })

  describe('a transition hook', () => {
    const getUserConfirmation = (_, callback) => callback(true)

    let history
    beforeEach(() => {
      history = createHistory({
        getUserConfirmation
      })
    })

    it('receives the next location and action as arguments', (done) => {
      TestSequences.TransitionHookArgs(history, done)
    })

    it('cancels the transition when it returns false', (done) => {
      TestSequences.ReturnFalseTransitionHook(history, done)
    })

    it('is called when the back button is clicked', (done) => {
      TestSequences.BackButtonTransitionHook(history, done)
    })

    it('is called on the hashchange event', (done) => {
      TestSequences.HashChangeTransitionHook(history, done)
    })
  })
})
