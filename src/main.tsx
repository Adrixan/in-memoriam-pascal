/**
 * Application Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import '@fontsource/ibm-plex-mono/700.css';
import '@fontsource/press-start-2p/400.css';
import '@fontsource/vt323/400.css';
import App from './App';
import './styles/globals.css';
import './i18n';

// Get root element
const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('Root element not found');
}

// Create React root and render
ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
