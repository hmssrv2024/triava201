import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

// Only attempt to render if the root element is found.
// This prevents an error if the script is loaded in an unexpected context
// (like the main index.html page) and allows the app to render correctly
// inside the widget.html iframe where the 'root' div exists.
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
