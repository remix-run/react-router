import React from 'react';

class Announcements extends React.Component {
  render () {
    return (
      <div>
        <h3>Announcements</h3>
        {this.props.children || <p>Choose an announcement from the sidebar.</p>}
      </div>
    );
  }

}

export default Announcements;

