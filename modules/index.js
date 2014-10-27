var Router = require('./Router');

Router.DefaultRoute = require('./components/DefaultRoute');
Router.Link = require('./components/Link');
Router.NotFoundRoute = require('./components/NotFoundRoute');
Router.Redirect = require('./components/Redirect');
Router.Route = require('./components/Route');

Router.HashLocation = require('./locations/HashLocation');
Router.HistoryLocation = require('./locations/HistoryLocation');
Router.RefreshLocation = require('./locations/RefreshLocation');

Router.ActiveState = require('./mixins/ActiveState');
Router.CurrentPath = require('./mixins/CurrentPath');
Router.Navigation = require('./mixins/Navigation');

module.exports = Router;
