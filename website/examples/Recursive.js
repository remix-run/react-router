import React from 'react'
import Router from 'react-router/BrowserRouter'
import Route from 'react-router/Route'
import Link from 'react-router/Link'

const PEEPS = [
  { id: 0, name: 'Michelle', friends: [ 1, 2, 3 ] },
  { id: 1, name: 'Sean', friends: [ 0, 3 ] },
  { id: 2, name: 'Kim', friends: [ 0, 1, 3 ], },
  { id: 3, name: 'David', friends: [ 1, 2 ] }
]

const find = (id) => PEEPS.find(p => p.id == id)

const RecursiveExample = () => (
  <Router>
    <Person params={{ id: 0 }} pathname=""/>
  </Router>
)

const Person = ({ params, pathname }) => {
  const person = find(params.id)

  return (
    <div>
      <h3>{person.name}’s Friends</h3>
      <ul>
        {person.friends.map(id => (
          <li key={id}>
            <Link to={`${pathname}/${id}`}>
              {find(id).name}
            </Link>
          </li>
        ))}
      </ul>
      <Route path={`${pathname}/:id`} component={Person}/>
    </div>
  )
}

export default RecursiveExample
