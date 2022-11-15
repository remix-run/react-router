import { useNavigate, useRouteError } from "react-router-dom";

import { getError } from './utils';

export const ErrorPage = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  return (
    <div id="error-page">
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <i>{getError(error)}</i>
      </p>
      <button onClick={() => navigate('/')}>Go to Home</button>
    </div>
  );
}
