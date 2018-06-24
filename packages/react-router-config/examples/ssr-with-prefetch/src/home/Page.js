import React from 'react';
import { connect } from 'react-redux'
import { Link } from 'react-router-dom';
import cn from 'classnames/bind';

import styles from './Page.scss';
const cx = cn.bind(styles);

const ChuckJokePage = ({ dispatch }) => (
  <div>
    <Link className={cx('button')} to='/pre-fetch'>Pre Fetch Jokes</Link>
    <Link className={cx('button')} to='/no-fetch'>Fetch boring ,non-prefetched (still funny) Jokes</Link>
  </div>
);

export default connect()(ChuckJokePage);
