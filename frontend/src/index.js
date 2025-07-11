// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css'; // ← Asegúrate de que esta línea esté aquí
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);