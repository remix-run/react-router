import React from 'react';
import Dashboard from './Dashboard';
import GlobalNav from './GlobalNav';

class App extends React.Component {
  render() {
    var courses = COURSES;

    return (
      <div>
        <GlobalNav />
        <div style={{ padding: 20 }}>
          {this.props.children || <Dashboard courses={courses} />}
        </div>
      </div>
    );
  }
}

export default App;
