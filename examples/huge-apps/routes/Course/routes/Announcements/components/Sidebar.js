import React from 'react';
import { Link } from 'react-router';

class Sidebar extends React.Component {
  static getAsyncProps (params, cb) {
    cb(null, {
      announcements: COURSES[params.courseId].announcements
    });
  }

  render () {
    return (
      <div>
        <h3>Sidebar Assignments</h3>
        <ul>
          {this.props.announcements.map(announcement => (
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

export default Sidebar;

