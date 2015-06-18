import React from 'react';

class Calendar extends React.Component {

  static loadProps(params, cb) {
    setTimeout(() => {
      cb(null, {
        events: [{
          id: 0, title: 'essay due'
        }]
      })
    }, 1000);
  }

  render () {
    var { events } = this.props;
    return (
      <div>
        <h2>Calendar</h2>
        <ul>
          {events.map(event => (
            <li key={event.id}>{event.title}</li>
          ))}
        </ul>
      </div>
    );
  }

}

export default Calendar;

