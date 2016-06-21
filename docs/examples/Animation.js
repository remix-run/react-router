import React from 'react'
import { Router, Match, Link, Redirect } from 'react-router'
import { TransitionMotion, spring } from 'react-motion'

const AnimationExample = ({ history }) => (
  <Router history={history}>
    <div style={styles.fill}>
      <ul style={styles.nav}>
        <NavLink to="/10/50/50">Red</NavLink>
        <NavLink to="/50/70/50">Yellow</NavLink>
        <NavLink to="/200/50/50">Blue</NavLink>
        <NavLink to="/300/50/50">Dunno</NavLink>
      </ul>

      <div style={styles.content}>
        <MatchWithFade pattern="/:h/:s/:l" component={HSL}/>
      </div>

      <Match exactly pattern="/" render={() => (
        <Redirect to="/10/50/50"/>
      )}/>
    </div>
  </Router>
)


////////////////////////////////////////////////////////////
const MatchWithFade = ({ component:Component, ...rest }) => {
  const willLeave = () => ({ zIndex: 1, opacity: spring(0) })
  return (
    <Match {...rest} children={({ matched, ...props}) => (
      <TransitionMotion
        willLeave={willLeave}
        styles={matched ? [{
          key: props.location.key || 'initial',
          style: { opacity: 1 },
          data: props
        }] : []}
      >
        {interpolatedStyles => (
          <div>
            {interpolatedStyles.map(config => (
              <div
                key={config.key}
                style={{ ...styles.fill, ...config.style}}
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


////////////////////////////////////////////////////////////
const NavLink = (props) => (
  <li style={styles.navItem}>
    <Link {...props} style={{ color: 'inherit' }}/>
  </li>
)

const HSL = ({ params }) => (
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
