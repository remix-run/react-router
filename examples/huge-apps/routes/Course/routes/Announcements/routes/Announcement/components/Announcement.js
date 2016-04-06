/*globals COURSES:true */
import React, { Component } from 'react'

class Announcement extends Component {
  render() {
    let { courseId, announcementId } = this.props.params
    let { title, body } = COURSES[courseId].announcements[announcementId]

    return (
      <div>
        <h4>{title}</h4>
        <p>{body}</p>
      </div>
    )
  }
}

module.exports = Announcement
