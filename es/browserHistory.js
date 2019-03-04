import createBrowserHistory from 'history/lib/createBrowserHistory';
import createRouterHistory from './createRouterHistory';
export default createRouterHistory(createBrowserHistory);