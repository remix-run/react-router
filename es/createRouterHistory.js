import useRouterHistory from './useRouterHistory';

var canUseDOM = !!(typeof window !== 'undefined' && window.document && window.document.createElement);

export default function createRouterHistory(createHistory) {
  var history = void 0;
  if (canUseDOM) history = useRouterHistory(createHistory)();
  return history;
}