'use client';
import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Chip } from '@mui/material';
import { CalendarMonth, Event } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// 自定义样式组件
const StyledSemesterCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 1.5,
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
}));

const StyledEventCard = styled(Card)(({ theme, status }) => ({
  height: '100%',
  borderRadius: theme.shape.borderRadius * 1.2,
  backgroundColor: '#fffefeff',
  borderTop: status === 'In Progress' 
    ? '3px solid #FFC107' // In Progress 黄色边框
    : status === 'Completed'
      ? '3px solid #4CAF50' // 已完成 绿色边框
      : '3px solid #9E9E9E', // Upcoming 灰色边框
  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
  },
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  backgroundColor: status === 'In Progress'
    ? '#fef2deff' // 黄色背景
    : status === 'Completed'
      ? '#E8F5E9' // 绿色背景
      : '#dbdbdbff', // 灰色背景
  color: status === 'In Progress'
    ? '#FF8F00' // 深黄色文字
    : status === 'Completed'
      ? '#2E7D32' // 深绿色文字
      : '#616161', // 灰色文字
  fontWeight: 500,
  textTransform: 'capitalize',
}));

const TimelineView = ({ 
  timelineData = [], 
  semesterName = 'Current Semester' 
}) => {
  return (
    <Box sx={{ width: '100%' }}>
      {/* 学期标题卡片 */}
      <StyledSemesterCard>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight="medium">
              {semesterName} Timeline
            </Typography>
            <StatusChip label="Active" status="Active" />
          </Box>

          {/* 时间线事件网格（严格使用指定的size格式） */}
          <Grid container spacing={3}>
            {timelineData.length > 0 ? (
              timelineData.map((event, index) => (
                <Grid item size={{ xs: 12, sm: 6, md: 4 }}  key={index}>
                  <StyledEventCard status={event.status}>
                    <CardContent sx={{ p: 3 }}>
                      {/* 事件标题和状态 */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }} >
                        <Typography 
                          variant="body1" 
                          fontWeight="medium" 
                          sx={{ wordBreak: 'break-word' }}
                        >
                          {event.title}
                        </Typography>
                        <StatusChip label={event.status} status={event.status} />
                      </Box>

                      {/* 开始时间 */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <CalendarMonth 
                          fontSize="small" 
                          sx={{ 
                            mr: 1, 
                            color: event.status === 'In Progress' ? '#FFC107' : '#9E9E9E' 
                          }} 
                        />
                        <Typography variant="body2" color="text.secondary">
                          <span sx={{ fontWeight: 500, color: 'text.primary' }}>Start:</span> {event.start}
                        </Typography>
                      </Box>

                      {/* 结束时间 */}
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Event 
                          fontSize="small" 
                          sx={{ 
                            mr: 1, 
                            color: event.status === 'In Progress' ? '#FFC107' : '#9E9E9E' 
                          }} 
                        />
                        <Typography variant="body2" color="text.secondary">
                          <span sx={{ fontWeight: 500, color: 'text.primary' }}>End:</span> {event.end}
                        </Typography>
                      </Box>

                      {/* 描述信息 */}
                      {event.description && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mt: 2, 
                            fontStyle: 'italic',
                            pt: 1.5,
                            borderTop: '1px solid #EEEEEE'
                          }}
                        >
                          {event.description}
                        </Typography>
                      )}
                    </CardContent>
                  </StyledEventCard>
                </Grid>
              ))
            ) : (
              <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
                <Box sx={{
                  textAlign: 'center',
                  py: 6,
                  px: 2,
                  borderRadius: 2,
                  backgroundColor: '#f0f0f0ff',
                  color: '#757575'
                }}>
                  <Typography variant="body1">No timeline data</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Please set up the timeline first
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </StyledSemesterCard>
    </Box>
  );
};

export default TimelineView;