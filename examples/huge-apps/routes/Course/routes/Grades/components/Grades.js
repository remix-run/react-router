import React from 'react';

class Grades extends React.Component {

  //static loadProps (params, cb) {
    //cb(null, {
      //assignments: COURSES[params.courseId].assignments
    //});
  //}


  render () {
    //var { assignments } = this.props;
    var assignments = COURSES[this.props.params.courseId].assignments;
    return (
      <div>
        <h3>Grades</h3>
        <ul>
          {assignments.map(assignment => (
            <li key={assignment.id}>{assignment.grade} - {assignment.title}</li>
          ))}
        </ul>
      </div>
    );
  }
}

export default Grades;

