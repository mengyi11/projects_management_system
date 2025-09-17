'use client';

import React, { useState, useEffect } from "react";
import { Paper, Grid, Typography, FormControlLabel, Switch, Box, Tab } from "@mui/material";
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { toast } from "react-toastify";
import { useForm, Controller } from "react-hook-form";
import axios from 'axios';
import AdminLayout from "@/components/AdminLayout";
import CTextField from "@/components/input/CTextField";
import ClickLoadingButton from "@/components/button/ClickLoadingButton";

export default function CreateFaculty() {
    const currentPathArr = ['Admin', 'User', 'Manage Faculty', 'Create Faculty'];
    const [rows, setRows] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tab, setTab] = useState('single');

    const handleChange = (event, val) => {
        setTab(val);
    };
    const { handleSubmit, control } = useForm({
        defaultValues: {
            email: "",
            name: "",
            courseCoordinator: false,
        },
    });
    const onSubmit = async (data) => {
        setIsSubmitting(true);
        console.log("Form Data:", data);
        try {
            const createResponse = await axios.post('/api/admin/user/faculty', {
                email: data.email,
                name: data.name,
                courseCoordinator: data.courseCoordinator,
            });

            const result = createResponse.data;

            if (result.ok) {
                toast.success("Faculty created successfully");
                setTimeout(() => {
                    window.location.reload();
                }, 900);
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AdminLayout pathArr={currentPathArr}>
            <Typography variant='h4'>Faculty Management</Typography>
            <Typography sx={{ color: "text.secondary", my: 1, wordBreak: 'break-word', }}>
                Manage Faculty Accounts and Permissions
            </Typography>
            <Box sx={{ width: '100%', typography: 'body1', mt: 4 }}>
                <TabContext value={tab}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <TabList onChange={handleChange} textColor="secondary" indicatorColor="secondary" >
                            <Tab value="single"
                                sx={{ pr: 5 }}
                                label={
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                                        Single Insert
                                    </div>
                                } />
                            <Tab value="bulk"
                                sx={{ pr: 5 }}
                                label={
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                                        Bulk Insert
                                    </div>
                                } />
                        </TabList>
                    </Box>


                    <TabPanel value="single">
                        <Typography variant="h4" sx={{ mt: 4 }}>
                            Add Faculty User
                        </Typography>
                        <Paper sx={{ p: 6, maxWidth: '75rem', mx: "auto", mt: 4, borderRadius: 1 }}>

                            {/* Email */}
                            <Grid container columnSpacing={2} alignItems="start" sx={{ mt: 2 }}>
                                <Grid item size={{ xs: 12, md: 4 }}>
                                    <Typography>Email(@e.ntu.edu.sg):</Typography>
                                </Grid>
                                <Grid item size={{ xs: 12, md: 8 }}>
                                    <CTextField
                                        fullWidth
                                        id="email"
                                        name="email"
                                        label="user@e.ntu.edu.sg"
                                        control={control}
                                        rules={{
                                            required: "NTU Email is required",
                                            pattern: {
                                                value: /^[a-zA-Z0-9]+@e\.ntu\.edu\.sg$/,
                                                message: "Invalid NTU email.",
                                            },
                                        }}

                                    />
                                </Grid>
                            </Grid>

                            {/* Name */}
                            <Grid container columnSpacing={2} alignItems="start" sx={{ mt: 5 }}>
                                <Grid item size={{ xs: 12, md: 4 }}>
                                    <Typography>Full Name:</Typography>
                                </Grid>
                                <Grid item size={{ xs: 12, md: 8 }}>
                                    <CTextField
                                        fullWidth
                                        id="name"
                                        name="name"
                                        label="username"
                                        control={control}
                                        rules={{
                                            required: "Full Name is required",
                                            pattern: {
                                                value: /^[A-Za-z]+( [A-Za-z]+)*$/,
                                                message: "Name can only contain letters and spaces",
                                            },
                                        }}

                                    />
                                </Grid>
                            </Grid>

                            {/* Switch */}
                            <Grid container columnSpacing={2} alignItems="center" sx={{ my: 5 }}>
                                <Grid item size={{ xs: 12 }}>
                                    <Controller
                                        name="courseCoordinator"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControlLabel
                                                control={<Switch {...field} checked={field.value} />}
                                                label="Course Coordinator"
                                            />
                                        )}
                                    />
                                </Grid>
                            </Grid>
                            <ClickLoadingButton isSubmitting={isSubmitting} fullWidth onClick={handleSubmit(onSubmit)} text="Create Faculty" />
                        </Paper>
                    </TabPanel>
                    <TabPanel value="bulk">
                        Item Two
                    </TabPanel>
                </TabContext>
            </Box>

        </AdminLayout>
    );
}