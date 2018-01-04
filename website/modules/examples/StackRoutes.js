import React from 'react'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  withRouter,
  matchPath
} from 'react-router-dom'

// OPEN THE DEV-TOOLS AND INSPECT THE DOM ELEMENTS!!!


const styles = {
  page: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    background: '#fff',
  },
}


const db = {
  authors: [
    { id: '8', name: 'jack', gender: 'M', },
    { id: '1', name: 'tom', gender: 'M' },
    { id: '7', name: 'lily', gender: 'F' },
  ],
  posts: [
    { id: '3', title: 'i like javascript', author_id: '8' },
    { id: '2', title: 'i like rust', author_id: '8' },
    { id: '7', title: `it's sunny`, author_id: '8' },
    { id: '5', title: 'i like javascript too', author_id: '1' },
  ],
}


const Home = () => <div style={styles.page}>
  <h1>OPEN THE DEV-TOOLS AND INSPECT THE DOM ELEMENTS!!!</h1>
  <h2>Home</h2>
  <Link to="/authors/8">jack</Link>
</div>


const Author = ({ match, location, history }) => {
  const author_id = match.params.author_id
  const author = db.authors.find(a => a.id === author_id)
  if (!author) {
    return <div style={styles.page}>
      <h1>OPEN THE DEV-TOOLS AND INSPECT THE DOM ELEMENTS!!!</h1>
      <h2>Author with id: {author_id} doesn't exist.</h2>
    </div>
  }
  const posts = db.posts.filter(p => p.author_id === author_id)
  const others = db.authors.filter(a => a.id !== author_id)
  return <div style={styles.page}>
    <h1>OPEN THE DEV-TOOLS AND INSPECT THE DOM ELEMENTS!!!</h1>
    <h2>name: {author.name}</h2>
    <h6>gender: {author.gender}</h6>
    <div>
      <h4>posts:</h4>
      <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>
    </div>
    <div>
      <h5>others:</h5>
      <ul>{others.map(o => <li key={o.id}><Link to={'/authors/' + o.id}>{o.name}</Link></li>)}</ul>
    </div>
  </div>
}


const routes = [
  { path: '/authors/:author_id', component: Author },
  { path: '/', render: Home },
]


// OPEN THE DEV-TOOLS AND INSPECT THE DOM ELEMENTS!!!

class StackRoutes extends React.Component {
  constructor(props) {
    super(props)
    this.state = { locations: [props.location] }
    // set the max layer
    this.max_layer = 5
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.location != this.props.location) {
      if (nextProps.history.action === 'PUSH') {
        const next_route = routes.find(r => !!matchPath(nextProps.location.pathname, r))
        const this_route = routes.find(r => !!matchPath(this.props.location.pathname, r))
        if (next_route != this_route) {
          this.setState({ locations: this.state.locations.concat(nextProps.location).slice(-this.max_layer) })
        } else {
          const next_match = matchPath(nextProps.location.pathname, next_route)
          const this_match = matchPath(this.props.location.pathname, this_route)
          // console.log(next_match, this_match)
          if (next_match.url !== this_match.url) {
            this.setState({ locations: this.state.locations.concat(nextProps.location).slice(-this.max_layer) })
          } else {
            this.setState({ locations: this.state.locations.slice(0, -1).concat(nextProps.location).slice(-this.max_layer) })
          }
        }
      } else if (nextProps.history.action === 'POP') {
        this.setState({ locations: this.state.locations.slice(0, -2).concat(nextProps.location).slice(-this.max_layer) })
      } else if (nextProps.history.action === 'REPLACE') {
        this.setState({ locations: this.state.locations.slice(0, -1).concat(nextProps.location).slice(-this.max_layer) })
      }
    }
  }
  render() {
    const { state: { locations } } = this
    // shouldn't use location.key because it will make normal push rebuild almost whole page
    return <div>
      {locations.map((loc, i) => <Switch key={i} location={loc}>
        {routes.map(route => <Route key={route.name} {...route}></Route>)}
      </Switch>)}
    </div>
  }
}

StackRoutes = withRouter(StackRoutes)

// OPEN THE DEV-TOOLS AND INSPECT THE DOM ELEMENTS!!!

export default () => <Router>
  <StackRoutes/>
</Router>
