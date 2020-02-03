import React from 'react';
import { Outlet } from 'react-router-dom';

export default function Messages() {
  return (
    <div>
      <h1>Messages</h1>
      <Outlet />
    </div>
  );
}
