/** @jsx React.DOM */
var Dashboard = React.createClass({

  render: function() {
    return (
      <div>
        <h1>Dashboard!</h1>
        <ul>
          <li><Link to="inbox">Inbox</Link></li>
        </ul>
        {this.props.activeRoute}
      </div>
    );
  }
});

