/*globals COURSES:true */
import React from 'react'
import { Link } from 'react-router'

class Sidebar extends React.Component {
  render() {
    let { assignments } = COURSES[this.props.params.courseId]

    return (
      <div>
        <h3>Sidebar Assignments</h3>
        <ul>
          {assignments.map(assignment => (
            <li key={assignment.id}>
              <Link to={`/course/${this.props.params.courseId}/assignments/${assignment.id}`}>
                {assignment.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    )
  }
}

module.exports = Sidebar
