import React from 'react';
import { useParams } from 'react-router-dom';

export default function Message() {
  let { messageId } = useParams();
  return <h2>Message {messageId}</h2>;
}
