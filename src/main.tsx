import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import  { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId='83856732962-nn7g1391v8h0ss317eqiaveg98fqgh74.apps.googleusercontent.com'>
    <ErrorBoundary>
      <Toaster  />
      <App />
    </ErrorBoundary>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);