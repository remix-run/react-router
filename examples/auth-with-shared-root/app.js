import React from 'react';
import { Router } from "react-router";
import routes from "./config/routes";

React.render((
  <Router routes={routes}/>
), document.getElementById('example'));
