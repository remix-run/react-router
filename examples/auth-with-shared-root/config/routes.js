import auth from '../utils/auth.js'

function redirectToLogin(nextState, replace) {
  if (!auth.loggedIn()) {
    replace({
      pathname: '/login',
      state: { nextPathname: nextState.location.pathname }
    })
  }
}

function redirectToDashboard(nextState, replace) {
  if (auth.loggedIn()) {
    replace('/')
  }
}

export default {
  component: require('../components/App'),
  childRoutes: [
    { path: '/logout',
      getComponent: (nextState, cb) => {
        require.ensure([], (require) => {
          cb(null, require('../components/Logout'))
        })
      }
    },
    { path: '/about',
      getComponent: (nextState, cb) => {
        require.ensure([], (require) => {
          cb(null, require('../components/About'))
        })
      }
    },

    { onEnter: redirectToDashboard,
      childRoutes: [
        // Unauthenticated routes
        // Redirect to dashboard if user is already logged in
        { path: '/login',
          getComponent: (nextState, cb) => {
            require.ensure([], (require) => {
              cb(null, require('../components/Login'))
            })
          }
        }
        // ...
      ]
    },

    { onEnter: redirectToLogin,
      childRoutes: [
        // Protected routes that don't share the dashboard UI
        { path: '/user/:id',
          getComponent: (nextState, cb) => {
            require.ensure([], (require) => {
              cb(null, require('../components/User'))
            })
          }
        }
        // ...
      ]
    },

    { path: '/',
      getComponent: (nextState, cb) => {
        // Share the path
        // Dynamically load the correct component
        if (auth.loggedIn()) {
          return require.ensure([], (require) => {
            cb(null, require('../components/Dashboard'))
          })
        }
        return require.ensure([], (require) => {
          cb(null, require('../components/Landing'))
        })
      },
      indexRoute: {
        getComponent: (nextState, cb) => {
          // Only load if we're logged in
          if (auth.loggedIn()) {
            return require.ensure([], (require) => {
              cb(null, require('../components/PageOne'))
            })
          }
          return cb()
        }
      },
      childRoutes: [
        { onEnter: redirectToLogin,
          childRoutes: [
            // Protected nested routes for the dashboard
            { path: '/page2',
              getComponent: (nextState, cb) => {
                require.ensure([], (require) => {
                  cb(null, require('../components/PageTwo'))
                })
              }
            }
            // ...
          ]
        }
      ]
    }

  ]
}
