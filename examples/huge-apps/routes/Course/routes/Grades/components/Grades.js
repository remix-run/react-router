import React from 'react';

class Grades extends React.Component {
  static getAsyncProps (params, cb) {
    cb(null, {
      assignments: COURSES[params.courseId].assignments
    });
  }


  render () {
    return (
      <div>
        <h3>Grades</h3>
        <ul>
          {this.props.assignments.map(assignment => (
            <li key={assignment.id}>{assignment.grade} - {assignment.title}</li>
          ))}
        </ul>
      </div>
    );
  }
}

export default Grades;

