'use client';
import React, { useState, useEffect } from "react";
import {
  Grid, Typography, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Button, MenuItem
} from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import AdminLayout from "@/components/AdminLayout";
import iconMap from '@/styles/iconMap';
import SearchBar from "@/components/SearchBar";
import ClickButton from "@/components/button/ClickButton";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "react-toastify";
import axios from 'axios';

export default function ManageStudents() {
  const currentPathArr = ['Admin', 'User', 'Manage Students'];
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    matriculationNumber: '', // 新增学号字段
    semesterId: '' // 新增学期ID字段
  });
  const [formErrors, setFormErrors] = useState({});
  const [semesters, setSemesters] = useState([]); // 存储学期列表
  const RemoveIcon = iconMap["Remove"];
  const router = useRouter();
  const pathname = usePathname();

  // 打开创建Dialog（同时加载学期列表）
  const handleCreateStudent = () => {
    setCreateDialogOpen(true);
    fetchSemesters(); // 加载学期数据
  };

  // 关闭创建Dialog（重置表单）
  const handleCloseDialog = () => {
    setCreateDialogOpen(false);
    setFormData({ name: '', email: '', matriculationNumber: '', semesterId: '' });
    setFormErrors({});
  };

  // 加载学期列表（用于下拉选择）
  const fetchSemesters = async () => {
    try {
      // 假设后端有获取学期列表的接口，根据实际接口调整
      const semestersRes = await axios.get("/api/admin/semesters/all");
      const allSemesters = semestersRes.data.data.flat(); // 适配二维数组结构
      setSemesters(allSemesters);
    } catch (error) {
      console.error('Failed to fetch semesters:', error);
      toast.error('Failed to load semesters');
    }
  };

  // 表单输入变化处理
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // 表单验证（新增学号和学期验证）
  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Invalid email format';
    }

    if (!formData.matriculationNumber.trim()) {
      errors.matriculationNumber = 'Matriculation number is required';
    } else if (formData.matriculationNumber.trim().length < 5) {
      errors.matriculationNumber = 'Matric number must be at least 5 characters';
    }

    if (!formData.semesterId) {
      errors.semesterId = 'Semester is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 提交创建学生表单（携带新增字段）
  const handleSubmitCreate = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const response = await axios.post('/api/admin/user/students', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        matriculation_number: formData.matriculationNumber.trim(), // 学号
        semester_id: formData.semesterId // 学期ID
      });

      if (response.data.ok) {
        toast.success('Student created successfully');
        handleCloseDialog();
        getStudents(); // 重新加载学生列表
      }
    } catch (error) {
      const err = error.response?.data?.message ?? error.message;
      toast.error(`Failed to create student: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getStudents();
    setIsLoading(false);
  }, []);

  const getStudents = async () => {
    try {
      const getResponse = await axios.get('/api/admin/user/students');
      const studentResponse = getResponse.data;
      console.log("studentData");
      console.log(studentResponse);
      if (studentResponse.ok) {
        const studentData = studentResponse.data
        let rowsData = studentData.map((item, index) => ({
          id: index + 1,
          name: item.name,
          email: item.email,
          role: item.role,
          matriculationNumber: item.matriculation_number || "N/A",
          semester: item.sem_name || "N/A" // 显示学期名称
        }));
        console.log(rowsData)
        setRows(rowsData);
      }
    } catch (error) {
      const err = error.response?.data?.message ?? error.message;
      toast.error(err);
    }
  }

  const columns = [
    { field: "id", headerName: "ID", flex: 0.5, minWidth: 50 },
    { field: "name", headerName: "Name", flex: 0.8, minWidth: 80 },
    { field: "email", headerName: "Email", flex: 1.5, minWidth: 150 },
    { field: "matriculationNumber", headerName: "Matric No.", flex: 0.8, minWidth: 100 },
    { field: "semester", headerName: "Semester", flex: 0.8, minWidth: 100 }, // 新增学期列
    { field: "role", headerName: "Role", flex: 0.8, minWidth: 80 },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.5,
      minWidth: 50,
      sortable: false,
      renderCell: (cellValues) => (
        <>
          <IconButton aria-label="delete" >
            <RemoveIcon color="error" />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <AdminLayout pathArr={currentPathArr}>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* 标题和搜索栏 */}
        <Grid item size={{ xs: 12, md: 6 }} >
          <Grid container direction="column" spacing={2}>
            <Grid item size={{ xs: 12 }}>
              <Typography variant="h5">Student List</Typography>
            </Grid>
            <Grid item size={{ xs: 12 }}>
              <SearchBar />
            </Grid>
          </Grid>
        </Grid>

        {/* 创建学生按钮 */}
        <Grid item size={{ xs: 12, md: 6 }}>
          <Grid container justifyContent="flex-end">
            <Grid item size={{ xs: 12, sm: 6, md: 'auto' }}>
              <ClickButton onClick={handleCreateStudent} fullWidth >
                Create Student
              </ClickButton>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* 学生表格 */}
      <Grid item size={{ xs: 12 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
          }}
          sx={{ width: '100%' }}
          pageSizeOptions={[5]}
          disableRowSelectionOnClick
          loading={isLoading}
        />
      </Grid>

      {/* 创建学生Dialog（新增学号和学期选择） */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: "1.1rem" }}>
          Create New Student
        </DialogTitle>
        <DialogContent sx={{ padding: 3 }}>
          <Grid container spacing={3}>
            <Grid item size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={!!formErrors.email}
                helperText={formErrors.email}
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Matriculation Number"
                name="matriculationNumber"
                value={formData.matriculationNumber}
                onChange={handleInputChange}
                error={!!formErrors.matriculationNumber}
                helperText={formErrors.matriculationNumber}
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Semester"
                name="semesterId"
                value={formData.semesterId}
                onChange={handleInputChange}
                error={!!formErrors.semesterId}
                helperText={formErrors.semesterId || "Select a semester"}
                variant="outlined"
                sx={{ mb: 2 }}
              >
                {/* 学期下拉选项 */}
                {semesters.length > 0 ? (
                  semesters.map((semester) => (
                    <MenuItem key={semester.id} value={semester.id}>
                      {semester.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="" disabled>
                    No semesters available
                  </MenuItem>
                )}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ padding: 2, justifyContent: "flex-end", gap: 1 }}>
          <Grid container spacing={2} size={{ xs: 12, sm: 'auto' }}>
            <Grid item size={{ xs: 6, sm: 'auto' }}>
              <Button
                onClick={handleCloseDialog}
                variant="outlined"
                fullWidth
                sx={{ minWidth: 100 }}
              >
                Cancel
              </Button>
            </Grid>
            <Grid item size={{ xs: 6, sm: 'auto' }}>
              <Button
                onClick={handleSubmitCreate}
                variant="contained"
                fullWidth
                sx={{ minWidth: 100, bgcolor: "#1A237E" }}
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create'}
              </Button>
            </Grid>
          </Grid>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}