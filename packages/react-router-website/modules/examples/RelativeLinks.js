import React from 'react'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from 'react-router-dom'

const FAMILY = [
  { id: 0, name: 'Albert and Betty', kids: [1, 2, 3], ancestors: []},
  { id: 1, name: 'Cecil and Dana' },
  { id: 2, name: 'Ellen and Fran', kids: [4, 5]},
  { id: 3, name: 'George' },
  { id: 4, name: 'Helen' },
  { id: 5, name: 'Isaac and Janet', kids: [6]},
  { id: 6, name: 'Kanye' }
]

// add ancestor and sibling references
FAMILY.forEach(f => {
  if (f.kids) {
    f.kids.forEach((k, i) => {
      const kid = FAMILY[k]
      kid.ancestors = [f.id, ...f.ancestors]
      kid.siblings = [...f.kids.slice(0, i), ...f.kids.slice(i+1)]
    })
  }
})

// A Link with no starting slash is relative to its parent's match.url
const ChildLink = ({ id, name}) => <Link to={`${id}`}>{name} ({id})</Link>

// Usage double dot relative paths to go up levels
const ParentLink = ({ name }) =>
  <Link to='..'>Parents {name} (..)</Link>

const GrandparentLink = ({ name }) =>
  <Link to='../..'>Grandparents {name} (../..)</Link>

const GreatGrandparentLink = ({ name }) =>
  <Link to='../../..'>Great-Grandparents {name} (../../..)</Link>

const AncestorLinks = [ParentLink, GrandparentLink, GreatGrandparentLink]

// Double dot notation can also be used to link to sibling routes
const SiblingLink = ({ id, name }) => <Link to={`../${id}`}>{name} (../{id})</Link>

const PersonView = ({ match }) => (
  <Switch>
    <Route exact path={`${match.url}`} render={() => (
      <Person details={FAMILY[parseInt(match.params.id, 10)]} />
    )} />
    <Route path={`${match.url}/:id`} component={PersonView} />
  </Switch>
)

const People = ({ people, title, getComponent }) => (
  !people || !people.length
  ? null
  : <div>
      <h2>{title}</h2>
      <ul>
        {people
          .map(p => FAMILY[p])
          .map((p, i) => {
            const Component = getComponent(i)
            return (
              <li key={p.id}>
                <Component id={p.id} name={p.name} />
              </li>
            )
          })}
      </ul>
    </div>

)

const Person = ({ details }) => (
  !details
    ? <div>This person does not exist!</div>
    : <div>
        {/* Pathnames with a leading slash are always absolute */}
        <Link to='/'>Home</Link>
        <h1>{details.name}</h1>
        <People
          title="Children"
          people={details.kids}
          getComponent={() => ChildLink} />
        <People
          title="Siblings"
          people={details.siblings}
          getComponent={() => SiblingLink} />
        <People
          title="Ancestors"
          people={details.ancestors}
          getComponent={(i) => AncestorLinks[i]} />
      </div>

)

const fullPath = (person) => [person.id].concat(person.ancestors).reverse().join('/')

const Tree = () => (
  <div>
    <h1>Family Tree</h1>
    <ul>
      {
        FAMILY.map(p => (
          <li key={p.id}>
            <Link to={fullPath(p)}>{p.name}</Link>
          </li>
        ))
      }
    </ul>
  </div>
)

const RelativeTree = () => (
  <Switch>
    <Route exact path='/' component={Tree} />
    <Route path='/:id' component={PersonView} />
  </Switch>
)

export default RelativeTree
