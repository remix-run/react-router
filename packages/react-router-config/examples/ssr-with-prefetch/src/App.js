import React from 'react';
import { renderRoutes } from 'react-router-config'
import cn from 'classnames/bind';

import routes from './routes';
import styles from './App.scss';

const cx = cn.bind(styles);

const App = () => (
  <div className={cx('container')}>
    {renderRoutes(routes)}
  </div>
);

export default App;
