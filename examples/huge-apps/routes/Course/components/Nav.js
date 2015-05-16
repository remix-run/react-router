import React from 'react';
import { Link } from 'react-router';
import assign from 'object-assign';
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

styles.activeLink = assign({}, styles.link, {
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
              assign({}, styles.activeLink, { paddingLeft: 0 }) :
              styles.activeLink}
            style={index === 0 ?
              assign({}, styles.link, { paddingLeft: 0 }) :
              styles.link }
            to={`/course/${course.id}/${page[0]}`}
          >{page[1]}</Link>
        ))}
      </nav>
    );
  }

}

export default Nav;

