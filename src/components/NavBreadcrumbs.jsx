import React from 'react';
import { Box, Breadcrumbs, Typography,Divider } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from "@mui/icons-material/Home";
import Link from 'next/link';

const NavBreadcrumbs = ({  path }) => {
    return (
            <Box display="flex" alignItems="center" pl={1} mt={3} pb={2}>
                <HomeIcon sx={{ mr: 1, color: "text.secondary" }} />
                <Divider orientation="vertical" flexItem />
                <Breadcrumbs
                sx={{ ml: 3}} 
                    separator={<NavigateNextIcon fontSize="small"  />}
                >
                    {path.map((item, index) => (
                    <Link
                        key={index}
                        underline="hover"
                        color="inherit"
                        href="/student"
                        sx={{ display: "flex", alignItems: "center" }}
                    >
                        <Typography fontSize="0.8rem">{item}</Typography>
                    </Link>
                    ))}
                </Breadcrumbs>
            </Box>
       

        
    )
}

export default NavBreadcrumbs;
