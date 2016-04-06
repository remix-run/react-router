/*globals COURSES:true */
import React, { Component } from 'react'

class Assignment extends Component {
  render() {
    let { courseId, assignmentId } = this.props.params
    let { title, body } = COURSES[courseId].assignments[assignmentId]

    return (
      <div>
        <h4>{title}</h4>
        <p>{body}</p>
      </div>
    )
  }
}

module.exports = Assignment
