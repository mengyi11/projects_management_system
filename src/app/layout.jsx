// src/app/layout.jsx
'use client';

import { ThemeProvider, CssBaseline } from '@mui/material';
import customTheme from '@/styles/customTheme'; 
import React from 'react';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={customTheme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}