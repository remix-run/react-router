import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import cn from 'classnames/bind';
import PropTypes from 'prop-types';

import { fetchJoke, refreshPage } from './action';
import styles from './PagePrefetch.scss';

const cx = cn.bind(styles);

const ChuckJokePage = ({ jokes, fetchJoke }) => (
  <div>
    <div>
      <Link className={cx('title')} to="/">True facts about Chuck Norris...</Link>
      <button className={cx('button')} onClick={refreshPage}>Refresh Page</button>
      <button className={cx('button')} onClick={fetchJoke}>Fetch another Joke</button>
    </div>
    <div className={cx('jokeList')}>
      {
        jokes.map((joke, i) => {
          return (
            <div className={cx('joke')} key={joke}>
              <span className={cx('number')}>{i + 1}.</span>
              {joke.value}
            </div>
          )
        })
      }
    </div>
  </div>
);

ChuckJokePage.propTpyes = {
  jokes: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
};

const mapState = state => {
  return {
    jokes: state.chuck,
  };
};

const mapDispatch = {
  fetchJoke,
}

export default connect(mapState, mapDispatch)(ChuckJokePage);
