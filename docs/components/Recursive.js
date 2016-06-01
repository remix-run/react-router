import React from 'react'
import { MatchLocation, Link } from 'react-router'

const genKey = () => Math.random().toString(36).substr(2, 5)

const Recursive = (props) => {
  return (
    <div>
      <h2>Recursive</h2>
      <RecursiveChild {...props}/>
    </div>
  )
}

class RecursiveChild extends React.Component {
  state = { childId: null }

  componentWillMount = () => this.setState({ childId: genKey() })

  render = () => {
    const { pathname, params } = this.props
    const { childId } = this.state
    return (
      <ul>
        <li>
          {params.id || 'root'}{' '}
          <Link to={`${pathname}/${childId}`}>we must go deeper</Link>
          <MatchLocation pattern={`${pathname}/:id`} children={RecursiveChild}/>
        </li>
      </ul>
    )
  }

}

export default Recursive

