import * as React from 'react';
import { render } from 'react-dom';
import { act } from 'react-dom/test-utils';
import {
  MemoryRouter as Router,
  Routes,
  Route,
  useSearchParams
} from 'react-router-dom';

describe('useSearchParams', () => {
  function SearchPage() {
    let queryRef = React.useRef();
    let [searchParams, setSearchParams] = useSearchParams({ q: '' });
    let query = searchParams.get('q');

    function handleSubmit(event) {
      event.preventDefault();
      setSearchParams({ q: queryRef.current.value });
    }

    return (
      <div>
        <p>The current query is "{query}".</p>

        <form onSubmit={handleSubmit}>
          <input name="q" defaultValue={query} ref={queryRef} />
        </form>
      </div>
    );
  }

  let node;
  beforeEach(() => {
    node = document.createElement('div');
    document.body.appendChild(node);
  });

  afterEach(() => {
    document.body.removeChild(node);
    node = null;
  });

  it('reads and writes the search string', () => {
    act(() => {
      render(
        <Router initialEntries={['/search?q=Michael+Jackson']}>
          <Routes>
            <Route path="search" element={<SearchPage />} />
          </Routes>
        </Router>,
        node
      );
    });

    let form = node.querySelector('form');
    expect(form).toBeDefined();

    let queryInput = node.querySelector('input[name=q]');
    expect(queryInput).toBeDefined();

    expect(node.innerHTML).toMatch(/The current query is "Michael Jackson"/);

    act(() => {
      queryInput.value = 'Ryan Florence';
      form.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );
    });

    expect(node.innerHTML).toMatch(/The current query is "Ryan Florence"/);
  });
});
