import React from 'react';
import { createRoot } from 'react-dom/client';
import { Route } from 'wouter';

import Home from './views/Home/App';
import Notification from './views/Notification/App';
import Options from './views/Options/App';
import Popup from './views/Popup/App';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <Route path='/' component={Popup} />
    <Route path='/home' component={Home} />
    <Route path='/options' component={Options} />
    <Route path='/notification' component={Notification} />
  </React.StrictMode>
);
