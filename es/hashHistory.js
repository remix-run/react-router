import createHashHistory from 'history/lib/createHashHistory';
import createRouterHistory from './createRouterHistory';
export default createRouterHistory(createHashHistory);