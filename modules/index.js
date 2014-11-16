var Router = require('./Router');

Router.DefaultRoute = require('./components/DefaultRoute');
Router.Link = require('./components/Link');
Router.NotFoundRoute = require('./components/NotFoundRoute');
Router.Redirect = require('./components/Redirect');
Router.Route = require('./components/Route');
Router.RouteHandler = require('./components/RouteHandler');

Router.HashLocation = require('./locations/HashLocation');
Router.HistoryLocation = require('./locations/HistoryLocation');
Router.RefreshLocation = require('./locations/RefreshLocation');

Router.Navigation = require('./mixins/Navigation');
Router.State = require('./mixins/State');

module.exports = Router;
