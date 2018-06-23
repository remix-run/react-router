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
  loadData(store, routes, req.baseUrl)
    .then(data => {
      let context = {};
      const preloadedData = store.getState();
      const markup = getMarkup(store, req.url, context);
      res.status(200).send(
        html(assets, preloadedData, markup)
      );
    })
    .catch(e => {
      console.log(e);
      res.status(300).send({error: e})
    })
});

export default router;
