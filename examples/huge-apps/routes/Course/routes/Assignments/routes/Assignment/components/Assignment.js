import React from 'react';

class Assignment extends React.Component {

  static getAsyncProps (params, cb) {
    cb(null, {
      assignment: COURSES[params.courseId].assignments[params.assignmentId]
    });
  }

  render () {
    var { title, body } = this.props.assignment;
    return (
      <div>
        <h4>{title}</h4>
        <p>{body}</p>
      </div>
    );
  }

}

export default Assignment;

