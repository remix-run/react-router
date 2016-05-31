/*eslint no-console: 0*/
import React from 'react'
import { Router, MatchLocation, Link } from 'react-history'
import { createStore, combineReducers, applyMiddleware } from 'redux'
import { Provider, connect } from 'react-redux'

const { func, object } = React.PropTypes

////////////////////////////////////////////////////////////////////////////////
const logger = store => next => action => {
  console.group(action.type)
  console.info('dispatching', action)
  let result = next(action)
  console.log('next state', store.getState())
  console.groupEnd(action.type)
  return result
}


////////////////////////////////////////////////////////////////////////////////
// a reducer to keep the location in redux state
const locationReducer = (state = window.location, action) => {
  return action.type === 'LOCATION_CHANGE' ?
    action.location : state
}

////////////////////////////////////////////////////////////////////////////////
const store = applyMiddleware(logger)(createStore)(
  combineReducers({ location: locationReducer })
)

////////////////////////////////////////////////////////////////////////////////
const One = () => <h3>One</h3>
const Two = () => <h3>Two</h3>

////////////////////////////////////////////////////////////////////////////////
const mapStateToAppProps = (state) => ({
  location: state.location
})

const App = connect(mapStateToAppProps)((props) => (
  // use Router as a controlled component, used this way it has no state and is
  // completedly controlled by Redux
  <Router
    location={props.location}
    onChange={(location) => {
      props.dispatch({
        type: 'LOCATION_CHANGE',
        location
      })
    }}
  >
    <h2>Redux</h2>
    <ul>
      <li><Link to="/redux/one">One</Link></li>
      <li><Link to="/redux/two">Two</Link></li>
    </ul>

    <MatchLocation pattern="/redux/one" children={One}/>
    <MatchLocation pattern="/redux/two" children={Two}/>
  </Router>
))

App.propTypes = { dispatch: func, location: object }


////////////////////////////////////////////////////////////////////////////////
export default () => (
  <Provider store={store}>
    <App/>
  </Provider>
)

