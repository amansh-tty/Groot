import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RootApp } from './ProjectHome';
import './studio.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootApp />
  </StrictMode>,
);
