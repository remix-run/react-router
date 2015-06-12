import React from 'react';
import { Link } from 'react-router';

const styles = {};

class GlobalNav extends React.Component {

  static defaultProps = {
    user: {
      id: 1,
      name: 'Ryan Florence'
    }
  };

  constructor (props, context) {
    super(props, context);
    this.logOut = this.logOut.bind(this);
  }

  logOut () {
    alert('log out');
  }

  render () {
    var { user } = this.props;
    return (
      <div style={styles.wrapper}>
        <div style={{float: 'left'}}>
          <Link to="/" style={styles.link}>Home</Link>{' '}
          <Link to="/calendar" style={styles.link}>Calendar</Link>{' '}
          <Link to="/grades" style={styles.link}>Grades</Link>{' '}
          <Link to="/messages" style={styles.link}>Messages</Link>{' '}
        </div>
        <div style={{float: 'right'}}>
          <Link style={styles.link} to="/profile">{user.name}</Link> <button onClick={this.logOut}>log out</button>
        </div>
      </div>
    );
  }
}

styles.wrapper = {
  padding: '10px 20px',
  overflow: 'hidden',
  background: 'hsl(200, 20%, 20%)',
  color: '#fff'
};

styles.link = {
  padding: 10,
  color: '#fff',
  fontWeight: 200
}

export default GlobalNav;

