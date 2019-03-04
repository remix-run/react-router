import useQueries from 'history/lib/useQueries';
import useBasename from 'history/lib/useBasename';
import baseCreateMemoryHistory from 'history/lib/createMemoryHistory';

export default function createMemoryHistory(options) {
  // signatures and type checking differ between `useQueries` and
  // `createMemoryHistory`, have to create `memoryHistory` first because
  // `useQueries` doesn't understand the signature
  var memoryHistory = baseCreateMemoryHistory(options);
  var createHistory = function createHistory() {
    return memoryHistory;
  };
  var history = useQueries(useBasename(createHistory))(options);
  return history;
}