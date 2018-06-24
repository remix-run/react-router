import express from 'express';
import createMemoryHistory from 'history/createMemoryHistory';
import configureStore from '../store/configureStore';
import html from './html';

import { loadData, getMarkup } from './utils';
import routes from '../routes';

const assets = require(process.env.RAZZLE_ASSETS_MANIFEST);
const history = createMemoryHistory();
const store = configureStore(history, {});

/*eslint-disable*/
const router = express.Router();
/*eslint-enable*/

router.get("*", (req, res) => {
  // load data from ./utils --> dispatches preFetch for matching routes.
  loadData(store, routes, req.baseUrl)
    .then(preloadedData => {
      // we return preloadedData after all preFetch actions are dsipatched and
      // resolved.
      let context = {};
      const markup = getMarkup(store, req.url, context);
      if (context.url) {
        res.writeHead(301, {
          Location: context.url
        })
        res.end()
      }
      res.status(200).send(
        html(assets, preloadedData, markup)
      );
    })
    .catch(e => {
      console.log(e);
      res.status(500).send({error: e})
    })
});

export default router;
