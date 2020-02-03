import React from 'react';
import { useParams } from 'react-router-dom';

export default function UserDashboard() {
  let { userId } = useParams();
  return <h2>Dashboard for user {userId}</h2>;
}
