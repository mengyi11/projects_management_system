'use client';
import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import {
    Box,
    Typography,
    Grid,
    Divider,
    Card,
    CardContent,
    Alert,
    Tooltip,
    Switch,
    FormControlLabel,
    Button
} from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';
import CDateTimePicker from '../input/CDateTimePicker';
import dayjs from 'dayjs';

// 定义阶段容器样式（统一深紫色左侧边+白色背景）
const StageContainer = ({ children, sx = {} }) => (
    <Box
        sx={{
            mb: 4,
            p: 3,
            backgroundColor: '#fefefeff', // 白色背景
            borderRadius: 1,
            borderLeft: '4px solid #41009cff', // 深紫色左侧边
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)', // 轻微阴影增强层次
            ...sx,
        }}
    >
        {children}
    </Box>
);

const TimelineForm = ({ onSave }) => {
    const { control, handleSubmit, formState: { errors }, setError, clearErrors } = useFormContext();
    const [activeToggleDisabled, setActiveToggleDisabled] = useState(true);
    const [submitErrors, setSubmitErrors] = useState([]);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // 提交时统一验证所有规则（逻辑不变）
    const onSubmit = (data) => {
        setIsSubmitted(true);
        const errors = [];
        clearErrors();

        console.log("Validating timeline data:", data);

        // 1. 验证学期时间
        if (!data.sem_start_date || !data.sem_end_date) {
            errors.push("Please select the semester start and end dates first.");
            if (!data.sem_start_date) setError('sem_start_date', { type: 'required', message: 'Semester start date is required' });
            if (!data.sem_end_date) setError('sem_end_date', { type: 'required', message: 'Semester end date is required' });
        } else if (dayjs(data.sem_start_date).isAfter(data.sem_end_date)) {
            const msg = "Semester end date cannot be earlier than start date.";
            errors.push(msg);
            setError('sem_end_date', { type: 'endBeforeStart', message: msg });
        }

        // 2. 验证所有活动时间（仅当学期时间有效时）
        if (data.sem_start_date && data.sem_end_date && dayjs(data.sem_start_date).isBefore(data.sem_end_date)) {
            // 2.1 教师提案提交阶段
            if (!data.faculty_proposal_submission_start || !data.faculty_proposal_submission_end) {
                errors.push("Faculty Proposal Submission start and end dates are required.");
                if (!data.faculty_proposal_submission_start) setError('faculty_proposal_submission_start', { type: 'required', message: 'Start date is required' });
                if (!data.faculty_proposal_submission_end) setError('faculty_proposal_submission_end', { type: 'required', message: 'End date is required' });
            } else {
                if (dayjs(data.faculty_proposal_submission_end).isBefore(data.faculty_proposal_submission_start)) {
                    const msg = "Faculty Proposal Submission end date cannot be earlier than start date.";
                    errors.push(msg);
                    setError('faculty_proposal_submission_end', { type: 'endBeforeStart', message: msg });
                }
                if (dayjs(data.faculty_proposal_submission_start).isBefore(data.sem_start_date)) {
                    const msg = "Faculty Proposal Submission must be within semester period.";
                    errors.push(msg);
                    setError('faculty_proposal_submission_start', { type: 'outOfRange', message: msg });
                }
                if (dayjs(data.faculty_proposal_submission_end).isAfter(data.sem_end_date)) {
                    const msg = "Faculty Proposal Submission must be within semester period.";
                    errors.push(msg);
                    setError('faculty_proposal_submission_end', { type: 'outOfRange', message: msg });
                }
            }

            // 2.2 教师提案审核阶段（依赖提交阶段）
            if (data.faculty_proposal_submission_start && data.faculty_proposal_submission_end) {
                if (!data.faculty_proposal_review_start || !data.faculty_proposal_review_end) {
                    errors.push("Faculty Proposal Review start and end dates are required.");
                    if (!data.faculty_proposal_review_start) setError('faculty_proposal_review_start', { type: 'required', message: 'Start date is required' });
                    if (!data.faculty_proposal_review_end) setError('faculty_proposal_review_end', { type: 'required', message: 'End date is required' });
                } else {
                    if (dayjs(data.faculty_proposal_review_end).isBefore(data.faculty_proposal_review_start)) {
                        const msg = "Faculty Proposal Review end date cannot be earlier than start date.";
                        errors.push(msg);
                        setError('faculty_proposal_review_end', { type: 'endBeforeStart', message: msg });
                    }
                    if (dayjs(data.faculty_proposal_review_start).isBefore(data.faculty_proposal_submission_end)) {
                        const msg = "Faculty Proposal Review must start after Faculty Proposal Submission ends.";
                        errors.push(msg);
                        setError('faculty_proposal_review_start', { type: 'orderError', message: msg });
                    }
                    if (dayjs(data.faculty_proposal_review_start).isBefore(data.sem_start_date)) {
                        const msg = "Faculty Proposal Review must be within semester period.";
                        errors.push(msg);
                        setError('faculty_proposal_review_start', { type: 'outOfRange', message: msg });
                    }
                    if (dayjs(data.faculty_proposal_review_end).isAfter(data.sem_end_date)) {
                        const msg = "Faculty Proposal Review must be within semester period.";
                        errors.push(msg);
                        setError('faculty_proposal_review_end', { type: 'outOfRange', message: msg });
                    }
                }
            }

            // 2.3 学生注册阶段（依赖审核阶段）
            if (data.faculty_proposal_review_start && data.faculty_proposal_review_end) {
                if (!data.student_registration_start || !data.student_registration_end) {
                    errors.push("Student Registration start and end dates are required.");
                    if (!data.student_registration_start) setError('student_registration_start', { type: 'required', message: 'Start date is required' });
                    if (!data.student_registration_end) setError('student_registration_end', { type: 'required', message: 'End date is required' });
                } else {
                    if (dayjs(data.student_registration_end).isBefore(data.student_registration_start)) {
                        const msg = "Student Registration end date cannot be earlier than start date.";
                        errors.push(msg);
                        setError('student_registration_end', { type: 'endBeforeStart', message: msg });
                    }
                    if (dayjs(data.student_registration_start).isBefore(data.faculty_proposal_review_end)) {
                        const msg = "Student Registration must start after Faculty Proposal Review ends.";
                        errors.push(msg);
                        setError('student_registration_start', { type: 'orderError', message: msg });
                    }
                    if (dayjs(data.student_registration_start).isBefore(data.sem_start_date)) {
                        const msg = "Student Registration must be within semester period.";
                        errors.push(msg);
                        setError('student_registration_start', { type: 'outOfRange', message: msg });
                    }
                    if (dayjs(data.student_registration_end).isAfter(data.sem_end_date)) {
                        const msg = "Student Registration must be within semester period.";
                        errors.push(msg);
                        setError('student_registration_end', { type: 'outOfRange', message: msg });
                    }
                }
            }

            // 2.4 教师评分阶段（依赖注册阶段）
            if (data.student_registration_start && data.student_registration_end) {
                if (!data.faculty_rank_entry_start || !data.faculty_rank_entry_end) {
                    errors.push("Faculty Rank Entry start and end dates are required.");
                    if (!data.faculty_rank_entry_start) setError('faculty_rank_entry_start', { type: 'required', message: 'Start date is required' });
                    if (!data.faculty_rank_entry_end) setError('faculty_rank_entry_end', { type: 'required', message: 'End date is required' });
                } else {
                    if (dayjs(data.faculty_rank_entry_end).isBefore(data.faculty_rank_entry_start)) {
                        const msg = "Faculty Rank Entry end date cannot be earlier than start date.";
                        errors.push(msg);
                        setError('faculty_rank_entry_end', { type: 'endBeforeStart', message: msg });
                    }
                    if (dayjs(data.faculty_rank_entry_start).isBefore(data.student_registration_end)) {
                        const msg = "Faculty Rank Entry must start after Student Registration ends.";
                        errors.push(msg);
                        setError('faculty_rank_entry_start', { type: 'orderError', message: msg });
                    }
                    if (dayjs(data.faculty_rank_entry_start).isBefore(data.sem_start_date)) {
                        const msg = "Faculty Rank Entry must be within semester period.";
                        errors.push(msg);
                        setError('faculty_rank_entry_start', { type: 'outOfRange', message: msg });
                    }
                    if (dayjs(data.faculty_rank_entry_end).isAfter(data.sem_end_date)) {
                        const msg = "Faculty Rank Entry must be within semester period.";
                        errors.push(msg);
                        setError('faculty_rank_entry_end', { type: 'outOfRange', message: msg });
                    }
                }
            }

            // 2.5 学生互评阶段（依赖评分阶段）
            if (data.faculty_rank_entry_start && data.faculty_rank_entry_end) {
                if (!data.student_peer_review_start || !data.student_peer_review_end) {
                    errors.push("Student Peer Review start and end dates are required.");
                    if (!data.student_peer_review_start) setError('student_peer_review_start', { type: 'required', message: 'Start date is required' });
                    if (!data.student_peer_review_end) setError('student_peer_review_end', { type: 'required', message: 'End date is required' });
                } else {
                    if (dayjs(data.student_peer_review_end).isBefore(data.student_peer_review_start)) {
                        const msg = "Student Peer Review end date cannot be earlier than start date.";
                        errors.push(msg);
                        setError('student_peer_review_end', { type: 'endBeforeStart', message: msg });
                    }
                    if (dayjs(data.student_peer_review_start).isBefore(data.faculty_rank_entry_end)) {
                        const msg = "Student Peer Review must start after Faculty Rank Entry ends.";
                        errors.push(msg);
                        setError('student_peer_review_start', { type: 'orderError', message: msg });
                    }
                    if (dayjs(data.student_peer_review_start).isBefore(data.sem_start_date)) {
                        const msg = "Student Peer Review must be within semester period.";
                        errors.push(msg);
                        setError('student_peer_review_start', { type: 'outOfRange', message: msg });
                    }
                    if (dayjs(data.student_peer_review_end).isAfter(data.sem_end_date)) {
                        const msg = "Student Peer Review must be within semester period.";
                        errors.push(msg);
                        setError('student_peer_review_end', { type: 'outOfRange', message: msg });
                    }
                }
            }
        }

        // 3. 验证结果处理
        if (errors.length === 0) {
            setSubmitErrors([]);
            setActiveToggleDisabled(false);
            onSave(data); // 触发父组件的后端提交
        } else {
            setSubmitErrors(errors);
        }
    };

    // 获取单个字段的错误提示（逻辑不变）
    const getFieldError = (fieldName) => {
        return errors[fieldName]?.message || '';
    };

    return (
        <>
            {/* 提交后的错误汇总提示 */}
            {isSubmitted && submitErrors.length > 0 && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Please correct the following issues:</Typography>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {submitErrors.map((error, index) => (
                            <li key={index} style={{ marginBottom: 4 }}>{error}</li>
                        ))}
                    </ul>
                </Alert>
            )}

            {/* Active Toggle 开关（仅验证通过后启用） */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3, alignItems: 'center' }}>
                <FormControlLabel
                    control={
                        <Switch
                            name="timeline_active"
                            disabled={activeToggleDisabled}
                            color="primary"
                        />
                    }
                    label="Active"
                />
                {activeToggleDisabled && (
                    <Tooltip title="Please complete and validate all date fields first (click 'Submit Timeline' to check).">
                        <InfoOutlined fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
                    </Tooltip>
                )}
            </Box>

            {/* 主表单容器（保留原Card结构，仅替换内部阶段卡片） */}
            <Card sx={{ mb: 4 }}>
                <CardContent>
                    <Typography variant="h5" gutterBottom>Semester Timeline</Typography>
                    <Typography variant="body2" color="text.secondary" mb={4}>
                        Set up important dates for the semester. All dates must follow the sequence and stay within the semester period.
                        Click "Submit Timeline" to validate all fields.
                    </Typography>

                    {/* 1. 学期时间（替换为StageContainer，深紫色左侧边） */}
                    <StageContainer>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">1. Semester Period</Typography>
                            <Tooltip title="Define the overall semester start and end dates">
                                <InfoOutlined fontSize="small" />
                            </Tooltip>
                        </Box>
                        <Grid container spacing={3}>
                            <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                                <CDateTimePicker
                                    label="Semester Start Date & Time"
                                    name="sem_start_date"
                                    control={control}
                                    sx={{ mb: 1, width: '100%' }}
                                    error={!!errors.sem_start_date}
                                    helperText={getFieldError('sem_start_date')}
                                />
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                                <CDateTimePicker
                                    label="Semester End Date & Time"
                                    name="sem_end_date"
                                    control={control}
                                    sx={{ mb: 1, width: '100%' }}
                                    error={!!errors.sem_end_date}
                                    helperText={getFieldError('sem_end_date')}
                                />
                            </Grid>
                        </Grid>
                    </StageContainer>

                    <Divider sx={{ my: 3 }} />

                    {/* 2. 教师提案提交（替换为StageContainer） */}
                    <StageContainer>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">2. Faculty Proposal Submission</Typography>
                            <Tooltip title="Period when faculty can submit project proposals">
                                <InfoOutlined fontSize="small" />
                            </Tooltip>
                        </Box>
                        <Grid container spacing={3}>
                            <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                                <CDateTimePicker
                                    label="Start Date & Time"
                                    name="faculty_proposal_submission_start"
                                    control={control}
                                    sx={{ mb: 1, width: '100%' }}
                                    error={!!errors.faculty_proposal_submission_start}
                                    helperText={getFieldError('faculty_proposal_submission_start')}
                                />
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                                <CDateTimePicker
                                    label="End Date & Time"
                                    name="faculty_proposal_submission_end"
                                    control={control}
                                    sx={{ mb: 1, width: '100%' }}
                                    error={!!errors.faculty_proposal_submission_end}
                                    helperText={getFieldError('faculty_proposal_submission_end')}
                                />
                            </Grid>
                        </Grid>
                    </StageContainer>

                    <Divider sx={{ my: 3 }} />

                    {/* 3. 教师提案审核（替换为StageContainer） */}
                    <StageContainer>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">3. Faculty Proposal Review</Typography>
                            <Tooltip title="Period when submitted proposals are reviewed">
                                <InfoOutlined fontSize="small" />
                            </Tooltip>
                        </Box>
                        <Grid container spacing={3}>
                            <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                                <CDateTimePicker
                                    label="Start Date & Time"
                                    name="faculty_proposal_review_start"
                                    control={control}
                                    sx={{ mb: 1, width: '100%' }}
                                    error={!!errors.faculty_proposal_review_start}
                                    helperText={getFieldError('faculty_proposal_review_start')}
                                />
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                                <CDateTimePicker
                                    label="End Date & Time"
                                    name="faculty_proposal_review_end"
                                    control={control}
                                    sx={{ mb: 1, width: '100%' }}
                                    error={!!errors.faculty_proposal_review_end}
                                    helperText={getFieldError('faculty_proposal_review_end')}
                                />
                            </Grid>
                        </Grid>
                    </StageContainer>

                    <Divider sx={{ my: 3 }} />

                    {/* 4. 学生注册（替换为StageContainer，与其他阶段样式统一） */}
                    <StageContainer>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">4. Student Registration</Typography>
                            <Tooltip title="Period when students register for projects">
                                <InfoOutlined fontSize="small" />
                            </Tooltip>
                        </Box>
                        <Grid container spacing={3}>
                            <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                                <CDateTimePicker
                                    label="Start Date & Time"
                                    name="student_registration_start"
                                    control={control}
                                    sx={{ mb: 1, width: '100%' }}
                                    error={!!errors.student_registration_start}
                                    helperText={getFieldError('student_registration_start')}
                                />
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                                <CDateTimePicker
                                    label="End Date & Time"
                                    name="student_registration_end"
                                    control={control}
                                    sx={{ mb: 1, width: '100%' }}
                                    error={!!errors.student_registration_end}
                                    helperText={getFieldError('student_registration_end')}
                                />
                            </Grid>
                        </Grid>
                    </StageContainer>

                    <Divider sx={{ my: 3 }} />

                    {/* 5. 教师评分（替换为StageContainer） */}
                    <StageContainer>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">5. Faculty Rank Entry</Typography>
                            <Tooltip title="Period when faculty submit project rankings">
                                <InfoOutlined fontSize="small" />
                            </Tooltip>
                        </Box>
                        <Grid container spacing={3}>
                            <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                                <CDateTimePicker
                                    label="Start Date & Time"
                                    name="faculty_rank_entry_start"
                                    control={control}
                                    sx={{ mb: 1, width: '100%' }}
                                    error={!!errors.faculty_rank_entry_start}
                                    helperText={getFieldError('faculty_rank_entry_start')}
                                />
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                                <CDateTimePicker
                                    label="End Date & Time"
                                    name="faculty_rank_entry_end"
                                    control={control}
                                    sx={{ mb: 1, width: '100%' }}
                                    error={!!errors.faculty_rank_entry_end}
                                    helperText={getFieldError('faculty_rank_entry_end')}
                                />
                            </Grid>
                        </Grid>
                    </StageContainer>

                    <Divider sx={{ my: 3 }} />

                    {/* 6. 学生互评（替换为StageContainer） */}
                    <StageContainer>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">6. Student Peer Review</Typography>
                            <Tooltip title="Period when students review their peers">
                                <InfoOutlined fontSize="small" />
                            </Tooltip>
                        </Box>
                        <Grid container spacing={3}>
                            <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                                <CDateTimePicker
                                    label="Start Date & Time"
                                    name="student_peer_review_start"
                                    control={control}
                                    sx={{ mb: 1, width: '100%' }}
                                    error={!!errors.student_peer_review_start}
                                    helperText={getFieldError('student_peer_review_start')}
                                />
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6, md: 6 }}>
                                <CDateTimePicker
                                    label="End Date & Time"
                                    name="student_peer_review_end"
                                    control={control}
                                    sx={{ mb: 1, width: '100%' }}
                                    error={!!errors.student_peer_review_end}
                                    helperText={getFieldError('student_peer_review_end')}
                                />
                            </Grid>
                        </Grid>
                    </StageContainer>

                    {/* 提交按钮 */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmit(onSubmit)}
                            sx={{ minWidth: 200, py: 1.5 }}
                        >
                            Submit Timeline
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </>
    );
};

export default TimelineForm;