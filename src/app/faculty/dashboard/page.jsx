'use client';

import React from 'react';
import { Box, Card, CardContent, Typography, CardActions, Button, Grid } from "@mui/material";
import AdminLayout from "@/components/AdminLayout";
import iconMap from '@/lib/iconMap';

export default function AdminDashboard() {
    const pathArr = ["Faculty", "Dashboard"];
    const userRole = "Faculty";
    const PropIcon = iconMap["Proposal"];
    const SemIcon = iconMap["Event"];
    const ProjIcon = iconMap["Project"];
    const GradeIcon = iconMap["Grade"];
    const Enter = iconMap["Enter"];
    return (
        <AdminLayout pathArr={pathArr} userRole={userRole}>
            <Typography variant='h4' sx={{ mb: 3 }}>Dashboard</Typography>
            <Typography variant='h5'>Welcome Back!</Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item size={{ xs: 12, md: 6 }}>
                    <Card sx={{ bgcolor: 'background.paper', p: 1, pb: 2 }} >
                        <CardContent >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <PropIcon sx={{ fontSize: 25 }} />
                                <Typography variant='dashTitle'  >
                                    Project Proposals
                                </Typography>
                            </Box>
                            <Typography sx={{ color: "text.secondary", mb: 1, wordBreak: 'break-word', }}>
                                xxxxxxxxxxxxxxxxxxxxxxxx
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PropIcon sx={{ fontSize: 20 }} />
                                <Typography variant='body2'>
                                    xddddddd
                                </Typography>
                            </Box>
                        </CardContent>
                        <CardActions>
                            <Button variant="contained" size="medium" color='white' fullWidth >
                                View Proposals
                                <Enter sx={{ fontSize: 20, ml: 3 }} />
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                    <Card sx={{ bgcolor: 'background.paper', p: 1, pb: 2 }} >
                        <CardContent >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <ProjIcon sx={{ fontSize: 25 }} />
                                <Typography variant='dashTitle'  >
                                    Active Project
                                </Typography>
                            </Box>
                            <Typography sx={{ color: "text.secondary", mb: 1, wordBreak: 'break-word', }}>
                                xxxxxxxxxxxxxxxxxxxxxxxx
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ProjIcon sx={{ fontSize: 20 }} />
                                <Typography variant='body2'>
                                    xddddddd
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
            </Grid>
            <Grid container mt={2}>
                <Grid item size={{ xs: 12 }}>
                    <Card sx={{ bgcolor: 'background.paper', p: 1, pb: 2 }} >
                        <CardContent >

                            <Typography variant='dashTitle' sx={{ mb: 2 }}>
                                Quick Actions
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