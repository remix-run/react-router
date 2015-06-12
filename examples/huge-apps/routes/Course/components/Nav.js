import React from 'react';
import { Link } from 'react-router';
import AnnouncementsRoute from '../routes/Announcements';
import AssignmentsRoute from '../routes/Assignments';
import GradesRoute from '../routes/Grades';

const styles = {};

styles.nav = {
  borderBottom: '1px solid #aaa'
};

styles.link = {
  display: 'inline-block',
  padding: 10,
  textDecoration: 'none',
};

styles.activeLink = Object.assign({}, styles.link, {
  //color: 'red'
});

class Nav extends React.Component {

  render () {
    var { course } = this.props;
    var pages = [
      ['announcements', 'Announcements'],
      ['assignments', 'Assignments'],
      ['grades', 'Grades'],
    ];
    return (
      <nav style={styles.nav}>
        {pages.map((page, index) => (
          <Link
            key={page[0]}
            activeStyle={index === 0 ?
              Object.assign({}, styles.activeLink, { paddingLeft: 0 }) :
              styles.activeLink}
            style={index === 0 ?
              Object.assign({}, styles.link, { paddingLeft: 0 }) :
              styles.link }
            to={`/course/${course.id}/${page[0]}`}
          >{page[1]}</Link>
        ))}
      </nav>
    );
  }

}

export default Nav;

