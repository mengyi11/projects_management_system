'use client';
import { useState } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, Tabs, Tab, Badge, IconButton, Tooltip,
    Select, MenuItem, TextField, Button, FormControl, InputLabel,
    Chip
} from '@mui/material';
import { CalendarToday, CalendarMonth, Event } from '@mui/icons-material';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';
import CDateTimePicker from '@/components/input/CDateTimePicker';
import { useForm, FormProvider } from 'react-hook-form';
import TimelineForm from '@/components/forms/TimelineForm';

// 月份列表
const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];



// 模拟后端返回的学期时间线数据
const timelineData = [
    {
        title: 'Semester Period',
        status: 'In Progress',
        start: '01 May 2023',
        end: '01 Sep 2025',
        description: 'Overall semester duration'
    },
    {
        title: 'Faculty Proposal Submission',
        status: 'In Progress',
        start: '13 Apr 2024',
        end: '31 Mar 2025',
        description: 'Faculty submit project proposals'
    },
    {
        title: 'Faculty Proposal Review',
        status: 'In Progress',
        start: '01 Mar 2025',
        end: '01 Apr 2025',
        description: 'Review and approve proposals'
    },
    {
        title: 'Student Registration',
        status: 'Upcoming',
        start: '30 Mar 2025',
        end: '20 Apr 2025',
        description: 'Students register for projects'
    },
    {
        title: 'Faculty Mark Entry',
        status: 'In Progress',
        start: '01 Mar 2025',
        end: '31 May 2025',
        description: 'Faculty enter project marks'
    },
    {
        title: 'Student Peer Review',
        status: 'Upcoming',
        start: '31 Mar 2025',
        end: '30 Jun 2025',
        description: 'Students review peers\' work'
    },
];



export default function SetTimelinePage() {
    const currentPathArr = ['Admin', 'Semester', 'Manage Semester', 'Set All Timeline Dates'];
    const [activeTab, setActiveTab] = useState(0);
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const methods = useForm({
        defaultValues: {
            semester_id: 1, // 示例学期ID
            sem_start_date: '2024-09-01 00:00:00',
            sem_end_date: '2025-01-31 23:59:59',
            faculty_proposal_submission_start: '2024-09-01 00:00:00',
            faculty_proposal_submission_end: '2024-09-15 23:59:59',
            faculty_proposal_review_start: '2024-09-16 00:00:00',
            faculty_proposal_review_end: '2024-09-30 23:59:59',
            student_registration_start: '2024-10-01 00:00:00',
            student_registration_end: '2024-10-15 23:59:59',
            faculty_rank_entry_start: '2024-10-16 00:00:00',
            faculty_rank_entry_end: '2024-11-30 23:59:59',
            student_peer_review_start: '2024-12-01 00:00:00',
            student_peer_review_end: '2024-12-15 23:59:59',
        },
    });

    const { handleSubmit } = methods;

    // 表单提交处理
    const onSubmit = (data) => {
        console.log('Timeline data submitted:', data);
        // 这里添加API调用逻辑
        alert('Timeline saved successfully!');
    };


    // const [semesterStart, setSemesterStart] = useState('2023-05-01 12:30:00');
    // const [semesterEnd, setSemesterEnd] = useState('2025-09-01 00:00:00');

    //       const methods = useForm({
    //     defaultValues: {
    //       semesterStart: '2023-05-01 12:30:00',
    //       semesterEnd: '2025-09-01 00:00:00',
    //     },
    //   });
    // 学期时间状态
    // const [semesterStart, setSemesterStart] = useState({
    //     year: 2023,
    //     month: 'May',
    //     day: 1,
    //     hour: 12,
    //     minute: 30,
    // });
    // const [semesterEnd, setSemesterEnd] = useState({
    //     year: 2025,
    //     month: 'September',
    //     day: 1,
    //     hour: 0,
    //     minute: 0,
    // });

    // 教师提案提交时间状态
    const [proposalSubStart, setProposalSubStart] = useState({
        year: 2024,
        month: 'April',
        day: 13,
        hour: 23,
        minute: 20,
    });
    const [proposalSubEnd, setProposalSubEnd] = useState({
        year: 2025,
        month: 'March',
        day: 31,
        hour: 0,
        minute: 0,
    });

    // const handleSubmit = (e) => {
    //     e.preventDefault();
    //     // 提交逻辑
    //     alert('Timeline dates updated successfully!');
    // };
    // const handleSave = () => {
    //     // 1. 执行保存逻辑（如API调用）
    //     saveTimelineData(formData);
    //     // 2. 保存成功后重置提示状态
    //     timelineRef.current.resetChangeStatus();
    // };

    return (
        <AdminLayout pathArr={currentPathArr}>
            <Box sx={{
                // maxWidth: '1200px',
                mx: 'auto',
                p: 4,
                backgroundColor: '#f9fafb',
                minHeight: '100vh'
            }}>
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 4,
                    flexWrap: 'wrap'
                }}>
                    <Box>
                        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                            Manage 2025 Semester 1
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Configure timeline events and programmes for this semester
                        </Typography>
                    </Box>
                    {/* 刷新按钮 */}
                    <Tooltip title="Refresh timeline data">
                        <IconButton
                            sx={{
                                backgroundColor: 'white',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                '&:hover': { backgroundColor: '#f0f0f0' }
                            }}
                        >
                            <Event fontSize="small" color="primary" />
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* 标签页导航 */}
                <Box sx={{
                    mb: 4,
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    p: 1
                }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 500,
                                minWidth: '160px',
                                py: 1.5
                            },
                            '& .Mui-selected': { color: '#1976d2' },
                            '& .MuiTabs-indicator': { backgroundColor: '#1976d2' }
                        }}
                    >
                        <Tab label="Timeline Events" />
                        <Tab label="Bulk Update Timeline" />
                        <Tab label="Programmes" />
                    </Tabs>
                </Box>

                {/* 标签页内容区域 */}
                <Box sx={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', }}>
                    {/* 1. 时间线事件列表（默认激活） */}
                    {activeTab === 0 && (
                        <Box>
                            {/* 学期信息卡片 */}
                            <Card sx={{ mb: 4 }}>
                                <CardContent>
                                    <Typography variant="h5" gutterBottom>
                                        Semester Timeline
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="body1" sx={{ mr: 2 }}>
                                            2025 Semester 1
                                        </Typography>
                                        <Chip
                                            label="Active"
                                            sx={{
                                                backgroundColor: '#80b1e3ff',
                                                p: 0,
                                                m: 0
                                            }}
                                        />
                                    </Box>

                                    {/* 时间线卡片网格 */}
                                    <Grid container spacing={3}>
                                        {timelineData.map((event, index) => (
                                            <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                                                <Card sx={{
                                                    height: '100%',
                                                    transition: 'box-shadow 0.2s',
                                                    '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.08)' },
                                                    borderTop: event.status === 'In Progress'
                                                        ? '3px solid #e6c611ff'
                                                        : '3px solid #757575'
                                                }}>
                                                    <CardContent sx={{ p: 2.5 }}>
                                                        {/* 事件标题与状态 */}
                                                        <Box sx={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            mb: 2
                                                        }}>
                                                            <Typography variant="body1" fontWeight="medium" sx={{ wordBreak: 'break-word' }}>
                                                                {event.title}
                                                            </Typography>
                                                            <Chip
                                                                label={event.status}
                                                                sx={{
                                                                    backgroundColor: event.status === 'In Progress'
                                                                        ? '#e9c948ff'
                                                                        : '#b9b9b9ff',
                                                                    color: event.status === 'In Progress'
                                                                        ? '#875a00ff'
                                                                        : '#676767ff',
                                                                    // fontWeight: 500,
                                                                    textTransform: 'capitalize'
                                                                }}
                                                            />
                                                        </Box>

                                                        {/* 开始时间 */}
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                                            <CalendarMonth
                                                                fontSize="small"
                                                                sx={{ mr: 1, color: 'text.secondary' }}
                                                            />
                                                            <Typography variant="body2" color="text.secondary">
                                                                <span sx={{ fontWeight: 500, color: 'text.primary' }}>Start:</span> {event.start}
                                                            </Typography>
                                                        </Box>

                                                        {/* 结束时间 */}
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <Event
                                                                fontSize="small"
                                                                sx={{ mr: 1, color: 'text.secondary' }}
                                                            />
                                                            <Typography variant="body2" color="text.secondary">
                                                                <span sx={{ fontWeight: 500, color: 'text.primary' }}>End:</span> {event.end}
                                                            </Typography>
                                                        </Box>

                                                        {/* 事件描述（可选） */}
                                                        {event.description && (
                                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
                                                                {event.description}
                                                            </Typography>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Box>
                    )}
                </Box>
                {/* 1. 时间线配置标签（使用 TimelineForm 组件） */}
                {activeTab === 1 && (
                    <FormProvider {...methods}>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <TimelineForm /> {/* 直接调用组件，自动获取 control */}

                            {/* 提交按钮 */}
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    sx={{ px: 6 }}
                                >
                                    Save Timeline
                                </Button>
                            </Box>
                        </form>
                    </FormProvider>
                )}
                {/* 3. 课程项目管理（占位） */}
                {activeTab === 2 && (
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: 8,
                        textAlign: 'center'
                    }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                            Programmes Management
                        </Typography>
                        <Typography variant="body1" color="text.secondary" mb={4} maxWidth="600">
                            Manage programmes associated with 2025 Semester 1. Add, edit, or remove programmes here.
                        </Typography>
                        <Button
                            variant="outlined"
                            color="primary"
                            sx={{ textTransform: 'none', px: 4, py: 1.2 }}
                            disabled
                        >
                            Coming Soon
                        </Button>
                    </Box>
                )}
            </Box>
        </AdminLayout>
    );
}
