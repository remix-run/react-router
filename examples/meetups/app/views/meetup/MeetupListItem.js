import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';
import './meetup.less';

const { number, string, object } = PropTypes;

export default class MeetupListItem extends Component {
  static propTypes = {
    name: string,
    link: string,
    description: string,
    group_photo: object,
    organizer: object,
    id: number,
  };

  render() {
    const { id, name, description } = this.props;
    const path = `/meetup/${id}`;

    // strip html tags
    const noTagsDesc = description.replace(/<\/?[^>]+(>|$)/g, '');

    return (
      <article className="meetup-list-item">
        <div className="meetup-name"><Link to={path}>{name}</Link></div>
        <div className="meetup-description-short" dangerouslySetInnerHTML={{__html: noTagsDesc}}></div>
      </article>
    );
  }
}
