import React from 'react'
import { TransitionMotion, spring } from 'react-motion'
import Route from 'react-router/Route'
import Redirect from 'react-router/Redirect'
import Router from 'react-router-dom/BrowserRouter'
import Link from 'react-router-dom/Link'

const AnimationExample = () => (
  <Router>
    <div style={styles.fill}>
      <ul style={styles.nav}>
        <NavLink to="/10/90/50">Red</NavLink>
        <NavLink to="/120/100/40">Green</NavLink>
        <NavLink to="/200/100/40">Blue</NavLink>
        <NavLink to="/310/100/50">Pink</NavLink>
      </ul>

      <div style={styles.content}>
        <FadeRoute path="/:h/:s/:l" component={HSL}/>
      </div>

      <Route exact path="/" render={() => (
        <Redirect to="/10/90/50"/>
      )}/>
    </div>
  </Router>
)

const FadeRoute = ({ component: Component, ...rest }) => {
  const willLeave = () => ({ zIndex: 1, opacity: spring(0) })

  return (
    <Route {...rest} children={props => (
      <TransitionMotion
        willLeave={willLeave}
        styles={props.match ? [ {
          key: props.history.location.pathname,
          style: { opacity: 1 },
          data: props
        } ] : []}
      >
        {interpolatedStyles => (
          <div>
            {interpolatedStyles.map(config => (
              <div
                key={config.key}
                style={{ ...styles.fill, ...config.style }}
              >
                <Component {...config.data}/>
              </div>
            ))}
          </div>
        )}
      </TransitionMotion>
    )}/>
  )
}

const NavLink = (props) => (
  <li style={styles.navItem}>
    <Link {...props} style={{ color: 'inherit' }}/>
  </li>
)

const HSL = ({ match: { params } }) => (
  <div style={{
    ...styles.hsl,
    background: `hsl(${params.h}, ${params.s}%, ${params.l}%)`
  }}>hsl({params.h}, {params.s}%, {params.l}%)</div>
)

const styles = {}

styles.fill = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0
}

styles.content = {
  ...styles.fill,
  top: '40px',
  textAlign: 'center'
}

styles.nav = {
  padding: 0,
  margin: 0,
  position: 'absolute',
  top: 0,
  height: '40px',
  width: '100%',
  display: 'flex'
}

styles.navItem = {
  textAlign: 'center',
  flex: 1,
  listStyleType: 'none',
  padding: '10px'
}

styles.hsl  = {
  ...styles.fill,
  color: 'white',
  paddingTop: '20px',
  fontSize: '30px'
}

export default AnimationExample
