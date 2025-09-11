'use client';

import React from 'react';
import { Box, Card, CardContent, Typography, CardActions, Button, Grid } from "@mui/material";
import AdminLayout from "@/components/AdminLayout";
import iconMap from '@/lib/iconMap';

export default function AdminDashboard() {
    const pathArr = ["Admin", "Dashboard"];
    const userRole = "admin";
    const UserIcon = iconMap["Person"];
    const SemIcon = iconMap["Event"];
    const ProjIcon = iconMap["Work"];
    const GradeIcon = iconMap["Grade"];
    const Enter = iconMap["Enter"];
    return (
        <AdminLayout pathArr={pathArr} userRole={userRole}>
            <Typography variant='h4'>Dashboard</Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item size={{ xs: 12, md: 6, lg: 4 }}>
                    <Card sx={{ bgcolor: 'background.paper', p: 1, pb: 2 }} >
                        <CardContent >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <UserIcon sx={{ fontSize: 25 }} />
                                <Typography variant='dashTitle'  >
                                    User Management
                                </Typography>
                            </Box>
                            <Typography sx={{ color: "text.secondary", mb: 1, wordBreak: 'break-word', }}>
                                xxxxxxxxxxxxxxxxxxxxxxxx
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <UserIcon sx={{ fontSize: 20 }} />
                                <Typography variant='body2'>
                                    xddddddd
                                </Typography>
                            </Box>
                        </CardContent>
                        <CardActions>
                            <Button variant="contained" size="medium" color='white' fullWidth >
                                Manage User
                                <Enter sx={{ fontSize: 20, ml: 3 }} />
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
                <Grid item size={{ xs: 12, md: 6, lg: 4 }}>
                    <Card sx={{ bgcolor: 'background.paper', p: 1, pb: 2 }} >
                        <CardContent >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <SemIcon sx={{ fontSize: 25 }} />
                                <Typography variant='dashTitle'  >
                                    Semester Management
                                </Typography>
                            </Box>
                            <Typography sx={{ color: "text.secondary", mb: 1, wordBreak: 'break-word', }}>
                                xxxxxxxxxxxxxxxxxxxxxxxx
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <UserIcon sx={{ fontSize: 20 }} />
                                <Typography variant='body2'>
                                    xddddddd
                                </Typography>
                            </Box>
                        </CardContent>
                        <CardActions>
                            <Button variant="contained" size="medium" color='white' fullWidth >
                                Manage Semester
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
                                    Project Management
                                </Typography>
                            </Box>
                            <Typography sx={{ color: "text.secondary", mb: 1, wordBreak: 'break-word', }}>
                                xxxxxxxxxxxxxxxxxxxxxxxx
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <UserIcon sx={{ fontSize: 20 }} />
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
                                        <UserIcon sx={{ fontSize: 20, mr: 2 }} />
                                        Manage Faculty
                                    </Button>
                                </Grid>
                                <Grid item size={{ xs: 12, md: 6 }}>
                                    <Button variant="contained" size="medium" color='white' sx={{ display: 'flex', justifyContent: 'flex-start' }} fullWidth >
                                        <UserIcon sx={{ fontSize: 20, mr: 2 }} />
                                        Manage Students
                                    </Button>
                                </Grid>
                                <Grid item size={{ xs: 12, md: 6 }}>
                                    <Button variant="contained" size="medium" color='white' sx={{ display: 'flex', justifyContent: 'flex-start' }} fullWidth >
                                        <ProjIcon sx={{ fontSize: 20, mr: 2 }} />
                                        Project Allocation
                                    </Button>
                                </Grid>
                                <Grid item size={{ xs: 12, md: 6 }}>
                                    <Button variant="contained" size="medium" color='white' sx={{ display: 'flex', justifyContent: 'flex-start' }} fullWidth >
                                        <GradeIcon sx={{ fontSize: 20, mr: 2 }} />
                                        Grade Analytics
                                    </Button>
                                </Grid>
                            </Grid>

                        </CardActions>
                    </Card>
                </Grid>
            </Grid>
            <Grid container mt={2}>
                <Grid item size={{ xs: 12 }}>
                    <Card sx={{ bgcolor: 'background.paper', p: 1, pb: 2 }} >
                        <CardContent >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <SemIcon sx={{ fontSize: 25 }} />
                                <Typography variant='dashTitle'  >
                                    Current Semester Status
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </AdminLayout>
    );
}