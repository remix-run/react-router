import React from 'react';
import { Link } from 'react-router';

class Sidebar extends React.Component {

  //static loadProps (params, cb) {
    //cb(null, {
      //assignments: COURSES[params.courseId].assignments
    //});
  //}

  render () {
    //var { assignments } = this.props;
    var assignments = COURSES[this.props.params.courseId].assignments

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
    );
  }

}

export default Sidebar;

