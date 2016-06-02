import React from 'react'
import { Router, Match, Link } from 'react-router'

const genKey = () => Math.random().toString(36).substr(2, 5)

const RecursiveExample = ({ history }) => (
  <Router history={history}>
    <RecursiveChild />
  </Router>
)

class RecursiveChild extends React.Component {

  state = { childId: null }

  componentWillMount() {
    this.setState({ childId: genKey() })
  }

  render = () => {
    const { pathname, params } = this.props
    const { childId } = this.state
    return (
      <ul>
        <li>
          {(params && params.id) || 'root'}{' '}
          <Link to={`${pathname || ''}/${childId}`}>we must go deeper</Link>
          <Match pattern={`${pathname || ''}/:id`} children={RecursiveChild}/>
        </li>
      </ul>
    )
  }

}

export default RecursiveExample

