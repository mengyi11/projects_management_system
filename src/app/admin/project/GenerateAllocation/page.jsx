'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Alert,
  Chip, Card, CardContent, Grid, TextField, MenuItem,
  Divider, IconButton, InputAdornment,
  LinearProgress, Fade
} from '@mui/material';
import {
  Download, History, PlayArrow, Check, Search, Refresh,
  FileDownload, AccessTime, FilterList, ArrowUpward, ArrowDownward
} from '@mui/icons-material';
import AdminLayout from '@/components/AdminLayout';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// 自定义颜色主题
const COLORS = {
  primary: '#6A1B9A', // 深紫色
  secondary: '#6B7280',
  success: '#00B42A',
  warning: '#FF7D00',
  danger: '#F53F3F',
  background: '#F9FAFB',
  card: '#FFFFFF',
  border: '#E5E7EB',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  hover: '#F3E5F5' // 浅紫色hover
};

// 渐变色样式
const gradientStyles = {
  primaryGradient: {
    background: 'linear-gradient(135deg, #6A1B9A 0%, #4A148C 100%)', // 深紫色渐变
  },
  cardElevation: {
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    borderRadius: '12px',
    border: `1px solid ${COLORS.border}`,
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
    }
  },
  buttonStyle: {
    borderRadius: '8px',
    textTransform: 'none',
    fontWeight: 500,
    padding: '8px 16px',
    transition: 'all 0.2s ease',
  }
};

// 获取当前活跃学期
const getActiveSemester = async () => {
  try {
    const res = await axios.get('/api/admin/semesters/all');
    const semesters = res.data.data.flat();
    return semesters.find(sem => sem.active === 'active');
  } catch (err) {
    toast.error('Failed to get active semester');
    return null;
  }
};

export default function GenerateAllocation() {
  const currentPathArr = ['Admin', 'Project', 'Generate allocation'];
  const router = useRouter();
  const [activeSemester, setActiveSemester] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [allocationStats, setAllocationStats] = useState(null);
  const [preferenceData, setPreferenceData] = useState([]);
  const [allocationHistory, setAllocationHistory] = useState([]);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [progress, setProgress] = useState(0);
  const searchInputRef = useRef(null);

  // 初始化数据
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      const sem = await getActiveSemester();
      if (!sem) {
        setIsLoading(false);
        return;
      }
      setActiveSemester(sem);

      try {
        const statsRes = await axios.get(`/api/admin/allocation/stats?semester_id=${sem.id}`);
        console.log("statsRes:", statsRes.data.data);
        setAllocationStats(statsRes.data.data);
        setIsActive(statsRes.data.data.is_active);

        // 处理偏好分布数据
        const prefData = statsRes.data.data.preference_distribution || [];
        setPreferenceData(
          prefData.map((count, idx) => ({
            priority: idx + 1,
            count: count || 0
          }))
        );

        // 获取分配历史
        const historyRes = await axios.get(`/api/admin/allocation/history?semester_id=${sem.id}`);
        setAllocationHistory(historyRes.data.data);
      } catch (err) {
        toast.warning('No allocation data found');
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, []);

  // 排序处理
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // 生成分配
  const handleGenerateAllocation = async () => {
    if (!activeSemester) return;
    setIsGenerating(true);
    setProgress(0);
    
    // 模拟进度
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        const diff = Math.random() * 8;
        return Math.min(oldProgress + diff, 100);
      });
    }, 300);

    try {
      const res = await axios.post('/api/admin/allocation/generate', {
        semester_id: activeSemester.id
      });
      toast.success('Allocation generated successfully', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      // 刷新数据
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate allocation', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      clearInterval(timer);
      setProgress(100);
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
      }, 800);
    }
  };

  // 应用历史分配
  const handleApplyHistory = async (allocationId) => {
    try {
      await axios.post(`/api/admin/allocation/apply/${allocationId}`);
      toast.success('Allocation applied successfully');
      setHistoryDialogOpen(false);
      window.location.reload();
    } catch (err) {
      toast.error('Failed to apply allocation');
    }
  };

  // 导出CSV
  const handleExportCSV = async () => {
    if (!activeSemester) return;
    try {
      const res = await axios.get(`/api/admin/allocation/export?semester_id=${activeSemester.id}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `allocation_${activeSemester.name}.csv`);
      document.body.appendChild(link);
      link.click();
      
      // 动画效果
      toast.success('CSV exported successfully', {
        icon: <FileDownload />,
        position: "top-right",
      });
    } catch (err) {
      toast.error('Failed to export CSV');
    }
  };

  // 过滤和排序表格数据
  const getFilteredData = () => {
    if (!allocationStats?.results) return [];
    
    let filtered = allocationStats.results.filter(row => 
      row.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      row.matric_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.project_id.toString().includes(searchTerm)
    );
    
    // 排序
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filtered.slice(0, 10);
  };

  if (isLoading) {
    return (
      <AdminLayout pathArr={currentPathArr}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '500px' }}>
          <CircularProgress sx={{ color: COLORS.primary }} />
        </Box>
      </AdminLayout>
    );
  }

  const filteredData = getFilteredData();

  return (
    <AdminLayout pathArr={currentPathArr}>
      <Box sx={{ 
        maxWidth: 1400, 
        margin: '0 auto', 
        padding: 4,
        bgcolor: COLORS.background,
        minHeight: '100vh'
      }}>
        {/* 页面头部 */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 600, 
            color: COLORS.textPrimary,
            mb: 1 
          }}>
            Project Allocation
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1" color={COLORS.textSecondary}>
              Manage project allocations for {activeSemester?.name || 'current semester'}
            </Typography>
            {isActive && (
              <Chip
                icon={<Check sx={{ fontSize: 14 }} />}
                label="Active Allocation"
                color="success"
                size="small"
                sx={{ 
                  height: 24,
                  bgcolor: 'rgba(0, 180, 42, 0.1)',
                  color: COLORS.success,
                  borderColor: COLORS.success,
                  '& .MuiChip-icon': { color: COLORS.success }
                }}
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        {/* 操作按钮区 */}
        <Card sx={{ 
          ...gradientStyles.cardElevation,
          mb: 4,
          bgcolor: COLORS.card,
          p: 3
        }}>
          <Box sx={{ 
            display: 'flex', 
            gap: 3, 
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                sx={{ 
                  ...gradientStyles.primaryGradient,
                  ...gradientStyles.buttonStyle,
                  minWidth: 180,
                }}
                startIcon={<PlayArrow />}
                onClick={handleGenerateAllocation}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <><CircularProgress size={20} sx={{ color: 'white', mr: 1 }} /> Generating...</>
                ) : (
                  'Generate Allocation'
                )}
              </Button>
              
              <Button
                variant="outlined"
                sx={{ 
                  ...gradientStyles.buttonStyle,
                  borderColor: COLORS.primary,
                  color: COLORS.primary,
                  '&:hover': {
                    bgcolor: COLORS.hover,
                    borderColor: COLORS.primary,
                  }
                }}
                startIcon={<History />}
                onClick={() => setHistoryDialogOpen(true)}
              >
                Allocation History
              </Button>
              
              <Button
                variant="outlined"
                sx={{ 
                  ...gradientStyles.buttonStyle,
                  borderColor: COLORS.primary,
                  color: COLORS.primary,
                  '&:hover': {
                    bgcolor: COLORS.hover,
                    borderColor: COLORS.primary,
                  }
                }}
                startIcon={<Download />}
                onClick={handleExportCSV}
                disabled={!allocationStats}
              >
                Export to CSV
              </Button>
            </Box>
            
            {isGenerating && (
              <Fade in={isGenerating}>
                <Box sx={{ width: '100%', maxWidth: 400, mt: 2 }}>
                  <Typography variant="body2" color={COLORS.textSecondary} sx={{ mb: 1 }}>
                    Generation Progress: {Math.round(progress)}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    sx={{ 
                      bgcolor: COLORS.border,
                      '& .MuiLinearProgress-bar': {
                        bgcolor: COLORS.primary
                      },
                      borderRadius: 1
                    }} 
                  />
                </Box>
              </Fade>
            )}
          </Box>
        </Card>

        {/* 统计卡片区 */}
        <Grid container spacing={4} mb={6}>
          {/* 分配统计 */}
          <Grid item size={{ xs: 12, md: 6, lg: 4 }}>
            <Card sx={{ 
              ...gradientStyles.cardElevation,
              height: '100%',
              bgcolor: COLORS.card,
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    color: COLORS.textPrimary
                  }}>
                    Allocation Statistics
                  </Typography>
                  <IconButton size="small" onClick={() => window.location.reload()}>
                    <Refresh sx={{ color: COLORS.textSecondary }} />
                  </IconButton>
                </Box>
                
                <Divider sx={{ mb: 3, bgcolor: COLORS.border }} />
                
                {allocationStats ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" color={COLORS.textSecondary}>
                        Student Allocation Rate
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: COLORS.primary }}>
                        {allocationStats.allocation_rate}%
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" color={COLORS.textSecondary}>
                        Average Preference Score
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: COLORS.textPrimary }}>
                        {allocationStats.average_preference_score}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" color={COLORS.textSecondary}>
                        Dropped Projects
                      </Typography>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 600, 
                        color: allocationStats.dropped_projects > 0 ? COLORS.warning : COLORS.success 
                      }}>
                        {allocationStats.dropped_projects}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Alert 
                    severity="info" 
                    sx={{ 
                      borderRadius: 2,
                      borderColor: COLORS.border,
                      bgcolor: 'rgba(106, 27, 154, 0.05)'
                    }}
                  >
                    No allocation data available
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* 偏好分布 */}
          <Grid item size={{ xs: 12, md: 6, lg: 8 }}>
            <Card sx={{ 
              ...gradientStyles.cardElevation,
              height: '100%',
              bgcolor: COLORS.card,
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600,
                  color: COLORS.textPrimary,
                  mb: 3
                }}>
                  Preference Distribution
                </Typography>
                
                {preferenceData.length > 0 ? (
                  <Box sx={{ height: 300, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={preferenceData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                      >
                        <XAxis 
                          dataKey="priority" 
                          label={{ 
                            value: 'Preference Priority', 
                            position: 'insideBottom', 
                            offset: -10,
                            style: { fill: COLORS.textSecondary }
                          }}
                          tick={{ fill: COLORS.textSecondary }}
                        />
                        <YAxis 
                          label={{ 
                            value: 'Number of Students', 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { fill: COLORS.textSecondary }
                          }}
                          tick={{ fill: COLORS.textSecondary }}
                        />
                        <Tooltip 
                          formatter={(value) => [`${value} students`, 'Count']}
                          contentStyle={{
                            borderRadius: 8,
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            border: 'none'
                          }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {preferenceData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={`rgba(106, 27, 154, ${0.7 + (index * 0.1)})`} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Alert 
                    severity="info" 
                    sx={{ 
                      borderRadius: 2,
                      borderColor: COLORS.border,
                      bgcolor: 'rgba(106, 27, 154, 0.05)',
                      height: 300,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    No preference data available. Generate allocation to see distribution.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 分配结果表格 */}
        <Card sx={{ 
          ...gradientStyles.cardElevation,
          bgcolor: COLORS.card,
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 600,
                color: COLORS.textPrimary
              }}>
                Allocation Results
              </Typography>
              
              <TextField
                label="Search by name or ID..."
                variant="outlined"
                size="small"
                sx={{ 
                  width: { xs: '100%', sm: 300 },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: COLORS.border,
                    },
                    '&:hover fieldset': {
                      borderColor: COLORS.primary,
                    },
                  }
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: COLORS.textSecondary }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton 
                        size="small" 
                        onClick={() => setSearchTerm('')}
                        sx={{ color: COLORS.textSecondary }}
                      >
                        <FilterList />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                inputRef={searchInputRef}
              />
            </Box>
            
            {allocationStats ? (
              <TableContainer 
                component={Paper} 
                sx={{ 
                  maxHeight: 500,
                  borderRadius: 2,
                  boxShadow: 'none',
                  border: `1px solid ${COLORS.border}`
                }}
              >
                <Table stickyHeader>
                  <TableHead sx={{ bgcolor: COLORS.background }}>
                    <TableRow>
                      {[
                        { key: 'matric_no', label: 'Matric No.' },
                        { key: 'student_name', label: 'Student Name' },
                        { key: 'project_id', label: 'Project ID' },
                        { key: 'priority', label: 'Priority' }
                      ].map((column) => (
                        <TableCell 
                          key={column.key}
                          sx={{ 
                            fontWeight: 600,
                            color: COLORS.textPrimary,
                            borderBottom: `1px solid ${COLORS.border}`,
                            '&:hover': {
                              cursor: 'pointer',
                              color: COLORS.primary
                            }
                          }}
                          onClick={() => requestSort(column.key)}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {column.label}
                            {sortConfig.key === column.key && (
                              sortConfig.direction === 'ascending' ? 
                                <ArrowUpward sx={{ fontSize: 16, color: COLORS.primary }} /> : 
                                <ArrowDownward sx={{ fontSize: 16, color: COLORS.primary }} />
                            )}
                          </Box>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredData.length > 0 ? (
                      filteredData.map((row, index) => (
                        <TableRow 
                          key={row.matric_no}
                          sx={{ 
                            '&:nth-of-type(even)': {
                              bgcolor: COLORS.background,
                            },
                            '&:hover': {
                              bgcolor: COLORS.hover,
                              cursor: 'pointer'
                            },
                            transition: 'background-color 0.2s ease'
                          }}
                        >
                          <TableCell sx={{ 
                            borderBottom: `1px solid ${COLORS.border}`,
                            color: COLORS.textPrimary,
                            fontWeight: index === 0 ? 500 : 400
                          }}>
                            {row.matric_no}
                          </TableCell>
                          <TableCell sx={{ 
                            borderBottom: `1px solid ${COLORS.border}`,
                            color: COLORS.textPrimary
                          }}>
                            {row.student_name}
                          </TableCell>
                          <TableCell sx={{ 
                            borderBottom: `1px solid ${COLORS.border}`,
                            color: COLORS.textPrimary
                          }}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {row.project_id}
                              </Typography>
                              <Typography variant="caption" color={COLORS.textSecondary}>
                                {row.project_title?.substring(0, 30)}
                                {row.project_title?.length > 30 && '...'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ 
                            borderBottom: `1px solid ${COLORS.border}`,
                            color: COLORS.textPrimary
                          }}>
                            <Chip 
                              label={`#${row.priority}`} 
                              size="small" 
                              sx={{
                                bgcolor: row.priority === 1 ? 'rgba(0, 180, 42, 0.1)' : 
                                         row.priority === 2 ? 'rgba(255, 125, 0, 0.1)' : 
                                         'rgba(245, 63, 63, 0.1)',
                                color: row.priority === 1 ? COLORS.success : 
                                       row.priority === 2 ? COLORS.warning : 
                                       COLORS.danger,
                                borderColor: row.priority === 1 ? COLORS.success : 
                                            row.priority === 2 ? COLORS.warning : 
                                            COLORS.danger,
                                '& .MuiChip-label': { fontWeight: 500 }
                              }}
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell 
                          colSpan={4} 
                          align="center"
                          sx={{ 
                            py: 4,
                            color: COLORS.textSecondary,
                            borderBottom: 'none'
                          }}
                        >
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <Search sx={{ fontSize: 40, color: COLORS.border }} />
                            <Typography variant="body1">No results found</Typography>
                            <Typography variant="body2" color={COLORS.textSecondary}>
                              Try adjusting your search criteria or generate a new allocation
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert 
                severity="info" 
                sx={{ 
                  borderRadius: 2,
                  borderColor: COLORS.border,
                  bgcolor: 'rgba(106, 27, 154, 0.05)',
                  py: 6
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <PlayArrow sx={{ fontSize: 40, color: COLORS.primary, mb: 2 }} />
                  <Typography variant="h6" sx={{ color: COLORS.textPrimary }}>
                    Generate Allocation to View Results
                  </Typography>
                  <Typography variant="body1" color={COLORS.textSecondary} align="center">
                    Click the "Generate Allocation" button to create project allocations 
                    based on student preferences and project availability.
                  </Typography>
                </Box>
              </Alert>
            )}
            
            {filteredData.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color={COLORS.textSecondary}>
                  Showing {filteredData.length} of {allocationStats.results?.length || 0} results
                </Typography>
                <Button 
                  variant="text" 
                  sx={{ 
                    color: COLORS.primary,
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: COLORS.hover,
                    }
                  }}
                  onClick={() => {
                    // 实现加载更多逻辑
                    toast.info('This would load more results in a full implementation');
                  }}
                >
                  Load More
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* 分配历史弹窗 */}
      <Dialog 
        open={historyDialogOpen} 
        onClose={() => setHistoryDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            ...gradientStyles.cardElevation,
            maxHeight: '90vh',
            overflow: 'auto'
          }
        }}
      >
        <DialogTitle sx={{ 
          p: 3, 
          borderBottom: `1px solid ${COLORS.border}`,
          fontWeight: 600,
          color: COLORS.textPrimary
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Allocation History
            <Typography variant="body2" color={COLORS.textSecondary}>
              {activeSemester?.name}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" color={COLORS.textSecondary} gutterBottom>
            View and restore previous allocation generations for this semester.
          </Typography>
          
          <TableContainer 
            component={Paper} 
            sx={{ 
              maxHeight: 500,
              borderRadius: 2,
              boxShadow: 'none',
              border: `1px solid ${COLORS.border}`,
              mt: 2
            }}
          >
            <Table>
              <TableHead sx={{ bgcolor: COLORS.background }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: COLORS.textPrimary }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: COLORS.textPrimary }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTime sx={{ fontSize: 16 }} />
                      Timestamp
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: COLORS.textPrimary }}>Allocation Rate</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: COLORS.textPrimary }}>Dropped Projects</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: COLORS.textPrimary }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allocationHistory.length > 0 ? (
                  allocationHistory.map((item) => (
                    <TableRow 
                      key={item.id}
                      sx={{ 
                        '&:nth-of-type(even)': { bgcolor: COLORS.background },
                        '&:hover': { bgcolor: COLORS.hover }
                      }}
                    >
                      <TableCell sx={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        <Typography sx={{ fontWeight: 500 }}>#{item.id}</Typography>
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        <Typography variant="body2">
                          {new Date(item.timestamp).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color={COLORS.textSecondary}>
                          {new Date(item.timestamp).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        <Typography sx={{ 
                          fontWeight: 500,
                          color: item.allocation_rate > 90 ? COLORS.success : 
                                 item.allocation_rate > 70 ? COLORS.warning : COLORS.danger
                        }}>
                          {item.allocation_rate}%
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        <Chip 
                          label={item.dropped_projects} 
                          size="small" 
                          sx={{
                            bgcolor: item.dropped_projects === 0 ? 'rgba(0, 180, 42, 0.1)' : 'rgba(245, 63, 63, 0.1)',
                            color: item.dropped_projects === 0 ? COLORS.success : COLORS.danger,
                          }}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{ 
                            ...gradientStyles.buttonStyle,
                            bgcolor: COLORS.primary,
                            '&:hover': { bgcolor: '#4A148C' }
                          }}
                          onClick={() => handleApplyHistory(item.id)}
                        >
                          Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: COLORS.textSecondary }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <History sx={{ fontSize: 40, color: COLORS.border }} />
                        <Typography variant="body1">No allocation history found</Typography>
                        <Typography variant="body2" color={COLORS.textSecondary}>
                          Generate an allocation to create history records
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${COLORS.border}` }}>
          <Button 
            onClick={() => setHistoryDialogOpen(false)}
            sx={{ 
              ...gradientStyles.buttonStyle,
              color: COLORS.textSecondary
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}