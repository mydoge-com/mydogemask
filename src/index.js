import React from 'react';
import { createRoot } from 'react-dom/client';
import { Route } from 'wouter';

import Home from './views/Home/App';
import Popup from './views/Popup/App';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <Route path='/' component={Popup}>
      About Us
    </Route>
    <Route path='/home' component={Home}>
      About Us
    </Route>
  </React.StrictMode>
);
