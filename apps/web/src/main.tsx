import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './StudioApp';
import './studio.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
