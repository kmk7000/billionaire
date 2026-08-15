// Entry point for the operator console — a build target separate from the
// consumer app (see vite.admin.config.ts for why).

import React from 'react';
import { createRoot } from 'react-dom/client';
import './admin.css';
import { AdminApp } from './AdminApp';

const container = document.getElementById('admin-root');
if (!container) throw new Error('#admin-root not found');

createRoot(container).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>
);
