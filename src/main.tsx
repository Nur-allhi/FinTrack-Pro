window.onerror = function (msg, url, lineNo, columnNo, error) {
  document.body.innerHTML = '<div style="background:red;color:white;padding:20px;font-size:20px;white-space:pre-wrap;">' + (error?.stack || msg) + '</div>';
  return false;
};
window.onunhandledrejection = function (event) {
  document.body.innerHTML = '<div style="background:red;color:white;padding:20px;font-size:20px;white-space:pre-wrap;">Unhandled Promise Rejection: ' + (event.reason?.stack || event.reason) + '</div>';
};

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
