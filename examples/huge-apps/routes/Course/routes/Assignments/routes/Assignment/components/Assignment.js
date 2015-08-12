import React from 'react';

class Assignment extends React.Component {

  render () {
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

