'use client';
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Tabs, Tab, Paper,
    IconButton, Dialog, DialogTitle, DialogContent,
    DialogActions, Button, Grid, Alert, Checkbox,
    List, ListItem, ListItemText, ListItemIcon,
    Snackbar, Alert as MuiAlert, Chip, CircularProgress
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
    Info, Save, ArrowUpward, ArrowDownward,
    DragHandle as MuiDragHandle, Close
} from '@mui/icons-material';
import {
    DragDropContext,
    Droppable,
    Draggable
} from '@hello-pangea/dnd';
import StudentLayout from '@/components/StudentLayout';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from 'axios';

// 拖拽排序辅助函数
const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
};

export default function RegistrationPlanner() {
    const currentPathArr = ['Student', 'Registration Planner'];
    const [activeTab, setActiveTab] = useState(0);
    const [allProjects, setAllProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    // 核心状态：选中的项目ID（Set） + 排序后的项目列表（Array）
    const [selectedPlanIds, setSelectedPlanIds] = useState(new Set());
    const [sortedPlannedProjects, setSortedPlannedProjects] = useState([]);
    // 提示状态
    const [saveSnackbar, setSaveSnackbar] = useState({ open: false, message: '', type: '' });
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    // 保存加载状态
    const [isSaving, setIsSaving] = useState(false);

    const router = useRouter();

    // Tab切换方法
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        // 切换到Planned Tab时更新排序列表
        if (newValue === 1) {
            updateSortedPlannedProjects();
        }
    };

    // 获取用户信息（完整用户数据，用于提交后端）
    const getUserInfo = () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return null;
            const userData = JSON.parse(userStr);
            // 返回完整用户信息（根据实际存储结构调整）
            return {
                id: userData.id || userData.userId,
                name: userData.name || userData.username,
                email: userData.email,
                studentId: userData.studentId || userData.id,
                programme: userData.programme || userData.studyProgramme // 用户所属专业
            };
        } catch (error) {
            console.error('Failed to get user info:', error);
            return null;
        }
    };

    // 格式化项目数据
    const formatProjectData = (data) => {
        return data.map(item => ({
            id: item.id,
            title: item.proposal_title,
            description: item.proposal_desc,
            status: item.proposal_status,
            created: item.proposal_created,
            updated: item.proposal_updated,
            supervisor_name: item.professor_name,
            supervisor_email: item.professor_email,
            semester_name: item.semester_name,
            semester_active: item.semester_active,
            semester_max_cap: item.semester_max_cap,
            venue_name: item.venue_name,
            venue_location: item.venue_location,
            venue_capacity: item.venue_capacity,
            programme: item.programme_name,
            programme_code: item.programme_code,
            current_registrations: item.current_registrations || 0,
            capacity: item.proposal_capacity
        }));
    };

    // 恢复已保存的规划
    const restoreSavedPlans = async (studentId) => {
        try {
            // 调用后端接口获取已保存的规划
            const res = await axios.get(`/api/student/plans?studentId=${studentId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                }
            });

            if (res.data.ok && res.data.data.length > 0) {
                const savedPlans = res.data.data;
                // 1. 恢复选中的项目ID集合
                const savedProjectIds = new Set(savedPlans.map(plan => plan.projectId));
                setSelectedPlanIds(savedProjectIds);

                // 2. 按优先级恢复排序后的项目列表
                const sortedByPriority = savedPlans
                    .sort((a, b) => a.priority - b.priority) // 按优先级升序
                    .map(plan => allProjects.find(project => project.id === plan.projectId))
                    .filter(Boolean); // 过滤已删除的项目

                setSortedPlannedProjects(sortedByPriority);
                setHasUnsavedChanges(false); // 已保存状态

                showSnackbar(`Restored ${savedPlans.length} saved projects!`, 'success');
            }
        } catch (error) {
            console.error('Failed to restore saved plans:', error);
            showSnackbar('Failed to load saved projects', 'warning');
        }
    };

    // 加载所有项目数据 + 恢复已保存的规划
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const user = getUserInfo();
                if (!user) {
                    toast.warning("Please log in first");
                    router.push("/");
                    return;
                }
                setCurrentUser(user);

                // 1. 获取所有公开项目
                const projectsRes = await axios.get('/api/student/projects', {
                    params: { user: user },
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                    }
                });
                const formattedAllProjects = formatProjectData(projectsRes.data.data);
                setAllProjects(formattedAllProjects);

                // 2. 恢复已保存的规划（必须等项目数据加载完成后执行）
                await restoreSavedPlans(user.id);

            } catch (error) {
                const errMsg = error.response?.data?.error?.message || 'Failed to load data';
                toast.error(errMsg);
                if (error.response?.status === 401) {
                    router.push('/login');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [router]);

    // 当选中的项目ID变化时，更新排序列表
    useEffect(() => {
        updateSortedPlannedProjects();
        // 只有非初始化的变化才标记为未保存
        if (isLoading === false) {
            setHasUnsavedChanges(true);
        }
    }, [selectedPlanIds, allProjects]);

    // 更新排序后的Planned项目列表
    const updateSortedPlannedProjects = () => {
        const selectedProjects = allProjects.filter(project => selectedPlanIds.has(project.id));
        // 如果已有排序列表且项目未变，保留原有顺序
        if (sortedPlannedProjects.length > 0 &&
            sortedPlannedProjects.every(p => selectedPlanIds.has(p.id)) &&
            selectedProjects.length === sortedPlannedProjects.length) {
            return;
        }
        setSortedPlannedProjects(selectedProjects);
    };

    // 打开项目详情Dialog
    const handleViewDetail = (project) => {
        setSelectedProject(project);
        setDetailDialogOpen(true);
    };

    // Checkbox勾选/取消逻辑
    const handleCheckboxChange = (projectId) => {
        // 校验最多选5个
        if (!selectedPlanIds.has(projectId) && selectedPlanIds.size >= 5) {
            showSnackbar('Cannot select more than 5 projects!', 'error');
            return;
        }

        // 更新选中状态
        setSelectedPlanIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(projectId)) {
                newSet.delete(projectId); // 取消勾选
            } else {
                newSet.add(projectId); // 勾选
            }
            return newSet;
        });
    };

    // 拖拽排序处理（hello-pangea/dnd 兼容版）
    const onDragEnd = (result) => {
        // 拖拽未完成或无变化
        if (!result.destination || result.source.index === result.destination.index) {
            return;
        }

        // 重新排序
        const reorderedProjects = reorder(
            sortedPlannedProjects,
            result.source.index,
            result.destination.index
        );
        setSortedPlannedProjects(reorderedProjects);
        setHasUnsavedChanges(true);
        showSnackbar('Priority updated! Remember to save your changes.', 'warning');
    };

    // 单个项目上下移动
    const moveProject = (index, direction) => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === sortedPlannedProjects.length - 1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        const reordered = reorder(sortedPlannedProjects, index, newIndex);
        setSortedPlannedProjects(reordered);
        setHasUnsavedChanges(true);
        showSnackbar('Priority updated! Remember to save your changes.', 'warning');
    };

    // 核心：保存按钮点击逻辑（对接后端）
    const handleSave = async () => {
        try {
            // 1. 加载状态
            setIsSaving(true);

            // 2. 校验必要数据
            if (!currentUser) {
                showSnackbar('User information not found. Please log in again.', 'error');
                setIsSaving(false);
                return;
            }

            if (sortedPlannedProjects.length === 0) {
                showSnackbar('No projects selected to save.', 'warning');
                setIsSaving(false);
                return;
            }

            // 3. 格式化提交数据
            const saveData = {
                // 用户信息
                user: {
                    id: currentUser.id,
                    name: currentUser.name,
                    email: currentUser.email,
                    studentId: currentUser.studentId,
                    programme: currentUser.programme // 用户所属专业
                },
                // 选中的项目及优先级（按排序后的顺序）
                selectedProjects: sortedPlannedProjects.map((project, index) => ({
                    projectId: project.id,
                    title: project.title,
                    supervisorName: project.supervisor_name,
                    programme: project.programme, // 项目所属专业
                    priority: index + 1 // 优先级（1=最高）
                })),
                // 元数据
                totalSelected: sortedPlannedProjects.length,
                timestamp: new Date().toISOString()
            };

            // 4. 发送到后端（替换为实际接口地址）
            const response = await axios.post('/api/student/projects', saveData, {
                headers: {
                    'Content-Type': 'application/json',
                    // 如果需要认证，添加token
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                }
            });

            // 5. 处理成功响应
            if (response.status === 200 || response.status === 201) {
                setHasUnsavedChanges(false);
                showSnackbar('Selection and priority saved successfully!', 'success');
            }

        } catch (error) {
            // 6. 处理错误
            console.error('Failed to save selection:', error);
            const errorMsg = error.response?.data?.error?.message ||
                error.response?.data?.message ||
                'Failed to save your selection. Please try again later.';
            showSnackbar(errorMsg, 'error');

        } finally {
            // 7. 结束加载状态
            setIsSaving(false);
        }
    };

    // 显示提示弹窗
    const showSnackbar = (message, type = 'info') => {
        setSaveSnackbar({
            open: true,
            message: message,
            type: type
        });
    };

    // 关闭提示弹窗
    const handleSnackbarClose = () => {
        setSaveSnackbar({ ...saveSnackbar, open: false });
    };

    // 所有项目表格列
    const allProjectsColumns = [
        { field: 'id', headerName: 'ID', flex: 0.3, minWidth: 50 },
        { field: 'title', headerName: 'Title', flex: 1.5, minWidth: 150 },
        { field: 'supervisor_name', headerName: 'Supervisor', flex: 1, minWidth: 120 },
        { field: 'programme', headerName: 'Programme', flex: 1, minWidth: 120 },
        {
            field: 'select',
            headerName: 'Select',
            flex: 0.4,
            minWidth: 80,
            sortable: false,
            renderCell: (params) => (
                <Checkbox
                    checked={selectedPlanIds.has(params.row.id)}
                    onChange={() => handleCheckboxChange(params.row.id)}
                    disabled={!selectedPlanIds.has(params.row.id) && selectedPlanIds.size >= 5}
                    color="primary"
                />
            )
        },
        {
            field: 'actions',
            headerName: 'View',
            flex: 0.4,
            minWidth: 80,
            sortable: false,
            renderCell: (params) => (
                <IconButton
                    onClick={() => handleViewDetail(params.row)}
                    color="primary"
                    size="small"
                >
                    <Info />
                </IconButton>
            )
        }
    ];

    // 行样式：保留最开始的选中行视觉区分（浅蓝色背景+蓝色左边框）
    const getRowStyle = (params) => {
        if (selectedPlanIds.has(params.row.id)) {
            return {
                backgroundColor: '#f0f8ff',
                borderLeft: '3px solid #1976d2',
                '&:hover': {
                    backgroundColor: '#e8f4f8',
                }
            };
        }
        return {};
    };

    // 当前Tab数据/列
    const getCurrentTabData = () => {
        return activeTab === 0 ? allProjects : [];
    };

    const getCurrentTabColumns = () => {
        return activeTab === 0 ? allProjectsColumns : [];
    };

    return (
        <StudentLayout pathArr={currentPathArr}>
            <Box sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ mb: 3 }}>
                    Registration Planner
                </Typography>

                {/* 全局提示：未保存数据会丢失 */}
                <Alert
                    severity={hasUnsavedChanges ? "warning" : "info"}
                    sx={{ mb: 2 }}
                >
                    {hasUnsavedChanges
                        ? "⚠️ Unsaved changes! Data will be lost on page refresh. Save your selection in the Planned tab."
                        : "ℹ️ Your selection has been saved to the server."}
                </Alert>

                {/* 标签页：All Projects + Planned */}
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    sx={{ mb: 3 }}
                    variant="fullWidth"
                >
                    <Tab label={`All Projects (${allProjects.length})`} />
                    <Tab label={`Planned (${selectedPlanIds.size}/5)`} disabled={selectedPlanIds.size === 0} />
                </Tabs>

                {/* All Projects Tab内容 */}
                {activeTab === 0 && (
                    <>
                        {/* 保留：已选项目列表展示 + 快速取消 */}
                        {selectedPlanIds.size > 0 && (
                            <Box sx={{ mt: 0, mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#ffffffff' }}>
                                <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                                    Selected Projects ({selectedPlanIds.size}/5):
                                </Typography>
                                <Grid container spacing={1}>
                                    {Array.from(selectedPlanIds).map(id => {
                                        const project = allProjects.find(p => p.id === id);
                                        return project ? (
                                            <Grid item xs={12} sm={6} md={4} key={id}>
                                                <Chip
                                                    label={project.title}
                                                    onDelete={() => handleCheckboxChange(id)}
                                                    variant="outlined"
                                                    color="orange"
                                                    sx={{
                                                        py: 1,
                                                        width: '100%',
                                                        justifyContent: 'space-between'
                                                    }}
                                                    deleteIcon={<Close fontSize="small" />}
                                                />
                                            </Grid>
                                        ) : null;
                                    })}
                                </Grid>
                            </Box>
                        )}

                        <Paper sx={{ p: 2, height: 500 }}>
                            {isLoading ? (
                                <Typography variant="body1" sx={{ textAlign: 'center', py: 5 }}>
                                    Loading data...
                                </Typography>
                            ) : (
                                <DataGrid
                                    rows={getCurrentTabData()}
                                    columns={getCurrentTabColumns()}
                                    rowKey="id"
                                    initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                                    pageSizeOptions={[5, 10, 20]}
                                    disableRowSelectionOnClick
                                    sx={{ height: 450 }}
                                    getRowStyle={getRowStyle} // 保留选中行视觉样式
                                    disableColumnFilter
                                />
                            )}
                        </Paper>
                    </>
                )}

                {/* Planned Tab内容：拖拽排序 + 保存（美化版） */}
                {activeTab === 1 && selectedPlanIds.size > 0 && (
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                        padding: '0 0 16px 0'
                    }}>
                        {/* 操作按钮区 - 美化升级 */}
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 16px',
                            backgroundColor: 'rgba(25, 118, 210, 0.04)',
                            borderRadius: 1.5,
                            border: '1px solid rgba(25, 118, 210, 0.12)'
                        }}>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    fontWeight: 500,
                                    color: 'text.primary',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}
                            >
                                <MuiDragHandle color="primary" fontSize="small" />
                                Drag to reorder priority (1 = highest)
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                                onClick={handleSave}
                                disabled={!hasUnsavedChanges || isSaving}
                                sx={{
                                    borderRadius: 1,
                                    textTransform: 'none',
                                    padding: '8px 20px',
                                    boxShadow: hasUnsavedChanges && !isSaving ? 2 : 1,
                                    '&:disabled': {
                                        backgroundColor: 'grey.400',
                                        boxShadow: 'none'
                                    },
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {isSaving ? 'Saving...' : 'Save Selection & Priority'}
                            </Button>
                        </Box>

                        {/* 拖拽排序区域 - 视觉全面升级 */}
                        <Paper sx={{
                            p: 3,
                            minHeight: 420,
                            maxHeight: 520,
                            overflow: 'auto',
                            borderRadius: 2,
                            boxShadow: 1,
                            backgroundColor: 'background.paper',
                            position: 'relative',
                            '&::-webkit-scrollbar': { width: '8px' },
                            '&::-webkit-scrollbar-track': {
                                backgroundColor: 'rgba(0,0,0,0.04)',
                                borderRadius: '4px'
                            },
                            '&::-webkit-scrollbar-thumb': {
                                backgroundColor: 'rgba(0,0,0,0.1)',
                                borderRadius: '4px',
                                '&:hover': { backgroundColor: 'rgba(0,0,0,0.2)' }
                            }
                        }}>
                            <DragDropContext onDragEnd={onDragEnd}>
                                <Droppable droppableId="planned-projects">
                                    {(provided, snapshot) => (
                                        <List
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            sx={{
                                                border: `2px dashed ${snapshot.isDraggingOver ? '#1976d2' : '#e0e0e0'}`,
                                                p: 3,
                                                borderRadius: 2,
                                                backgroundColor: snapshot.isDraggingOver ? '#f5f9ff' : '#fafafa',
                                                transition: 'all 0.3s ease',
                                                minHeight: 380,
                                                position: 'relative',
                                                '&::before': {
                                                    content: '"Drag items to reorder"',
                                                    position: 'absolute',
                                                    top: '16px',
                                                    left: '16px',
                                                    fontSize: '0.75rem',
                                                    color: 'text.secondary',
                                                    opacity: sortedPlannedProjects.length > 0 ? 0 : 1,
                                                    transition: 'opacity 0.2s ease'
                                                }
                                            }}
                                        >
                                            {sortedPlannedProjects.map((project, index) => (
                                                <Draggable
                                                    key={`project-${project.id}`}
                                                    draggableId={`project-${project.id}`}
                                                    index={index}
                                                >
                                                    {(provided, snapshot) => (
                                                        <ListItem
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            sx={{
                                                                mb: 2,
                                                                p: 2.5,
                                                                backgroundColor: snapshot.isDragging
                                                                    ? 'rgba(25, 118, 210, 0.1)'
                                                                    : 'white',
                                                                borderRadius: 1.5,
                                                                boxShadow: snapshot.isDragging
                                                                    ? '0 8px 24px rgba(25, 118, 210, 0.2)'
                                                                    : '0 2px 8px rgba(0, 0, 0, 0.06)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                cursor: 'grab',
                                                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                border: snapshot.isDragging
                                                                    ? '1px solid #1976d2'
                                                                    : '1px solid #f0f0f0',
                                                                '&:hover': {
                                                                    boxShadow: !snapshot.isDragging
                                                                        ? '0 4px 12px rgba(0, 0, 0, 0.08)'
                                                                        : 'inherit',
                                                                    borderColor: !snapshot.isDragging
                                                                        ? 'rgba(25, 118, 210, 0.2)'
                                                                        : 'inherit'
                                                                }
                                                            }}
                                                        >
                                                            {/* 优先级序号 */}
                                                            <Box
                                                                sx={{
                                                                    width: 32,
                                                                    height: 32,
                                                                    borderRadius: '50%',
                                                                    backgroundColor: '#ffeed1ff',
                                                                    color: 'white',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    fontWeight: 600,
                                                                    fontSize: '0.875rem',
                                                                    mr: 2,
                                                                }}
                                                            >
                                                                {index + 1}
                                                            </Box>

                                                            {/* 拖拽手柄 */}
                                                            <ListItemIcon
                                                                {...provided.dragHandleProps}
                                                                sx={{
                                                                    cursor: 'grab',
                                                                    color: snapshot.isDragging ? '#1976d2' : 'action',
                                                                    mr: 1,
                                                                    flexShrink: 0
                                                                }}
                                                            >
                                                                <MuiDragHandle fontSize="medium" />
                                                            </ListItemIcon>

                                                            {/* 项目信息 */}
                                                            <ListItemText
                                                                primary={
                                                                    <Typography
                                                                        variant="subtitle2"
                                                                        sx={{
                                                                            fontWeight: 500,
                                                                            color: 'text.primary',
                                                                            mb: 0.5
                                                                        }}
                                                                    >
                                                                        {project.title}
                                                                    </Typography>
                                                                }
                                                                secondary={
                                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                                        <Typography component="span" variant="caption" color="text.secondary">
                                                                            Supervisor: {project.supervisor_name || 'N/A'}
                                                                        </Typography>
                                                                        <Typography component="span" variant="caption" color="text.secondary">
                                                                            Programme: {project.programme || 'N/A'}
                                                                        </Typography>
                                                                    </Box>
                                                                }
                                                                sx={{ flex: 1, minWidth: 0 }}
                                                            />

                                                            {/* 操作按钮组 */}
                                                            <Box sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 1,
                                                                flexShrink: 0
                                                            }}>
                                                                <Box sx={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    backgroundColor: 'rgba(0,0,0,0.02)',
                                                                    borderRadius: 1,
                                                                    p: 0.5
                                                                }}>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => moveProject(index, 'up')}
                                                                        disabled={index === 0}
                                                                        sx={{
                                                                            color: index === 0 ? 'disabled' : 'primary',
                                                                            '&:hover': {
                                                                                backgroundColor: index === 0 ? 'inherit' : 'rgba(25, 118, 210, 0.08)'
                                                                            },
                                                                            padding: '4px'
                                                                        }}
                                                                    >
                                                                        <ArrowUpward fontSize="small" />
                                                                    </IconButton>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => moveProject(index, 'down')}
                                                                        disabled={index === sortedPlannedProjects.length - 1}
                                                                        sx={{
                                                                            color: index === sortedPlannedProjects.length - 1 ? 'disabled' : 'primary',
                                                                            '&:hover': {
                                                                                backgroundColor: index === sortedPlannedProjects.length - 1 ? 'inherit' : 'rgba(25, 118, 210, 0.08)'
                                                                            },
                                                                            padding: '4px'
                                                                        }}
                                                                    >
                                                                        <ArrowDownward fontSize="small" />
                                                                    </IconButton>
                                                                </Box>

                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleCheckboxChange(project.id)}
                                                                    sx={{
                                                                        color: 'error.main',
                                                                        backgroundColor: 'rgba(220, 0, 0, 0.04)',
                                                                        '&:hover': {
                                                                            backgroundColor: 'rgba(220, 0, 0, 0.1)'
                                                                        },
                                                                        borderRadius: 1
                                                                    }}
                                                                >
                                                                    <Close fontSize="small" />
                                                                </IconButton>
                                                            </Box>
                                                        </ListItem>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </List>
                                    )}
                                </Droppable>
                            </DragDropContext>

                            {/* 空状态 */}
                            {sortedPlannedProjects.length === 0 && (
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    py: 8,
                                    color: 'text.secondary',
                                    textAlign: 'center'
                                }}>
                                    <MuiDragHandle sx={{ fontSize: 48, mb: 2, opacity: 0.2 }} />
                                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 400 }}>
                                        No projects selected yet
                                    </Typography>
                                    <Typography variant="body2">
                                        Go to All Projects tab to select up to 5 projects
                                    </Typography>
                                </Box>
                            )}
                        </Paper>

                        {/* 优先级说明提示 */}
                        <Box sx={{
                            backgroundColor: 'rgba(25, 118, 210, 0.04)',
                            borderRadius: 1,
                            p: 1.5,
                            borderLeft: '4px solid #1976d2'
                        }}>
                            <Typography variant="caption" color="text.secondary">
                                <strong>Priority Note:</strong> The order of projects determines your preference (1 = highest priority).
                                Changes are saved to the server and will persist across sessions.
                            </Typography>
                        </Box>
                    </Box>
                )}
            </Box>

            {/* 项目详情Dialog */}
            <Dialog
                open={detailDialogOpen}
                onClose={() => setDetailDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 600 }}>
                    {selectedProject?.title}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item size={{ xs: 12 }}>
                            <Typography variant="body2" color="text.secondary">
                                Supervisor: {selectedProject?.supervisor_name || 'N/A'}
                            </Typography>
                        </Grid>
                        <Grid item size={{ xs: 12 }}>
                            <Typography variant="body2" color="text.secondary">
                                Supervisor Email: {selectedProject?.supervisor_email || 'N/A'}
                            </Typography>
                        </Grid>
                        <Grid item size={{ xs: 12 }}>
                            <Typography variant="body2" color="text.secondary">
                                Programme: {selectedProject?.programme || 'N/A'}
                            </Typography>
                        </Grid>
                        <Grid item size={{ xs: 12 }}>
                            <Typography variant="body2" color="text.secondary">
                                Semester: {selectedProject?.semester_name || 'N/A'}
                            </Typography>
                        </Grid>
                        <Grid item size={{ xs: 12 }}>
                            <Typography variant="body2" color="text.secondary">
                                Venue: {selectedProject?.venue_name} ({selectedProject?.venue_location || 'N/A'})
                            </Typography>
                        </Grid>
                        <Grid item size={{ xs: 12 }}>
                            <Typography variant="body2" color="text.secondary">
                                Capacity: {selectedProject?.current_registrations}/{selectedProject?.capacity}
                            </Typography>
                        </Grid>
                        <Grid item size={{ xs: 12 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                Description:
                            </Typography>
                            <Typography variant="body1">
                                {selectedProject?.description || 'No description available'}
                            </Typography>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailDialogOpen(false)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 提示弹窗 */}
            <Snackbar
                open={saveSnackbar.open}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <MuiAlert
                    onClose={handleSnackbarClose}
                    severity={saveSnackbar.type}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {saveSnackbar.message}
                </MuiAlert>
            </Snackbar>
        </StudentLayout>
    );
}