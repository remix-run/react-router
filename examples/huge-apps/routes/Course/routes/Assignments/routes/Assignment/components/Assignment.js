import React from 'react';

class Assignment extends React.Component {

  //static loadProps (params, cb) {
    //cb(null, {
      //assignment: COURSES[params.courseId].assignments[params.assignmentId]
    //});
  //}

  render () {
    //var { title, body } = this.props.assignment;
    var { courseId, assignmentId } = this.props.params;
    var { title, body } = COURSES[courseId].assignments[assignmentId]
    return (
      <div>
        <h4>{title}</h4>
        <p>{body}</p>
      </div>
    );
  }

}

export default Assignment;

