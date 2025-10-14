'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  Box,
  Typography,
  Grid,
  Divider,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { CalendarMonth, Event } from '@mui/icons-material';
import CDateTimePicker from '../input/CDateTimePicker';
import dayjs from 'dayjs';

const TimelineForm = () => {
  const { watch, control, setValue } = useFormContext();
  const [isDirty, setIsDirty] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const initialValuesRef = useRef(null);

  // 监听所有时间字段，判断是否有变更
  const watchedFields = useWatch({
    control,
    name: [
      'sem_start_date',
      'sem_end_date',
      'faculty_proposal_submission_start',
      'faculty_proposal_submission_end',
      'faculty_proposal_review_start',
      'faculty_proposal_review_end',
      'student_registration_start',
      'student_registration_end',
      'faculty_rank_entry_start',
      'faculty_rank_entry_end',
      'student_peer_review_start',
      'student_peer_review_end'
    ]
  });

  // 初始化初始值引用
  useEffect(() => {
    initialValuesRef.current = { ...watchedFields };
  }, [watchedFields]);

  // 监听字段变更，标记为脏数据
  useEffect(() => {
    if (initialValuesRef.current) {
      const isChanged = Object.keys(watchedFields).some(key => 
        !dayjs(watchedFields[key]).isSame(initialValuesRef.current[key])
      );
      setIsDirty(isChanged);
    }
  }, [watchedFields]);



  // 监听相关字段值，用于时间逻辑关联
  const startDate = watch('sem_start_date');
  const endDate = watch('sem_end_date');
  const facultyProposalSubEnd = watch('faculty_proposal_submission_end');
  const facultyProposalReviewEnd = watch('faculty_proposal_review_end');
  const studentRegistrationEnd = watch('student_registration_end');
  const facultyRankEntryEnd = watch('faculty_rank_entry_end');

  return (
    <>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>Semester Timeline</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Set up important dates for this semester. All dates must be within the semester period.
          </Typography>

          {/* 学期时间区域 */}
          <Card sx={{ mb: 4, p: 3, backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
            <Typography variant="h6" mb={1}>Semester Period</Typography>
            <Typography variant="body2" color="text.secondary" mb={4}>
              Define the overall start and end dates for this semester
            </Typography>
            {/* 1. 学期基础时间 */}
            <Box>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <CalendarMonth sx={{ mr: 1.5, color: 'primary.main' }} />
                Semester Basic Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item size={{ xs: 12, sm: 6 }}>
                  <CDateTimePicker
                    label="Semester Start Date"
                    name="sem_start_date"
                    control={control}
                    rules={{ required: 'Start date is required' }}
                    maxDate={endDate}
                    sx={{ mb: 1, width: '100%' }}
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 6 }}>
                  <CDateTimePicker
                    label="Semester End Date"
                    name="sem_end_date"
                    control={control}
                    rules={{ required: 'End date is required' }}
                    minDate={startDate}
                    sx={{ mb: 1, width: '100%' }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Card>

          <Divider sx={{ my: 3 }} />

          {/* 2. 教师提案提交及其他活动 */}
          <Card sx={{ mb: 4, p: 3, backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
            <Typography variant="h6" mb={1}>Activity Period</Typography>
            <Typography variant="body2" color="text.secondary" mb={4}>
              Define the time periods for various activities during the semester
            </Typography>
            
            {/* 教师提案提交 */}
            <Box>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center'}}>
                <CalendarMonth sx={{ mr: 1.5, mb:1, color: 'primary.main' }} />
                Faculty Proposal Submission
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Period when faculty can submit project proposals
              </Typography>
              <Grid container spacing={3}>
                <Grid item size={{ xs: 12, sm: 6 }}>
                  <CDateTimePicker
                    label="Start Date & Time"
                    name="faculty_proposal_submission_start"
                    control={control}
                    rules={{ required: 'Start date is required' }}
                    // minDate={startDate}
                    maxDate={facultyProposalSubEnd}
                    sx={{ mb: 1, width: '100%' }}
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 6 }}>
                  <CDateTimePicker
                    label="End Date & Time"
                    name="faculty_proposal_submission_end"
                    control={control}
                    rules={{ required: 'End date is required' }}
                    minDate={watch('faculty_proposal_submission_start')}
                    maxDate={endDate}
                    sx={{ mb: 1, width: '100%' }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* 教师提案审核 */}
            <Box>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center'}}>
                 <CalendarMonth sx={{ mr: 1.5, mb:1, color: 'primary.main' }} />
                Faculty Proposal Review
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Period when submitted proposals are reviewed and approved by the committee
              </Typography>
              <Grid container spacing={3}>
                <Grid item size={{ xs: 12, sm: 6 }}>
                  <CDateTimePicker
                    label="Start Date & Time"
                    name="faculty_proposal_review_start"
                    control={control}
                    rules={{ required: 'Start date is required' }}
                    minDate={facultyProposalSubEnd}
                    maxDate={facultyProposalReviewEnd}
                    sx={{ mb: 1, width: '100%' }}
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 6 }}>
                  <CDateTimePicker
                    label="End Date & Time"
                    name="faculty_proposal_review_end"
                    control={control}
                    rules={{ required: 'End date is required' }}
                    minDate={watch('faculty_proposal_review_start')}
                    maxDate={endDate}
                    sx={{ mb: 1, width: '100%' }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* 学生注册 */}
            <Box>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center'}}>
                <CalendarMonth sx={{ mr: 1.5,  mb:1, color: 'primary.main' }} />
                Student Registration
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Period when students can register for approved projects and select their preferences
              </Typography>
              <Grid container spacing={3}>
                <Grid item size={{ xs: 12, sm: 6 }}>
                  <CDateTimePicker
                    label="Start Date & Time"
                    name="student_registration_start"
                    control={control}
                    rules={{ required: 'Start date is required' }}
                    minDate={facultyProposalReviewEnd}
                    maxDate={studentRegistrationEnd}
                    sx={{ mb: 1, width: '100%' }}
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 6 }}>
                  <CDateTimePicker
                    label="End Date & Time"
                    name="student_registration_end"
                    control={control}
                    rules={{ required: 'End date is required' }}
                    minDate={watch('student_registration_start')}
                    maxDate={endDate}
                    sx={{ mb: 1, width: '100%' }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* 教师评分提交 */}
            <Box>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarMonth sx={{ mr: 1.5, mb:1,  color: 'primary.main' }} />
                Faculty Rank Entry
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Period when faculty can submit project rankings and student performance evaluations
              </Typography>
              <Grid container spacing={3}>
                <Grid item size={{ xs: 12, sm: 6 }}>
                  <CDateTimePicker
                    label="Start Date & Time"
                    name="faculty_rank_entry_start"
                    control={control}
                    rules={{ required: 'Start date is required' }}
                    minDate={studentRegistrationEnd}
                    maxDate={facultyRankEntryEnd}
                    sx={{ mb: 1, width: '100%' }}
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 6 }}>
                  <CDateTimePicker
                    label="End Date & Time"
                    name="faculty_rank_entry_end"
                    control={control}
                    rules={{ required: 'End date is required' }}
                    minDate={watch('faculty_rank_entry_start')}
                    maxDate={endDate}
                    sx={{ mb: 1, width: '100%' }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* 学生互评 */}
            <Box>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarMonth sx={{ mr: 1.5,  mb:1, color: 'primary.main' }} />
                Student Peer Review
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Period when students evaluate and provide feedback on their peers' project contributions
              </Typography>
              <Grid container spacing={3}>
                <Grid item size={{ xs: 12, sm: 6 }}>
                  <CDateTimePicker
                    label="Start Date & Time"
                    name="student_peer_review_start"
                    control={control}
                    rules={{ required: 'Start date is required' }}
                    minDate={facultyRankEntryEnd}
                    maxDate={watch('student_peer_review_end')}
                    sx={{ mb: 1, width: '100%' }}
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 6 }}>
                  <CDateTimePicker
                    label="End Date & Time"
                    name="student_peer_review_end"
                    control={control}
                    rules={{ required: 'End date is required' }}
                    minDate={watch('student_peer_review_start')}
                    maxDate={endDate}
                    sx={{ mb: 1, width: '100%' }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Card>
        </CardContent>
      </Card>
    </>
  );
};

export default TimelineForm;