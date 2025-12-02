'use client';
import { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, InputLabel, Select,
  MenuItem, TextField, IconButton, Tooltip
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

/**
 * 课程项目管理组件
 * @param {string} semId - 当前学期ID（从URL获取）
 */
const ProgramView = ({ semId }) => {
  const [programmes, setProgrammes] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [currentProgram, setCurrentProgram] = useState(null);
  // 新增：暂存选中的负责人ID（用于分配模态框）
  const [selectedProfId, setSelectedProfId] = useState('');
  const [newProgram, setNewProgram] = useState({
    name: '',
    programme_code: '',
    coordinator_professor_id: '',
    semester_id: semId
  });

  // 页面加载时获取数据
  useEffect(() => {
    if (semId) {
      fetchProgrammes();
      fetchProfessors();
    }
  }, [semId]);

  // 打开分配负责人模态框时，初始化选中的负责人ID
  const handleOpenAssignModal = (programme) => {
    setCurrentProgram(programme);
    // 初始值设为当前项目的负责人ID（回显已选值）
    setSelectedProfId(programme.coordinator_professor_id || '');
    setAssignModalOpen(true);
  };

  // 1. 获取当前学期的项目列表
  const fetchProgrammes = async () => {
    try {
      const response = await axios.get(`/api/admin/semesters/${semId}/programmes`);
      const validData = Array.isArray(response.data.data) ? response.data.data : [];
      setProgrammes(validData);
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to load programmes';
      toast.error(msg);
      console.error('Fetch programmes error:', error);
      setProgrammes([]);
    }
  };

  // 2. 获取所有教授
  const fetchProfessors = async () => {
    try {
      const response = await axios.get('/api/admin/user/faculty');
      const validData = Array.isArray(response.data.data) ? response.data.data : [];
      setProfessors(validData);
      console.log('Fetched professors:', validData);
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to load professors';
      toast.error(msg);
      console.error('Fetch professors error:', error);
      setProfessors([]);
    }
  };

  // 3. 新建项目
  const handleCreateProgram = async () => {
    if (!newProgram.name || !newProgram.programme_code || !newProgram.coordinator_professor_id) {
      toast.warning('Please fill in all required fields');
      return;
    }

    try {
      await axios.post(`/api/admin/semesters/${semId}/programmes`, newProgram);
      setAddModalOpen(false);
      fetchProgrammes();
      toast.success('Programme created successfully');
      setNewProgram({
        name: '',
        programme_code: '',
        coordinator_professor_id: '',
        semester_id: semId
      });
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to create programme';
      toast.error(msg);
      console.error('Create programme error:', error);
    }
  };

  // 4. 点击 Save 时，提交负责人更新（核心修改）
  const handleSaveCoordinator = async () => {
    // 校验：确保选择了负责人
    if (!selectedProfId) {
      toast.warning('Please select a professor');
      return;
    }
    // 校验：确保当前项目存在
    if (!currentProgram) return;

    try {
      await axios.put(`/api/admin/semesters/${semId}/programmes`, {
        coordinator_professor_id: selectedProfId,
        programme_id: currentProgram.programme_id
      });
      setAssignModalOpen(false);
      fetchProgrammes(); // 刷新列表，展示更新后的负责人
      toast.success('Coordinator updated successfully');
      // 重置暂存的选中值
      setSelectedProfId('');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update coordinator';
      toast.error(msg);
      console.error('Update coordinator error:', error);
    }
  };

  // 5. 删除项目
  const handleDeleteProgram = async (programmeId) => {
    if (!window.confirm('Are you sure you want to delete this programme?')) return;

    try {
      await axios.delete(`/api/admin/semesters/${semId}/programmes`, {
        params: { programme_id: programmeId }
      });
      fetchProgrammes();
      toast.success('Programme deleted successfully');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to delete programme';
      toast.error(msg);
      console.error('Delete programme error:', error);
    }
  };

  // 6. 手动刷新数据
  const handleRefresh = () => {
    fetchProgrammes();
    fetchProfessors();
    toast.info('Data refreshed');
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* 顶部操作栏 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          Programmes Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefresh} sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setAddModalOpen(true)}
          >
            Add New Programme
          </Button>
        </Box>
      </Box>

      {/* 项目列表表格 */}
      <TableContainer component={Paper} sx={{ borderRadius: 1, boxShadow: 1 }}>
        <Table sx={{ minWidth: 650 }} aria-label="programmes table">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Programme Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Programme Code</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Coordinator</TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {programmes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4, color: '#757575' }}>
                  No programmes found for this semester. Click "Add New Programme" to create one.
                </TableCell>
              </TableRow>
            ) : (
              programmes.map((programme) => (
                <TableRow key={programme.programme_id} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                  <TableCell>{programme.name}</TableCell>
                  <TableCell>{programme.programme_code}</TableCell>
                  <TableCell>
                    {programme.coordinator_professor_name || 'Unassigned'}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleOpenAssignModal(programme)}
                      sx={{ mr: 1 }}
                    >
                      Assign Coordinator
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteProgram(programme.programme_id)}
                      aria-label="delete programme"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 1. 添加项目模态框 */}
      <Dialog
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Programme</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <TextField
              label="Programme Name"
              fullWidth
              required
              value={newProgram.name}
              onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
              variant="outlined"
            />
            <TextField
              label="Programme Code"
              fullWidth
              required
              value={newProgram.programme_code}
              onChange={(e) => setNewProgram({ ...newProgram, programme_code: e.target.value })}
              variant="outlined"
              placeholder="e.g. CS-2025-S1"
            />
            <FormControl fullWidth required variant="outlined">
              <InputLabel>Coordinator Professor</InputLabel>
              <Select
                value={newProgram.coordinator_professor_id}
                onChange={(e) => setNewProgram({ ...newProgram, coordinator_professor_id: e.target.value })}
                label="Coordinator Professor"
              >
                {professors.map((prof) => (
                  <MenuItem key={prof.id} value={prof.id}>
                    {prof.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ pr: 3, pb: 2 }}>
          <Button onClick={() => setAddModalOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleCreateProgram}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2. 分配负责人模态框（核心修改） */}
      <Dialog
        open={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setSelectedProfId(''); // 关闭时重置暂存值
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Assign Coordinator: {currentProgram?.name || 'Programme'}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth required variant="outlined" sx={{ mt: 1 }}>
            <InputLabel>Select Professor</InputLabel>
            <Select
              // 绑定到暂存的 selectedProfId（而非直接绑定到currentProgram）
              value={selectedProfId}
              // 仅更新暂存值，不触发接口请求
              onChange={(e) => setSelectedProfId(e.target.value)}
              label="Select Professor"
            >
              {professors.map((prof) => (
                <MenuItem key={prof.id} value={prof.id}>
                  {prof.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ pr: 3, pb: 2 }}>
          <Button onClick={() => {
            setAssignModalOpen(false);
            setSelectedProfId(''); // 取消时重置暂存值
          }}>
            Cancel
          </Button>
          {/* 点击 Save 时，调用提交接口的方法 */}
          <Button variant="contained" color="primary" onClick={handleSaveCoordinator}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProgramView;