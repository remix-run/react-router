import { loopAsync } from './AsyncUtils';
import { getState, getTransitionHooks, getComponents } from './RoutingUtils';

var DefaultTransitionDelegate = {
  getState,
  getTransitionHooks,
  getComponents
};

function isValidTransitionDelegate(object) {
  for (var p in DefaultTransitionDelegate)
    if (DefaultTransitionDelegate.hasOwnProperty(p) && typeof object[p] !== 'function')
      return false;

  return true;
}

function runTransition(prevState, routes, location, delegate, callback) {
  invariant(
    isValidTransitionDelegate(delegate),
    'Transition needs a valid delegate'
  );

  var { getState, getTransitionHooks, getComponents } = delegate;
  var redirectInfo = null;
  var isAborted = false;

  var transition = {
    to(pathname, query, state) {
      redirectInfo = { pathname, query, state };
      isAborted = true;
    },
    abort() {
      isAborted = true;
    }
  };

  getState(routes, location, function (error, nextState) {
    if (error || nextState == null || isAborted) {
      callback(error, redirectInfo);
    } else {
      nextState.location = location;

      getTransitionHooks(prevState, nextState, function (error, hooks) {
        if (error || isAborted) {
          callback(error, redirectInfo);
        } else {
          getComponents(nextState, function (error, components) {
            if (error || isAborted) {
              callback(error, redirectInfo);
            } else {
              nextState.components = components;
              callback(null, null, nextState);
            }
          });
        }
      });
    }
  });
}

export class Transition {

  constructor(state=null, delegate=DefaultTransitionDelegate) {
    invariant(
      Transition.isValidDelegate(delegate),
      'Transition needs a valid delegate'
    );

    this.isAborted = false;
    this.delegate = delegate;
    this.state = state;
  }

  to(pathname, query, state) {
    this.redirectInfo = { pathname, query, state };
    this.isAborted = true;
  }

  abort() {
    this.isAborted = true;
  }

  run(routes, location, callback) {
    this.isAborted = false;

    var { getState, getTransitionHooks, getComponents } = this.delegate;

    getState(routes, location, (error, state) => {
      if (error || state == null || this.isAborted) {
        callback(error);
      } else {
        state.location = location;

        getTransitionHooks(state, (error, hooks) => {
          if (error || this.isAborted) {
            callback(error);
          } else {
            getComponents(state, (error, components) => {
              if (error || this.isAborted) {
                callback(error);
              } else {
                state.components = components;
                callback(null, state);
              }
            });
          }
        });
      }
    });
 
  }

  _runTransitionHooks(nextState, callback) {
    loopAsync(hooks.length, (index, next, done) => {
      var hook = hooks[index];

      hooks[index].call(this, nextState, this, (error) => {
        if (error || this.isAborted) {
          done.call(this, error); // No need to continue.
        } else {
          next.call(this);
        }
      });
    }, callback);
  }
 
}

export default Transition;
