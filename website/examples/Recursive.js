import React from 'react'
import Match from 'react-router/Match'
import Miss from 'react-router/Miss'
import Link from 'react-router/Link'
import Redirect from 'react-router/Redirect'
import Router from 'react-router/BrowserRouter'

const PEEPS = [
  { id: 0, name: 'Michelle', friends: [ 1, 2, 3 ] },
  { id: 1, name: 'Sean', friends: [ 0, 3 ] },
  { id: 2, name: 'Kim', friends: [ 0, 1, 3 ], },
  { id: 3, name: 'David', friends: [ 1, 2 ] }
]

const find = (id) => PEEPS.find(p => p.id == id)

const Person = ({ pathname, params }) => {
  const person = find(params.id)
  return (
    <div>
      <h3>{person.name}’s Friends</h3>
      <ul>
        {person.friends.map((id) => (
          <li key={id}>
            <Link to={`${pathname}/${id}`}>
              {find(id).name}
            </Link>
          </li>
        ))}
      </ul>
      <Match pattern={`${pathname}/:id`} component={Person}/>
    </div>
  )
}

const RecursiveExample = () => {
  return (
    <Router>
      <Person params={{ id: 0 }} pathname=""/>
    </Router>
  )
}

export default RecursiveExample


