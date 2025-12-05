'use client';

import { ThemeProvider, Container, Box } from "@mui/material";
import SideNavBar from "@/components/SideNavBar";
import NavBreadcrumbs from "@/components/NavBreadcrumbs";
import customTheme from '@/styles/customTheme.js';

export default function FacultyLayout({ children, pathArr }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <SideNavBar role='Faculty' />
      <Container maxWidth="xl">
        <NavBreadcrumbs path={pathArr} />
        <Box sx={{ pl: 2, mt: 3 }}>
          {children}
        </Box>
      </Container>
    </div>
  );
}