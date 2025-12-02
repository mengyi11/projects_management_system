'use client';
import React, { useState, useEffect } from "react";
import { Grid, Typography, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Button, FormControl, InputLabel, Select } from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import AdminLayout from "@/components/AdminLayout";
import iconMap from '@/styles/iconMap';
import SearchBar from "@/components/SearchBar";
import ClickButton from "@/components/button/ClickButton";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "react-toastify";
import axios from 'axios';

export default function ManageVenue() {
    // 页面路径配置
    const currentPathArr = ['Admin', 'Resources', 'Manage Venue'];
    const router = useRouter();
    const pathname = usePathname();

    // 状态管理
    const [rows, setRows] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [semesters, setSemesters] = useState([]); // 最终存储一维数组
    const [selectedSemester, setSelectedSemester] = useState(undefined);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [currentVenue, setCurrentVenue] = useState(null);
    const [venueForm, setVenueForm] = useState({
        name: '',
        location: '',
        capacity: '',
        semester_id: ''
    });

    // 图标引用
    const EditIcon = iconMap["Edit"];
    const RemoveIcon = iconMap["Remove"];

    // 初始化加载数据
    useEffect(() => {
        fetchSemesters();
    }, []);

    // 选中学期变化时加载场地
    useEffect(() => {
        if (selectedSemester) {
            fetchVenues();
        }
    }, [selectedSemester]);

    // 获取学期列表：核心修改——合并二维数组为一维
    const fetchSemesters = async () => {
        try {
            const response = await axios.get('/api/admin/semesters/all');
            if (response.data.ok) {
                console.log('原始 sem 数据:', response.data.data); // 打印原始二维数组
                // 关键步骤：扁平化二维数组（合并所有子数组）
                const flattenedSemesters = response.data.data.flat(); 
                console.log('合并后 sem 数据:', flattenedSemesters); // 打印合并后的一维数组
                setSemesters(flattenedSemesters);

                // 默认选中第一个有效学期（合并后数组的第一个元素）
                if (flattenedSemesters.length > 0) {
                    const firstSemesterId = flattenedSemesters[0].id;
                    setSelectedSemester(firstSemesterId);
                    setVenueForm(prev => ({ ...prev, semester_id: firstSemesterId }));
                }
            }
        } catch (error) {
            toast.error('Failed to load semesters');
            console.error(error);
        }
    };

    // 获取场地列表
    const fetchVenues = async () => {
        if (!selectedSemester) return;

        try {
            setIsLoading(true);
            const response = await axios.get(`/api/admin/venues?semester_id=${selectedSemester}`);
            if (response.data.ok) {
                console.log(response.data)
                const formattedData = response.data.data.map((venue,index) => ({
                    id: venue.id,
                    name: venue.name,
                    location: venue.location,
                    capacity: venue.capacity,
                    semester: venue.semester_name,
                    semester_id: venue.semester_id,
                    active: venue.semester_active
                }));
                console.log(formattedData)
                setRows(formattedData);
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to load venues';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // 表单输入处理
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setVenueForm(prev => ({ ...prev, [name]: value }));
        if (name === 'semester_id') {
            setSelectedSemester(value);
        }
    };

    // 打开添加场地对话框
    const handleAddVenue = () => {
        if (!selectedSemester) {
            return toast.warning('Please select a semester first');
        }
        setVenueForm({
            name: '',
            location: '',
            capacity: '',
            semester_id: selectedSemester
        });
        setDialogOpen(true);
    };

    // 保存新场地
    const handleSaveVenue = async () => {
        if (!venueForm.name.trim() || !venueForm.location.trim() || !venueForm.capacity || !venueForm.semester_id) {
            return toast.warning('Please fill all required fields (name, location, capacity)');
        }
        const capacity = Number(venueForm.capacity);
        if (isNaN(capacity) || capacity <= 0) {
            return toast.warning('Capacity must be a positive number');
        }

        try {
            const response = await axios.post('/api/admin/venues', {
                ...venueForm,
                capacity: capacity
            });
            if (response.data.ok) {
                toast.success('Venue created successfully');
                setDialogOpen(false);
                fetchVenues();
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to create venue';
            toast.error(msg);
        }
    };

    // 打开编辑对话框
    const handleEditClick = (venue) => {
        setCurrentVenue(venue);
        setVenueForm({
            name: venue.name || '',
            location: venue.location || '',
            capacity: venue.capacity ? venue.capacity.toString() : '',
            semester_id: venue.semester_id || selectedSemester
        });
        setEditDialogOpen(true);
    };

    // 保存编辑
    const handleUpdateVenue = async () => {
        if (!currentVenue) return;
        if (!venueForm.name.trim() || !venueForm.location.trim() || !venueForm.capacity || !venueForm.semester_id) {
            return toast.warning('Please fill all required fields (name, location, capacity)');
        }
        const capacity = Number(venueForm.capacity);
        if (isNaN(capacity) || capacity <= 0) {
            return toast.warning('Capacity must be a positive number');
        }

        
        try {
            const response = await axios.put(`/api/admin/venues`, {
                ...venueForm,
                venueId: currentVenue.id,
                capacity: capacity
            });
            if (response.data.ok) {
                toast.success('Venue updated successfully');
                setEditDialogOpen(false);
                fetchVenues();
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to update venue';
            toast.error(msg);
        }
    };

    // 删除场地
    const handleDeleteClick = async (id) => {
        if (!window.confirm('Are you sure you want to delete this venue?')) return;

        try {
            const response = await axios.delete(`/api/admin/venues`, {
                params: { venue_id: id }
            });
            if (response.data.ok) {
                toast.success('Venue deleted successfully');
                fetchVenues();
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to delete venue';
            toast.error(msg);
        }
    };

    // 表格列配置
    const columns = [
        { field: "id", headerName: "ID", flex: 0.5, minWidth: 50 },
        { field: "name", headerName: "Venue Name", flex: 1, minWidth: 120 },
        { field: "location", headerName: "Location", flex: 1, minWidth: 150 },
        { field: "capacity", headerName: "Capacity", flex: 0.7, minWidth: 80 },
        { field: "semester", headerName: "Semester", flex: 1, minWidth: 120 },
        { field: "active", headerName: "Status", flex: 0.7, minWidth: 100 },
        {
            field: "actions",
            headerName: "Actions",
            flex: 0.8,
            minWidth: 120,
            sortable: false,
            renderCell: (params) => (
                <>
                    <IconButton aria-label="edit" onClick={() => handleEditClick(params.row)}>
                        <EditIcon color="primary" />
                    </IconButton>
                    <IconButton aria-label="delete" onClick={() => handleDeleteClick(params.row.id)}>
                        <RemoveIcon color="error" />
                    </IconButton>
                </>
            ),
        },
    ];

    return (
        <AdminLayout pathArr={currentPathArr}>
            {/* 页面标题和操作区 */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item size={{ xs: 12, sm: 12, md: 12 }}>
                    <Typography variant="h5">Venue Management</Typography>
                </Grid>

                {/* 搜索和学期筛选 */}
                <Grid item size={{ xs: 12, sm: 12, md: 6 }}>
                    <Grid container spacing={2}>
                        <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                            <SearchBar placeholder="Search venues by name or location..." />
                        </Grid>
                        <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                            <FormControl fullWidth required variant="outlined" size="small">
                                <InputLabel>Semester</InputLabel>
                                <Select
                                    value={selectedSemester || ''}
                                    onChange={(e) => setSelectedSemester(e.target.value)}
                                    label="Semester"
                                    disabled={semesters.length === 0}
                                >
                                    
                                    {/* {selectedSemester === '' && semesters.length > 0 && ( */}
                                        {/* <MenuItem value="" disabled>Select Semester</MenuItem> */}
                                    {/* )} */}
                                    {/* 直接渲染合并后的一维数组 */}
                                    {semesters.map(sem => (
                                        <MenuItem key={sem.id} value={sem.id}>
                                            {sem.name} {sem.active === 'active' ? '(Active)' : ''}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Grid>

                {/* 操作按钮区 */}
                <Grid item size={{ xs: 12, sm: 12, md: 6 }}>
                    <Grid container justifyContent="flex-end">
                        <Grid item >
                            <ClickButton onClick={handleAddVenue} fullWidth disabled={!selectedSemester}>
                                Add Single Venue
                            </ClickButton>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            {/* 场地列表表格 */}
            <Grid item size={{ xs: 12, sm: 12, md: 12 }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: 10 }
                        }
                    }}
                    loading={isLoading}
                    sx={{ width: '100%' }}
                    pageSizeOptions={[5, 10, 20]}
                    disableRowSelectionOnClick
                />
            </Grid>

            {/* 添加场地对话框 */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add New Venue</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item size={{ xs: 12, sm: 12, md: 12 }}>
                            <TextField
                                fullWidth
                                label="Venue Name"
                                name="name"
                                value={venueForm.name}
                                onChange={handleInputChange}
                                required
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid item size={{ xs: 12, sm: 12, md: 12 }}>
                            <TextField
                                fullWidth
                                label="Location"
                                name="location"
                                value={venueForm.location}
                                onChange={handleInputChange}
                                required
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid item size={{ xs: 12, sm: 12, md: 12 }}>
                            <TextField
                                fullWidth
                                label="Capacity"
                                name="capacity"
                                type="number"
                                min="1"
                                value={venueForm.capacity}
                                onChange={handleInputChange}
                                required
                                variant="outlined"
                                size="small"
                                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                            />
                        </Grid>
                        <Grid item size={{ xs: 12, sm: 12, md: 12 }}>
                            <FormControl fullWidth required variant="outlined" size="small" sx={{ mt: 1 }}>
                                <InputLabel>Semester</InputLabel>
                                <Select
                                    name="semester_id"
                                    value={venueForm.semester_id}
                                    onChange={handleInputChange}
                                    label="Semester"
                                >
                                    {semesters.map(sem => (
                                        <MenuItem key={sem.id} value={sem.id}>
                                            {sem.name} {sem.active === 'active' ? '(Active)' : ''}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveVenue} color="primary">Create Venue</Button>
                </DialogActions>
            </Dialog>

            {/* 编辑场地对话框 */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Venue</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item size={{ xs: 12, sm: 12, md: 12 }}>
                            <TextField
                                fullWidth
                                label="Venue Name"
                                name="name"
                                value={venueForm.name}
                                onChange={handleInputChange}
                                required
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid item size={{ xs: 12, sm: 12, md: 12 }}>
                            <TextField
                                fullWidth
                                label="Location"
                                name="location"
                                value={venueForm.location}
                                onChange={handleInputChange}
                                required
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid item size={{ xs: 12, sm: 12, md: 12 }}>
                            <TextField
                                fullWidth
                                label="Capacity"
                                name="capacity"
                                type="number"
                                min="1"
                                value={venueForm.capacity}
                                onChange={handleInputChange}
                                required
                                variant="outlined"
                                size="small"
                                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                            />
                        </Grid>
                        <Grid item size={{ xs: 12, sm: 12, md: 12 }}>
                            <FormControl fullWidth required variant="outlined" size="small" sx={{ mt: 1 }}>
                                <InputLabel>Semester</InputLabel>
                                <Select
                                    name="semester_id"
                                    value={venueForm.semester_id}
                                    onChange={handleInputChange}
                                    label="Semester"
                                >
                                    {semesters.map(sem => (
                                        <MenuItem key={sem.id} value={sem.id}>
                                            {sem.name} {sem.active === 'active' ? '(Active)' : ''}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleUpdateVenue} color="primary">Save Changes</Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
}