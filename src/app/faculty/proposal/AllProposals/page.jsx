'use client';
import React, { useState, useEffect } from "react";
import {
  Box, Typography, Chip, TextField, Button, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { useRouter } from "next/navigation";
import FacultyLayout from "@/components/FacultyLayout";
import { toast } from "react-toastify";
import axios from "axios";

// 状态样式映射（后端返回 status 为小写，统一转为大写显示）
const statusStyle = {
  PENDING: { color: "#9C27B0", bgcolor: "#F3E5F5" },
  APPROVED: { color: "#2E7D32", bgcolor: "#E8F5E9" },
  REJECTED: { color: "#C62828", bgcolor: "#FFEBEE" }
};

export default function AllProposals() {
  const currentPathArr = ['Faculty', 'All proposals'];
  const router = useRouter();

  // 状态管理
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  // 表格列配置（完全适配后端返回字段）
  const columns = [
    { field: "title", headerName: "Title", flex: 1, sortable: true },
    {
      field: "semester_name",
      headerName: "Semester",
      flex: 0.8,
      sortable: true
    },
    { field: "programme_name", headerName: "Programme", flex: 1, sortable: true },
    { field: "professor_name", headerName: "Proposer", flex: 0.8 },
    {
      field: "status",
      headerName: "Status",
      flex: 0.8,
      sortable: true,
      renderCell: (params) => {
        const status = params.value.toUpperCase(); // 转为大写匹配样式映射
        return (
          <Chip
            label={status}
            sx={{
              color: statusStyle[status]?.color,
              bgcolor: statusStyle[status]?.bgcolor,
              fontWeight: 500
            }}
          />
        );
      }
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleViewDetails(params.row)}
          >
            View
          </Button>
          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={() => handleOpenStatusDialog(params.row)}
          >
            Update
          </Button>
        </Box>
      )
    }
  ];

  // 获取提案列表（直接使用后端返回字段，无需转换）
  useEffect(() => {
    const fetchProposals = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/faculty/proposals", {
          params: { search: searchTerm }
        });
        console.log("Backend data:", res.data.data);
        // 直接将后端返回数据赋值给 rows（字段完全匹配）
        setRows(res.data.data);
      } catch (err) {
        toast.error("Failed to load proposals");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProposals();
  }, [searchTerm]);

  // 查看提案详情（适配后端字段展示）
  const handleViewDetails = async (proposal) => {
    try {
      // 调用详情接口获取完整数据（后端返回字段一致）
      const res = await axios.get(`/api/faculty/proposals?id=${proposal.id}`);
      setSelectedProposal(res.data.data);
      setDetailDialogOpen(true);
    } catch (err) {
      toast.error("Failed to load proposal details");
      console.error(err);
    }
  };

  // 打开状态更新弹窗（初始化状态为后端返回的小写值）
  const handleOpenStatusDialog = (proposal) => {
    setSelectedProposal(proposal);
    setNewStatus(proposal.status); // 保持与后端一致的小写格式
    setStatusDialogOpen(true);
  };

  // 处理状态选择（若选择Rejected，打开拒绝理由弹窗）
  const handleStatusChange = (value) => {
    setNewStatus(value);
    if (value === "rejected") { // 与后端保持一致的小写
      setStatusDialogOpen(false);
      setRejectDialogOpen(true);
    }
  };

  // 提交拒绝理由并更新状态（传递小写状态给后端）
  const handleSubmitReject = async () => {
    if (!selectedProposal || !rejectReason.trim()) {
      toast.warning("Rejection reason is required");
      return;
    }
    try {
      await axios.put(`/api/faculty/proposals?id=${selectedProposal.id}`, {
        status: "rejected", // 后端接收小写状态
        reason: rejectReason.trim()
      });
      toast.success("Proposal rejected successfully");
      // 刷新列表（更新本地状态为小写）
      setRows(rows.map(row =>
        row.id === selectedProposal.id ? { ...row, status: "rejected", reason: rejectReason.trim() } : row
      ));
      setRejectDialogOpen(false);
    } catch (err) {
      toast.error("Failed to reject proposal");
      console.error(err);
    }
  };

  // 更新其他状态（Pending/Approved，传递小写状态给后端）
  const handleUpdateStatus = async () => {
    if (!selectedProposal || !newStatus) return;
    try {
      await axios.put(`/api/faculty/proposals?id=${selectedProposal.id}`, {
        status: newStatus, // 保持小写（pending/approved）
        reason: newStatus === "rejected" ? rejectReason : null
      });
      toast.success("Proposal status updated");
      // 刷新列表
      setRows(rows.map(row =>
        row.id === selectedProposal.id ? { ...row, status: newStatus } : row
      ));
      setStatusDialogOpen(false);
    } catch (err) {
      toast.error("Failed to update status");
      console.error(err);
    }
  };

  return (
    <FacultyLayout pathArr={currentPathArr}>
      <Box sx={{ maxWidth: "100%", padding: 3 }}>
        <Typography variant="h5" gutterBottom>All Project Proposals</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Browse all submitted project proposals
        </Typography>

        {/* 角色提示条 */}
        <Chip
          label="Course Coordinator View"
          sx={{ mb: 2, bgcolor: "#EDE7F6", color: "#6A1B9A" }}
          icon={<span>🔑</span>}
        />
        <Typography variant="body2" color="text.secondary" mb={3}>
          You have access to view and manage all proposals in your course.
        </Typography>

        {/* 审核周期提示 */}
        <Chip
          label="Proposal Review Period Active"
          sx={{ mb: 2, bgcolor: "#E3F2FD", color: "#1976D2" }}
          icon={<span>ⓘ</span>}
        />
        <Typography variant="body2" color="text.secondary" mb={3}>
          Proposal review period ends on Tuesday, April 1, 2025 at 12:00:00 AM GMT+8
        </Typography>

        {/* 搜索栏 */}
        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <TextField
            label="Search title..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1, maxWidth: 400 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => setSearchTerm("")}
          >
            Clear Search
          </Button>
        </Box>

        {/* 提案表格 */}
        <Box sx={{ height: 600, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            rowKey="id" // 后端返回 id 作为唯一标识
            slots={{ toolbar: GridToolbar }}
            slotProps={{ toolbar: { showQuickFilter: true } }}
            pagination
            pageSizeOptions={[10, 20, 50]}
            initialState={{ pagination: { pageSize: 10 } }}
            disableRowSelectionOnClick
          />
        </Box>
      </Box>

      <Dialog
  open={detailDialogOpen}
  onClose={() => setDetailDialogOpen(false)}
  maxWidth="sm"
  fullWidth
>
  <DialogTitle sx={{ fontWeight: 600 }}>
    {selectedProposal?.title}
  </DialogTitle>

  <DialogContent sx={{ paddingTop: 2 }}>
    <Typography variant="h6" color="text.secondary" mb={2}>
      Project details and information
    </Typography>

    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

      {/* 第一行：Professor + Programme */}
      <Box sx={{ display: "flex", gap: 4 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" color="text.secondary">Professor</Typography>
          <Typography variant="body1">{selectedProposal?.professor_name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedProposal?.professor_email}
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" color="text.secondary">Programme</Typography>
          <Typography variant="body1">{selectedProposal?.programme_name}</Typography>
        </Box>
      </Box>

      {/* 第二行：Semester + Venue */}
      <Box sx={{ display: "flex", gap: 4 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" color="text.secondary">Semester</Typography>
          <Typography variant="body1">{selectedProposal?.semester_name}</Typography>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" color="text.secondary">Venue</Typography>
          <Typography variant="body1">{selectedProposal?.venue_name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedProposal?.venue_location}
          </Typography>
        </Box>
      </Box>

      {/* 第三行：Dates + Status */}
      <Box sx={{ display: "flex", gap: 4 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" color="text.secondary">Dates</Typography>
          <Typography variant="body1">
            {selectedProposal?.created_at?.split("T")[0]} (Created)<br />
            {selectedProposal?.updated_at?.split("T")[0]} (Updated)
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" color="text.secondary">Status</Typography>
          {(() => {
            const status = selectedProposal?.status?.toUpperCase();
            return (
              <Chip
                label={status}
                sx={{
                  mt: 0.5,
                  color: statusStyle[status]?.color,
                  bgcolor: statusStyle[status]?.bgcolor
                }}
              />
            );
          })()}
        </Box>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Description */}
      <Box>
        <Typography variant="subtitle1" color="text.secondary">Description</Typography>
        <Typography variant="body1" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
          {selectedProposal?.description || "No description provided"}
        </Typography>
      </Box>

      {/* Rejection Reason */}
      {selectedProposal?.status === "rejected" && (
        <Box>
          <Typography variant="subtitle1" color="text.secondary">Rejection Reason</Typography>
          <Typography variant="body1" sx={{ mt: 1, color: "#C62828" }}>
            {selectedProposal?.reason || "No reason provided"}
          </Typography>
        </Box>
      )}

    </Box>
  </DialogContent>

  <DialogActions>
    <Button 
      variant="contained" 
      color="primary" 
      onClick={() => setDetailDialogOpen(false)}
    >
      Close
    </Button>
  </DialogActions>
</Dialog>

      {/* 状态更新弹窗（下拉选项值为小写，与后端一致） */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, textAlign: "center" }}>
          Update Proposal Status
        </DialogTitle>

        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>

          <Typography variant="subtitle1" color="text.secondary">
            Proposal
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {selectedProposal?.title}
          </Typography>

          <TextField
            select
            fullWidth
            label="Status"
            value={newStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            variant="outlined"
          >
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </TextField>

        </DialogContent>

        <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
          <Button
            onClick={() => setStatusDialogOpen(false)}
            variant="outlined"
            color="secondary"
          >
            Cancel
          </Button>

          <Button
            onClick={handleUpdateStatus}
            variant="contained"
            color="primary"
            disabled={newStatus === "rejected"} // 拒绝时禁用，需走理由弹窗
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* 拒绝理由弹窗 */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, textAlign: "center" }}>
          Reject Proposal
        </DialogTitle>

        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>

          <Typography variant="subtitle1" color="text.secondary">
            Proposal
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {selectedProposal?.title}
          </Typography>

          <Typography variant="subtitle1" color="text.secondary">
            Reason for rejection *
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            variant="outlined"
            required
            placeholder="Enter reason for rejection"
          />
        </DialogContent>

        <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
          <Button
            onClick={() => setRejectDialogOpen(false)}
            variant="outlined"
            color="secondary"
          >
            Cancel
          </Button>

          <Button
            onClick={handleSubmitReject}
            variant="contained"
            color="error"
            disabled={!rejectReason.trim()} // 未输入理由时禁用
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </FacultyLayout>
  );
}