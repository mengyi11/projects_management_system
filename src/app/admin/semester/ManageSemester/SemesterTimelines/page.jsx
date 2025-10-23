'use client';
import { useEffect, useState } from 'react';
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
import axios from 'axios';
import { toast } from 'react-toastify';
import { useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';
import TimelineView from '@/components/views/ TimelineView';


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



export default function SemesterTimelines() {
    const currentPathArr = ['Admin', 'Semester', 'Manage Semester', 'Set All Timeline Dates'];
    const [activeTab, setActiveTab] = useState(0);
    const [timelineData, setTimelineData] = useState([]);
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };
    const searchParams = useSearchParams();
    // 1. 从 URL 获取 semId（如 ?semId=1）
    const semId = searchParams.get('semId');
    const [savedSemId, setSavedSemId] = useState(''); // 保存 semId 到状态


    const methods = useForm({
        defaultValues: {
            semester_id: semId || '', // 初始化为URL中的semId
            // 其他字段初始化为空或默认值
            sem_start_date: '',
            sem_end_date: '',
            faculty_proposal_submission_start: '',
            faculty_proposal_submission_end: '',
            faculty_proposal_review_start: '',
            faculty_proposal_review_end: '',
            student_registration_start: '',
            student_registration_end: '',
            faculty_rank_entry_start: '',
            faculty_rank_entry_end: '',
            student_peer_review_start: '',
            student_peer_review_end: '',
        },
    });


    useEffect(() => {
        if (semId) {
            getSemesterTimelines(semId);
        }
    }, [semId, methods.reset]);

    // const { handleSubmit } = methods;


    const handleSaveTimeline = async (data) => {
        console.log('Timeline data submitted:', data);

        try {
            // 调用 API 保存时间线（根据后端实际路由调整）
            const response = await axios.post(
                `/api/admin/semesters/${data.semester_id}/timelines`,
                data
            );

            // 关闭加载提示，显示成功消息
            toast.dismiss(); // 关闭加载中提示
            toast.success(
                response.message || 'Timeline saved successfully!',
            );

            // 成功后更新本地状态（根据你的实际需求调整）
            console.log("Semester timeline saved:", response.data.data);
            getSemesterTimelines(semId);

        } catch (error) {
            // 关闭加载提示，显示错误消息
            toast.dismiss();
            const errorMsg =
                error.response?.data?.message ||
                error.message ||
                'Failed to save timeline. Please try again.';

            toast.error(errorMsg);
            console.error('Timeline save error:', error);
            return null;

        } finally {
            // 可在这里处理最终状态（如关闭加载状态）
            // setIsLoading(false);
        }
    };

    // 时间格式化工具函数（将ISO时间转换为可读格式，如"Oct 14, 2025 16:00"）
    const formatDisplayDateTime = (isoString) => {
        if (!isoString) return 'N/A';
        return dayjs(isoString).format('MMM D, YYYY HH:mm');
    };

    // 转换API数据为卡片数组的函数
    const transformTimelineData = (apiData) => {
        if (!apiData) return []; // 处理空数据

        // 定义每个阶段的配置（标题、对应API字段、描述）
        const timelineEvents = [
            {
                title: 'Semester Period',
                startField: 'sem_start_date',
                endField: 'sem_end_date',
                description: 'Overall semester duration'
            },
            {
                title: 'Faculty Proposal Submission',
                startField: 'faculty_proposal_submission_start',
                endField: 'faculty_proposal_submission_end',
                description: 'Period for faculty to submit proposals'
            },
            {
                title: 'Faculty Proposal Review',
                startField: 'faculty_proposal_review_START', // 注意API返回的大写字段
                endField: 'faculty_proposal_review_END',
                description: 'Review period for submitted proposals'
            },
            {
                title: 'Student Registration',
                startField: 'student_registration_start',
                endField: 'student_registration_end',
                description: 'Students register for projects'
            },
            {
                title: 'Faculty Rank Entry',
                startField: 'faculty_rank_entry_start',
                endField: 'faculty_rank_entry_end',
                description: 'Faculty submit project rankings'
            },
            {
                title: 'Student Peer Review',
                startField: 'student_peer_review_start',
                endField: 'student_peer_review_end',
                description: 'Students review their peers'
            }
        ];

        // 转换为卡片数组（计算每个阶段的状态）
        return timelineEvents.map((event) => {
            const start = apiData[event.startField];
            const end = apiData[event.endField];
            const now = new Date();

            // 计算状态：未开始 / 进行中 / 已结束
            let status = 'Upcoming';
            if (start && end) {
                const startDate = new Date(start);
                const endDate = new Date(end);

                if (now >= startDate && now <= endDate) {
                    status = 'In Progress';
                } else if (now > endDate) {
                    status = 'Completed';
                }
            }

            return {
                title: event.title,
                status,
                start: formatDisplayDateTime(start),
                end: formatDisplayDateTime(end),
                description: event.description
            };
        });
    };

    const getSemesterTimelines = async (semesterId) => {
        try {
            const response = await axios.get(
                `/api/admin/semesters/${semesterId}/timelines`
            );

            console.log("Fetched timeline data:", response.data);

            if (response.data.ok) {
                const apiData = response.data.data; // API原始数据

                // 1. 转换数据为卡片数组格式
                const transformedData = transformTimelineData(apiData);
                setTimelineData(transformedData); // 存入状态，供Grid渲染

                // 2. 同时处理表单数据填充（保持原有逻辑）
                const formData = {
                    semester_id: semesterId,
                    sem_start_date: formatDateTime(apiData.sem_start_date),
                    sem_end_date: formatDateTime(apiData.sem_end_date),
                    faculty_proposal_submission_start: formatDateTime(apiData.faculty_proposal_submission_start),
                    faculty_proposal_submission_end: formatDateTime(apiData.faculty_proposal_submission_end),
                    faculty_proposal_review_start: formatDateTime(apiData.faculty_proposal_review_START), // 匹配API大写字段
                    faculty_proposal_review_end: formatDateTime(apiData.faculty_proposal_review_END),
                    student_registration_start: formatDateTime(apiData.student_registration_start),
                    student_registration_end: formatDateTime(apiData.student_registration_end),
                    faculty_rank_entry_start: formatDateTime(apiData.faculty_rank_entry_start),
                    faculty_rank_entry_end: formatDateTime(apiData.faculty_rank_entry_end),
                    student_peer_review_start: formatDateTime(apiData.student_peer_review_start),
                    student_peer_review_end: formatDateTime(apiData.student_peer_review_end),
                };
                methods.reset(formData);

                toast.success('Timeline data loaded successfully');
            } else {
                throw new Error(response.data.message || 'Failed to load timeline');
            }

        } catch (error) {
            toast.dismiss();
            const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch timeline data';
            toast.error(errorMsg);
            console.error('getSemesterTimelines error:', error);
        }
    };

    const formatDateTime = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        // 格式化日期为YYYY-MM-DD
        const datePart = date.toISOString().split('T')[0];
        // 格式化时间为HH:mm:ss（注意时区转换，这里直接取UTC时间的小时部分）
        const timePart = date.toTimeString().split(' ')[0];
        return `${datePart} ${timePart}`;
    };

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
                        // <Box>
                        //     {/* 学期信息卡片 */}
                        //     <Card sx={{ mb: 4 }}>
                        //         <CardContent>
                        //             <Typography variant="h5" gutterBottom>
                        //                 Semester Timeline
                        //             </Typography>
                        //             <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        //                 <Typography variant="body1" sx={{ mr: 2 }}>
                        //                     2025 Semester 1
                        //                 </Typography>
                        //                 <Chip
                        //                     label="Active"
                        //                     sx={{
                        //                         backgroundColor: '#80b1e3ff',
                        //                         p: 0,
                        //                         m: 0
                        //                     }}
                        //                 />
                        //             </Box>

                        //             {/* 时间线卡片网格 */}
                        //             <Grid container spacing={3}>
                        //                 {timelineData.map((event, index) => (
                        //                     <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                        //                         <Card sx={{
                        //                             height: '100%',
                        //                             transition: 'box-shadow 0.2s',
                        //                             '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.08)' },
                        //                             borderTop: event.status === 'In Progress'
                        //                                 ? '3px solid #e6c611ff'
                        //                                 : '3px solid #757575'
                        //                         }}>
                        //                             <CardContent sx={{ p: 2.5 }}>
                        //                                 <Box sx={{
                        //                                     display: 'flex',
                        //                                     justifyContent: 'space-between',
                        //                                     alignItems: 'center',
                        //                                     mb: 2
                        //                                 }}>
                        //                                     <Typography variant="body1" fontWeight="medium" sx={{ wordBreak: 'break-word' }}>
                        //                                         {event.title}
                        //                                     </Typography>
                        //                                     <Chip
                        //                                         label={event.status}
                        //                                         sx={{
                        //                                             backgroundColor: event.status === 'In Progress'
                        //                                                 ? '#e9c948ff'
                        //                                                 : '#b9b9b9ff',
                        //                                             color: event.status === 'In Progress'
                        //                                                 ? '#875a00ff'
                        //                                                 : '#676767ff',
                        //                                             textTransform: 'capitalize'
                        //                                         }}
                        //                                     />
                        //                                 </Box>

                        //                                 <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        //                                     <CalendarMonth
                        //                                         fontSize="small"
                        //                                         sx={{ mr: 1, color: 'text.secondary' }}
                        //                                     />
                        //                                     <Typography variant="body2" color="text.secondary">
                        //                                         <span sx={{ fontWeight: 500, color: 'text.primary' }}>Start:</span> {event.start}
                        //                                     </Typography>
                        //                                 </Box>

                        //                                 <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        //                                     <Event
                        //                                         fontSize="small"
                        //                                         sx={{ mr: 1, color: 'text.secondary' }}
                        //                                     />
                        //                                     <Typography variant="body2" color="text.secondary">
                        //                                         <span sx={{ fontWeight: 500, color: 'text.primary' }}>End:</span> {event.end}
                        //                                     </Typography>
                        //                                 </Box>

                        //                                 {event.description && (
                        //                                     <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
                        //                                         {event.description}
                        //                                     </Typography>
                        //                                 )}
                        //                             </CardContent>
                        //                         </Card>
                        //                     </Grid>
                        //                 ))}
                        //             </Grid>
                        //         </CardContent>
                        //     </Card>
                        // </Box>
                        <TimelineView
                            timelineData={timelineData}  // 直接使用转换后的timelineData状态
                            semesterName={`2025 Semester`}  // 可根据实际学期名动态传递
                        />
                    )}
                </Box>
                {/* 1. 时间线配置标签（使用 TimelineForm 组件） */}
                {activeTab === 1 && (
                    <FormProvider {...methods}>
                        <TimelineForm onSave={handleSaveTimeline} />
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
