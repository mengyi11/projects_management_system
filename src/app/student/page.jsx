'use client';

import React from 'react';
import { Box, Card, CardContent, Typography, CardActions, Button, Grid } from "@mui/material";
import AdminLayout from "@/components/AdminLayout";
import iconMap from '@/styles/iconMap';

export default function StudentDashboard() {
    const pathArr = ["Student", "Dashboard"];
    const userRole = "Student";
    const PersonIcon = iconMap["Person2"];
    const PropIcon = iconMap["Proposal"];
    const RegisIcon = iconMap["Registration"];
    const ProjIcon = iconMap["Project"];
    const GradeIcon = iconMap["Grade"];
    const Enter = iconMap["Enter"];
    return (
        <AdminLayout pathArr={pathArr} userRole={userRole}>
            <Typography variant='h4' sx={{ mb: 3 }}>Dashboard</Typography>
            <Typography variant='h5' sx={{ mb: 3 }}>Welcome Back!</Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item size={{ xs: 12, md: 6, lg: 4 }}>
                    <Card sx={{ bgcolor: 'background.paper', p: 1, pb: 2 }} >
                        <CardContent >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <RegisIcon sx={{ fontSize: 25 }} />
                                <Typography variant='dashTitle'  >
                                    Project Registration
                                </Typography>
                            </Box>
                            <Typography sx={{ color: "text.secondary", mb: 1, wordBreak: 'break-word', }}>
                                xxxxxxxxxxxxxxxxxxxxxxxx
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <RegisIcon sx={{ fontSize: 20 }} />
                                <Typography variant='body2'>
                                    xddddddd
                                </Typography>
                            </Box>
                        </CardContent>
                        <CardActions>
                            <Button variant="contained" size="medium" color='white' fullWidth >
                                Manage Registration
                                <Enter sx={{ fontSize: 20, ml: 3 }} />
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
                <Grid item size={{ xs: 12, md: 6, lg: 4 }}>
                    <Card sx={{ bgcolor: 'background.paper', p: 1, pb: 2 }} >
                        <CardContent >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <ProjIcon sx={{ fontSize: 25 }} />
                                <Typography variant='dashTitle'  >
                                    Project Status
                                </Typography>
                            </Box>
                            <Typography sx={{ color: "text.secondary", mb: 1, wordBreak: 'break-word', }}>
                                xxxxxxxxxxxxxxxxxxxxxxxx
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ProjIcon sx={{ fontSize: 20 }} />
                                <Typography variant='body2'>
                                    View Project Status
                                </Typography>
                            </Box>
                        </CardContent>
                        <CardActions>
                            <Button variant="contained" size="medium" color='white' fullWidth >
                                Manage Project
                                <Enter sx={{ fontSize: 20, ml: 3 }} />
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
                <Grid item size={{ xs: 12, md: 6, lg: 4 }}>
                    <Card sx={{ bgcolor: 'background.paper', p: 1, pb: 2 }} >
                        <CardContent >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <PersonIcon sx={{ fontSize: 25 }} />
                                <Typography variant='dashTitle'  >
                                    Team Members
                                </Typography>
                            </Box>
                            <Typography sx={{ color: "text.secondary", mb: 1, wordBreak: 'break-word', }}>
                                xxxxxxxxxxxxxxxxxxxxxxxx
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PersonIcon sx={{ fontSize: 20 }} />
                                <Typography variant='body2'>
                                    xddddddd
                                </Typography>
                            </Box>
                        </CardContent>
                        <CardActions>
                            <Button variant="contained" size="medium" color='white' fullWidth >
                                Peer Review
                                <Enter sx={{ fontSize: 20, ml: 3 }} />
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
            </Grid>
            <Grid container mt={2}>
                <Grid item size={{ xs: 12 }}>
                    <Card sx={{ bgcolor: 'background.paper', p: 1, pb: 2 }} >
                        <CardContent >

                            <Typography variant='dashTitle' sx={{ mb: 2 }}>
                                Quick Links
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Grid container spacing={2} sx={{ width: '100%' }}>
                                <Grid item size={{ xs: 12, md: 6 }} >
                                    <Button variant="contained" size="medium" color='white' sx={{ display: 'flex', justifyContent: 'flex-start' }} fullWidth >
                                        <PropIcon sx={{ fontSize: 20, mr: 2 }} />
                                        Add Proposal
                                    </Button>
                                </Grid>
                                <Grid item size={{ xs: 12, md: 6 }}>
                                    <Button variant="contained" size="medium" color='white' sx={{ display: 'flex', justifyContent: 'flex-start' }} fullWidth >
                                        <ProjIcon sx={{ fontSize: 20, mr: 2 }} />
                                        View My Projects
                                    </Button>
                                </Grid>
                                <Grid item size={{ xs: 12, md: 6 }}>
                                    <Button variant="contained" size="medium" color='white' sx={{ display: 'flex', justifyContent: 'flex-start' }} fullWidth >
                                        <GradeIcon sx={{ fontSize: 20, mr: 2 }} />
                                        View Evaluation
                                    </Button>
                                </Grid>
                                <Grid item size={{ xs: 12, md: 6 }}>
                                    <Button variant="contained" size="medium" color='white' sx={{ display: 'flex', justifyContent: 'flex-start' }} fullWidth >
                                        <GradeIcon sx={{ fontSize: 20, mr: 2 }} />
                                        View Analytics
                                    </Button>
                                </Grid>
                            </Grid>

                        </CardActions>
                    </Card>
                </Grid>
            </Grid>
        </AdminLayout>
    );
} 