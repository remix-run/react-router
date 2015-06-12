import React from 'react';
import { Link } from 'react-router';

export default class AnnouncementsSidebar extends React.Component {

  //static loadProps (params, cb) {
    //cb(null, {
      //announcements: COURSES[params.courseId].announcements
    //});
  //}

  render () {
    //var { announcements } = this.props;
    var announcements = COURSES[this.props.params.courseId].announcements;
    return (
      <div>
        <h3>Sidebar Assignments</h3>
        <ul>
          {announcements.map(announcement => (
            <li key={announcement.id}>
              <Link to={`/course/${this.props.params.courseId}/announcements/${announcement.id}`}>
                {announcement.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

}

