import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StayCoreProvider } from '@staycore/booking-sdk/react';
import App from './App.tsx';
import { PMS_BASE_URL, PMS_ORG_SLUG } from './config.ts';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('No #root element found in index.html — cannot mount React.');
}

createRoot(rootEl).render(
  <StrictMode>
    <StayCoreProvider orgSlug={PMS_ORG_SLUG} baseUrl={PMS_BASE_URL}>
      <App />
    </StayCoreProvider>
  </StrictMode>,
);
