import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { RepoProvider } from './context/RepoContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <RepoProvider>
        <App />
      </RepoProvider>
    </BrowserRouter>
  </React.StrictMode>
);

