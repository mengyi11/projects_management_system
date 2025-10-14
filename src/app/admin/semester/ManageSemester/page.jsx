'use client';
import React, { useState, useEffect } from "react";
import { Grid, Typography, IconButton, Paper, Dialog, DialogTitle, Divider, DialogActions, DialogContent, Select, TextField, FormControlLabel, Button, MenuItem } from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import AdminLayout from "@/components/AdminLayout";
import iconMap from '@/styles/iconMap';
import SearchBar from "@/components/SearchBar";
import ClickButton from "@/components/button/ClickButton";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "react-toastify";
import axios from 'axios';
import CDataGrid from "@/components/input/CDataGrid";
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CTextField from "@/components/input/CTextField";
import CButton from "@/components/input/CButton";
import { useForm, Controller } from "react-hook-form";
import SemesterForm from "@/components/forms/SemesterForm";
import CDatePicker from "@/components/input/CDateTimePicker";

export default function ManageSemester() {
    const currentPathArr = ['Admin', 'Semester', 'Manage Semester'];
    const [activeSemRows, setActiveSemRows] = useState([]);
    const [inactiveSemRows, setInactiveSemRows] = useState([]);
    const [rows, setRows] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateDialog, setIsCreateDialog] = useState(false);//dialog
    const [isEditDialog, setIsEditDialog] = useState(false);//dialog
    const [selectedSemester, setSelectedSemester] = useState(null);

    const EditIcon = iconMap["Edit"];
    const TimelineIcon = iconMap["Timeline"];
    const router = useRouter();
    const pathname = usePathname();
    const handleCreateFaculty = () => {
        // router.push(`${pathname}/CreateFaculty`);
    };

    useEffect(() => {
        loading()
    }, []);

    const loading = () => {
        getSemester()
        setIsLoading(false);
    };

    const {
        handleSubmit: handleSubmitEdit,
        control: controlEdit,
        reset: resetEdit,
    } = useForm({});

    const {
        handleSubmit: handleSubmitCreate,
        control: controlCreate,
        reset: resetCreate,
    } = useForm({});

    const columns = [
        { field: "academic_year", headerName: "Academic Year", flex: 1, minWidth: 100 },
        { field: "name", headerName: "Name", flex: 1, minWidth: 100 },
        { field: "status", headerName: "Status", flex: 1, minWidth: 100 },
        {
            field: "actions",
            headerName: "Actions",
            flex: 0.5,
            minWidth: 50,
            sortable: false,
            renderCell: (cellValues) => (
                <>
                    {/* <Button underline onClick={(event) => { handleEditClick(event, cellValues) }}>Edit</Button> */}
                    {/* <Button underline color="error" onClick={(event) => { handleDeleteClick(event, cellValues) }}>Delete</Button> */}
                    <IconButton aria-label="EditSem" onClick={(event) => { handleEditClick(event, cellValues) }} >
                        <EditIcon />
                    </IconButton>

                    <IconButton aria-label="EditTimeline" onClick={(event) => { handleTimeline(event, cellValues) }}>
                        <TimelineIcon />
                    </IconButton>
                </>
            ),
        },
    ];



    const getSemester = async () => {
        try {
            const getResponse = await axios.get('/api/admin/semesters/all');
            const semResponse = getResponse.data;
            console.log("semResponse");
            console.log(semResponse);
            if (semResponse.ok) {
                const activeSemData = semResponse.data[0]
                let activeRowsData = activeSemData.map((item, index) => ({
                    id: item.id,
                    academic_year: item.academic_year,
                    name: item.name,
                    status: item.active,
                }));
                console.log(activeRowsData)
                setActiveSemRows(activeRowsData);

                const inactiveSemData = semResponse.data[1]
                let inactiveRowsData = inactiveSemData.map((item, index) => ({
                    id: item.id,
                    academic_year: item.academic_year,
                    name: item.name,
                    status: item.active,
                }));
                console.log(activeRowsData)
                setInactiveSemRows(inactiveRowsData);
            }
        } catch (error) {
            const err = error.response?.data?.message ?? error.message;
            toast.error(err);
        }
    }


    //Create
    const handleOpen = () => {
        setSelectedSemester(null);
        setIsCreateDialog(true);
    };

    const handleCreateClose = () => {
        setIsCreateDialog(false);
        resetCreate();
    };

    const onCreateSubmit = async (data) => {
        console.log(data);
        setIsLoading(true)
        try {
            const courseResponse = await axios.post(
                "/api/admin/semesters/all",
                {
                    academicYear: data.academicYear,
                    semName: data.semName,
                    minCapacity: data.minCapacity,
                    maxCapacity: data.maxCapacity,
                    start_date: data.start_date
                }
            );
            console.log("courseResponse:", courseResponse)
            if (courseResponse.status === 201) {
                toast.success(`Create Successfully`);
                setIsCreateDialog(false);
            }
        } catch (error) {
            // alert("Failed to create semester")
            const err = error.response?.data?.message ?? error.message;
            toast.error(err);
        } finally {
            setIsLoading(false)
        }
    };

    //Timeline
    const handleTimeline = (event, cellValues) => {
        event.stopPropagation();
        console.log("Timeline for semester ID:", cellValues.row.id);
        // router.push(`/admin/semester/${cellValues.row.id}/manage-timeline`);
        router.push(`/admin/semester/ManageSemester/SemesterTimelines`);
    };

    //Edit
    const handleEditClick = async (event, cellValues) => {
        event.stopPropagation();
        console.log("cellValues.row:", cellValues.row)
        await getSemesterById(cellValues.row.id);
        // setIsEditDialog(false);
        // console.log("semValue:", semValue)
        setIsEditDialog(true);
    }

    // Get a single semester by ID
    const getSemesterById = async (id) => {
        try {
            setIsLoading(true);
            const response = await axios.get(`/api/admin/semesters/${id}`);

            console.log("Single semester detail response:", response);

            if (response.status === 200) {
                const semesterData = response.data.data; // Assume data is nested under response.data.data
                console.log("Fetched semester details:", semesterData);
                setSelectedSemester(semesterData);
                return semesterData; // Return the fetched semester data
            }
        } catch (error) {
            const err = error.response?.data?.message ?? error.message;
            toast.error(`Failed to fetch semester: ${err}`);
            return null; // Return null on failure
        } finally {
            setIsLoading(false); // End loading state regardless of success/failure
        }
    };

    const handleEditClose = async () => {
        setIsEditDialog(false);
        resetEdit();
    };

    const onEditSubmit = async (data) => {
        // console.log(data);
        // setIsLoading(true)
        // try {
        //     const courseResponse = await axios.post(
        //         "/api/admin/semesters/all",
        //         {
        //             // await req.json()
        //             academicYear: data.academicYear,
        //             semName: data.semName,
        //             minCapacity: data.minCapacity,
        //             maxCapacity: data.maxCapacity,
        //             start_date: data.start_date
        //         }
        //     );
        //     console.log("courseResponse:", courseResponse)
        //     if (courseResponse.status === 201) {
        //         toast.success(`Create Successfully`);
        //         setIsCreateDialog(false);
        //     }
        // } catch (error) {
        //     // alert("Failed to create semester")
        //     const err = error.response?.data?.message ?? error.message;
        //     toast.error(err);
        // } finally {
        //     setIsLoading(false)
        // }
        console.log("Edit data:", data);
        try {
            setIsLoading(true);
            // 发送PUT请求更新指定ID的学期信息
            const response = await axios.put(`/api/admin/semesters/${data.id}`, data);

            console.log("Semester update response:", response);

            if (response.status === 200) {
                const updatedData = response.data.data;
                console.log("Updated semester details:", updatedData);
                // 更新本地状态中的选中学期信息
                setSelectedSemester(updatedData);
                toast.success("Semester updated successfully");
                getSemester(); // 刷新学期列表
                setIsEditDialog(false);
            }
        } catch (error) {
            const err = error.response?.data?.message ?? error.message;
            toast.error(`Failed to update semester: ${err}`);
            return null;
        } finally {
            setIsLoading(false);
        };

    };

    return (
        <AdminLayout pathArr={currentPathArr}>


            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item size={{ xs: 12, md: 6 }} >
                    <Typography variant="h5">Semester Management </Typography>
                    <Typography variant="h6" sx={{ color: "text.secondary" }}>Configure Semester Settings and timelines</Typography>
                </Grid>
            </Grid>

            <Paper
                elevation={2}
                sx={{
                    padding: 5,
                    marginBottom: 5,
                    marginTop: 5,
                    width: "100%",
                    borderRadius: 3
                }}
            >
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item size={{ xs: 12, md: 6 }} >
                        <Grid container direction="column" spacing={2}>
                            <Grid item>
                                <Typography variant="h6">Semester Management</Typography>
                            </Grid>
                            <Grid item>
                                <Typography>Current Semester</Typography>
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid item size={{ xs: 12, md: 6 }}>
                        <Grid container justifyContent="flex-end">
                            <Grid item>
                                <ClickButton onClick={handleOpen} fullWidth >
                                    Create Semester
                                </ClickButton>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>

                <CDataGrid
                    rows={activeSemRows}
                    columns={columns}
                    showHeader
                    hideFooter
                />

                <Accordion sx={{ mt: 4, bgcolor: '#fafaff' }} >
                    <AccordionSummary expandIcon={<ArrowDropDownIcon />}>
                        <Typography variant="h6">Show History</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <CDataGrid
                            rows={inactiveSemRows}
                            columns={columns}
                            showHeader
                        />
                    </AccordionDetails>
                </Accordion>
            </Paper>
            {/* ---------------------------------------- */}
            < SemesterForm
                type="create"
                title="Create New Semester"
                onSubmit={onCreateSubmit}
                // data={selectedSemester}
                data={selectedSemester}
                open={isCreateDialog}
                onClose={handleCreateClose}
                handleSubmit={handleSubmitCreate}
                control={controlCreate}
                reset={resetCreate}
            />

            < SemesterForm
                type="edit"
                title="Edit Semester"
                onSubmit={onEditSubmit}
                data={selectedSemester}
                open={isEditDialog}
                onClose={handleEditClose}
                handleSubmit={handleSubmitEdit}
                control={controlEdit}
                reset={resetEdit}
            />
        </AdminLayout>
    );
}