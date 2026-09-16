import React from 'react';
import { createRoot } from 'react-dom/client';
import Modal from 'react-modal';
import { BrowserRouter } from 'react-router-dom';

import { ShareApp } from './ShareApp';

const root = document.getElementById('app-root');
if (!root) throw new Error('Missing #app-root');
Modal.setAppElement(root);

createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter>
      <ShareApp />
    </BrowserRouter>
  </React.StrictMode>,
);
