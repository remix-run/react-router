import expect from 'expect'
import React from 'react'
import Route from '../Route'
import IndexRoute from '../IndexRoute'
import { createRoutes } from '../RouteUtils'
import createTransitionManager from '../createTransitionManager'
import history from 'history'
import { checkForUnreachableRoutes } from '../findUnreachableRoutes'


let App = function () {}
let Index = function () {}
let About = function () {}
let Agressive = function () {}
let Users = function () {}
let UsersIndex = function () {}
let User = function () {}

let unReachableRoutes = createRoutes([
  <Route path="/" component={App}>
    <IndexRoute component={Index}/>
    <Route path="/:agressive" component={Agressive}/>
    <Route path="/about" component={About}/>
    <Route path="users" component={Users}>
      <IndexRoute component={UsersIndex}/>
      <Route path=":id" component={User}/>
    </Route>
  </Route>
])

let reachableRoutes = createRoutes([
  <Route path="/" component={App}>
    <IndexRoute component={Index}/>
    <Route path="/about" component={About}/>
    <Route path="users" component={Users}>
      <IndexRoute component={UsersIndex}/>
      <Route path=":id" component={User}/>
    </Route>
    <Route path="/:agressive" component={Agressive}/>
  </Route>
])


const reachableRoutesObj  = createRoutes(reachableRoutes)
const unReachableRoutesObj  = createRoutes(unReachableRoutes)

// checkForUnreachableRoutes() and transitionManager must use the same instance 
// of routesObj since they are compared by reference in checkForUnreachableRoutes().
let reachableTransitionManager = createTransitionManager(
  history, reachableRoutesObj
)

let unReachableTransitionManager = createTransitionManager(
  history, unReachableRoutesObj
)


describe('findUnreachableRoutes', function () {
  let errorSpy

  beforeEach(function () {
    errorSpy = expect.spyOn(console, 'error')
  })

  afterEach(function () {
    errorSpy.restore()
  })

  it('Generates a warning for each route that is unreachable', function () {
    checkForUnreachableRoutes(unReachableTransitionManager, unReachableRoutesObj)

    expect(errorSpy.calls.length).toEqual(2) // should have been called 2 times
    expect(errorSpy).toHaveBeenCalledWith("Warning: [react-router] <Route path='/about' component=About> is an unreachable route. You may need to reorder your routes or fix a typo.")
    expect(errorSpy).toHaveBeenCalledWith("Warning: [react-router] <Route path='/users' component=Users> is an unreachable route. You may need to reorder your routes or fix a typo.")
  })

  it('Generates no warnings when all routes are reachable', function () {
    checkForUnreachableRoutes(reachableTransitionManager, reachableRoutesObj)
    expect(errorSpy).toNotHaveBeenCalled()
  })
})
