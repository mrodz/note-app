import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from '../src/App/App'
import { BrowserRouter } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { AccountContext } from './AccountContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <SnackbarProvider maxSnack={3}>
        <AccountContext>
          <App />
        </AccountContext>
      </SnackbarProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
