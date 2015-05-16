import React from 'react';
import { Link } from 'react-router';

class Sidebar extends React.Component {
  static getAsyncProps (params, cb) {
    cb(null, {
      assignments: COURSES[params.courseId].assignments
    });
  }

  render () {
    return (
      <div>
        <h3>Sidebar Assignments</h3>
        <ul>
          {this.props.assignments.map(assignment => (
            <li key={assignment.id}>
              <Link to={`/course/${this.props.params.courseId}/assignments/${assignment.id}`}>
                {assignment.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

}

export default Sidebar;

