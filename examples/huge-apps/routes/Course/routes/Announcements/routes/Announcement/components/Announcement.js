import React from 'react';

class Announcement extends React.Component {

  //static loadProps (params, cb) {
    //cb(null, {
      //announcement: COURSES[params.courseId].announcements[params.announcementId]
    //});
  //}

  render () {
    //var { title, body } = this.props.announcement;
    var { courseId, announcementId } = this.props.params;
    var { title, body } = COURSES[courseId].announcements[announcementId];
    return (
      <div>
        <h4>{title}</h4>
        <p>{body}</p>
      </div>
    );
  }

}

export default Announcement;

