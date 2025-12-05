'use client';
import React, { useState, useEffect } from "react";
import { 
  Box, Typography, TextField, MenuItem, FormControl, InputLabel, Select, 
  Button, Chip, CircularProgress, Alert
} from "@mui/material";
import { useRouter } from "next/navigation";
import FacultyLayout from "@/components/FacultyLayout";
import { toast } from "react-toastify";
import axios from "axios";

// 从本地存储获取用户信息（复用登录时存储的数据）
const getUserInfo = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Failed to get user info:', error);
    return null;
  }
};

export default function AddProposal() {
  // 页面路径配置
  const currentPathArr = ['Faculty', 'All proposals', 'Add proposal'];
  const router = useRouter();
  
  // 表单状态 - 新增 capacity 字段
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    programme_id: "",
    venue_id: "",
    professor_id: "", // 从本地存储获取当前教师ID
    semester_id: "", // 最终选中的活跃学期ID
    capacity: "" // 新增：项目容量（人数限制）
  });
  
  // 下拉选项数据
  const [programmes, setProgrammes] = useState([]);
  const [venues, setVenues] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [isUnauthorized, setIsUnauthorized] = useState(false); // 未登录/非教师标识

  // 初始化：按顺序加载数据（先校验登录状态 → 学期 → 项目 → 场地）
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);

        // 第一步：校验登录状态和用户角色（必须是教师 role_id = 2）
        const user = getUserInfo();
        if (!user) {
          setIsUnauthorized(true);
          toast.error("Please login first");
          setTimeout(() => router.push('/'), 2000); // 2秒后跳转登录页
          return;
        }

        // 第二步：获取所有学期
        const semestersRes = await axios.get("/api/admin/semesters/all");
        const allSemesters = semestersRes.data.data.flat(); // 适配二维数组结构
        setSemesters(allSemesters);

        // 第三步：筛选活跃学期（active 状态为 'active'）
        const activeSemester = allSemesters.find(sem => sem.active === 'active');
        if (!activeSemester) {
          toast.warning("No active semester found, please select a semester manually");
          setFormData(prev => ({ 
            ...prev, 
            semester_id: "",
            professor_id: user.id // 填充当前教师ID
          }));
        } else {
          // 第四步：用活跃学期ID请求对应项目列表
          const programmesRes = await axios.get(`/api/admin/semesters/${activeSemester.id}/programmes`);
          setProgrammes(programmesRes.data.data);

          // 填充活跃学期ID和当前教师ID
          setFormData(prev => ({
            ...prev,
            semester_id: activeSemester.id,
            professor_id: user.id // 从本地存储获取教师ID
          }));
        }

        // 第五步：加载场地列表
        const venuesRes = await axios.get(`/api/admin/venues?semester_id=${activeSemester?.id || ""}`);
        setVenues(venuesRes.data.data);

      } catch (err) {
        toast.error("Failed to load initial data");
        console.error("Data loading error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [router]);

  // 监听学期切换，重新加载对应项目列表（不变）
  useEffect(() => {
    if (formData.semester_id && semesters.length > 0) {
      const fetchProgrammesBySemester = async () => {
        try {
          const programmesRes = await axios.get(`/api/admin/semesters/${formData.semester_id}/programmes`);
          setProgrammes(programmesRes.data.data);
        } catch (err) {
          toast.error("Failed to load programmes for selected semester");
          console.error(err);
          setProgrammes([]);
        }
      };
      fetchProgrammesBySemester();
    }
  }, [formData.semester_id, semesters.length]);

  // 表单输入处理（新增 capacity 字段支持）
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // 容量字段仅允许数字输入
    if (name === "capacity" && value !== "") {
      const numericValue = value.replace(/\D/g, ""); // 过滤非数字字符
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // 表单验证（新增 capacity 校验）
  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim() || formData.title.length < 2) {
      newErrors.title = "Title must be at least 2 characters";
    }
    if (!formData.programme_id) {
      newErrors.programme_id = "Required";
    }
    if (!formData.description.trim() || formData.description.length < 15) {
      newErrors.description = "Description must be at least 15 characters";
    }
    if (!formData.semester_id) {
      newErrors.semester_id = "Please select a semester";
    }
    // 校验 professor_id（防止本地存储数据异常）
    if (!formData.professor_id || isNaN(formData.professor_id)) {
      newErrors.professor_id = "Invalid user information, please re-login";
      toast.error("Invalid user information, please re-login");
      setTimeout(() => router.push('/'), 2000);
    }
    // 新增：容量校验（必填 + 大于0 + 整数）
    if (!formData.capacity) {
      newErrors.capacity = "Capacity is required";
    } else if (parseInt(formData.capacity) <= 0) {
      newErrors.capacity = "Capacity must be greater than 0";
    } else if (!Number.isInteger(parseInt(formData.capacity))) {
      newErrors.capacity = "Capacity must be an integer";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表单（新增 capacity 字段提交）
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const submitData = {
        ...formData,
        status: "pending", // 提案默认状态为待审核
        capacity: parseInt(formData.capacity) // 确保是数字类型提交
      };
      const res = await axios.post("/api/faculty/proposals", submitData);
      if (res.data.ok) {
        toast.success("Proposal created successfully");
        // 重置表单（保留 professor_id 和 semester_id）
        setFormData({
          title: "",
          description: "",
          programme_id: "",
          venue_id: "",
          professor_id: formData.professor_id,
          semester_id: formData.semester_id,
          capacity: "" // 重置容量字段
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create proposal";
      toast.error(msg);
    }
  };

  // 未登录/非教师状态展示
  if (isUnauthorized) {
    return (
      <FacultyLayout pathArr={currentPathArr}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
          <Alert severity="error" sx={{ maxWidth: 400, textAlign: "center" }}>
            Unauthorized access! Please login as faculty.
          </Alert>
        </Box>
      </FacultyLayout>
    );
  }

  // 加载状态展示
  if (isLoading) {
    return (
      <FacultyLayout pathArr={currentPathArr}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
          <CircularProgress />
        </Box>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout pathArr={currentPathArr}>
      <Box sx={{ maxWidth: 800, margin: "0 auto", padding: 3 }}>
        <Typography variant="h5" gutterBottom>Create New Proposal</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Submit a new project proposal
        </Typography>

        {/* 提交期限提示 */}
        <Chip 
          label="Submission Period Active" 
          sx={{ mb: 2, bgcolor: "#e3f2fd", color: "#1976d2" }}
          icon={<span>ⓘ</span>}
        />
        <Typography variant="body2" color="text.secondary" mb={3}>
          Submissions close on Monday, March 31, 2025 at 12:00:00 AM GMT+8
        </Typography>

        <form onSubmit={handleSubmit}>
          {/* 标题 */}
          <TextField
            fullWidth
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
            error={!!errors.title}
            helperText={errors.title}
            inputProps={{ maxLength: 200 }}
          />

          {/* 学期 */}
          <FormControl fullWidth margin="normal" error={!!errors.semester_id}>
            <InputLabel>Semester</InputLabel>
            <Select
              name="semester_id"
              value={formData.semester_id}
              onChange={handleInputChange}
              label="Semester"
              disabled={semesters.length === 0}
            >
              <MenuItem value="" disabled>Select a semester</MenuItem>
              {semesters.map(sem => (
                <MenuItem key={sem.id} value={sem.id}>
                  {sem.name} {sem.active === 'active' ? '(Active)' : ''}
                </MenuItem>
              ))}
            </Select>
            {errors.semester_id && (
              <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                {errors.semester_id}
              </Typography>
            )}
          </FormControl>

          {/* 项目 */}
          <FormControl fullWidth margin="normal" error={!!errors.programme_id}>
            <InputLabel>Programme</InputLabel>
            <Select
              name="programme_id"
              value={formData.programme_id}
              onChange={handleInputChange}
              label="Programme"
              disabled={programmes.length === 0}
            >
              <MenuItem value="" disabled>
                {programmes.length === 0 ? "No programmes available" : "Select a programme"}
              </MenuItem>
              {programmes.map(programme => (
                <MenuItem key={programme.programme_id} value={programme.programme_id}>
                  {programme.name}
                </MenuItem>
              ))}
            </Select>
            {errors.programme_id && (
              <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                {errors.programme_id}
              </Typography>
            )}
          </FormControl>

          {/* 场地 */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Venue</InputLabel>
            <Select
              name="venue_id"
              value={formData.venue_id}
              onChange={handleInputChange}
              label="Venue"
              disabled={venues.length === 0}
            >
              <MenuItem value="" disabled>
                {venues.length === 0 ? "No venues available" : "Select a venue"}
              </MenuItem>
              {venues.map(venue => (
                <MenuItem key={venue.id} value={venue.id}>
                  {venue.name} ({venue.location})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 新增：容量字段 */}
          <TextField
            fullWidth
            label="Capacity"
            name="capacity"
            value={formData.capacity}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
            type="number" // 数字输入框
            inputProps={{ 
              min: 1, // 最小值1
              step: 1, // 步长1
              inputMode: "numeric", // 移动端显示数字键盘
              pattern: "[0-9]*" // 限制仅数字
            }}
            error={!!errors.capacity}
            helperText={errors.capacity || "Maximum number of students for this project"}
          />

          {/* 描述 */}
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
            multiline
            rows={5}
            error={!!errors.description}
            helperText={`${formData.description.length}/1000 ${errors.description || ""}`}
            inputProps={{ maxLength: 1000 }}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            disabled={isLoading || programmes.length === 0 || !formData.semester_id || !formData.professor_id || !formData.capacity}
          >
            Submit
          </Button>
        </form>
      </Box>
    </FacultyLayout>
  );
}