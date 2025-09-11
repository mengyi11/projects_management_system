'use client';

import { ThemeProvider, Container, Box } from "@mui/material";
import SideNavBar from "@/components/SideNavBar";
import NavBreadcrumbs from "@/components/NavBreadcrumbs";
import customTheme from '@/styles/customTheme.js';

export default function FacultyLayout({ children, pathArr, userRole }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
        <ThemeProvider theme={customTheme}>
            <SideNavBar role={userRole} />
            <Container maxWidth="xl">
                <NavBreadcrumbs path={pathArr} />
                <Box sx={{ pl: 2, mt: 3 }}>
                {children}
                </Box>
            </Container>
       </ThemeProvider>
    </div>
  );
}