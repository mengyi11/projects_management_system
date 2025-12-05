'use client';
import React, { useState, useEffect } from "react";
import {
    Box, Typography, Chip, Dialog, DialogTitle, DialogContent,
    DialogActions, Divider, Button
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { useRouter } from "next/navigation";
import FacultyLayout from "@/components/FacultyLayout";
import { toast } from "react-toastify";
import axios from "axios";

// 🔥 从 LocalStorage 获取用户信息
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

// 状态样式映射
const statusStyle = {
    pending: { color: "#4A148C", bgcolor: "#F3E5F5" },
    approved: { color: "#1B5E20", bgcolor: "#E8F5E9" },
    rejected: { color: "#B71C1C", bgcolor: "#FFEBEE" }
};

export default function MyProposals() {
    const currentPathArr = ['Faculty', 'My Project Proposals'];
    const router = useRouter();

    // 状态管理
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null); // 存储当前用户信息

    // 表格列配置（适配后端返回字段）
    const columns = [
        { field: "title", headerName: "Title", flex: 1.5, sortable: true },
        { field: "semester_name", headerName: "Semester", width: 120, sortable: true },
        { field: "programme_name", headerName: "Programme", flex: 1, sortable: true },
        {
            field: "venue",
            headerName: "Venue",
            flex: 1,
            sortable: true,
            valueFormatter: (params) => params.value || "N/A"
        },
        {
            field: "status",
            headerName: "Status",
            width: 120,
            sortable: true,
            renderCell: (params) => {
                const status = params.value.toUpperCase();
                return (
                    <Chip
                        label={status}
                        sx={{
                            color: statusStyle[params.value]?.color,
                            bgcolor: statusStyle[params.value]?.bgcolor,
                            fontWeight: 500
                        }}
                    />
                );
            }
        },
        {
            field: "actions",
            headerName: "",
            width: 100,
            renderCell: (params) => (
                <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleViewDetails(params.row)}
                >
                    View
                </Button>
            )
        }
    ];

    // 初始化：获取用户信息 + 加载提案列表
    useEffect(() => {
        const init = async () => {
            // 1. 获取 LocalStorage 中的用户信息
            const user = getUserInfo();
            if (!user) {
                toast.warning("Please log in first");
                router.push("/"); // 未登录跳转登录页
                return;
            }
            setCurrentUser(user);

            //   // 2. 验证用户是教师（假设 user.role 为 'faculty' 或 2）
            //   if (user.role !== "faculty" && user.role !== 2) {
            //     toast.warning("You are not authorized to view this page");
            //     router.push("/");
            //     return;
            //   }

            // 3. 加载当前教师的提案列表（传入 user.id 给后端）
            try {
                setLoading(true);
                const res = await axios.post("/api/faculty/my-proposals", {
                    user: user // 🔥 传递用户 ID 给后端（user.id 是 users 表的主键）
                });
                setProposals(res.data.data);
            } catch (err) {
                toast.error("Failed to load your proposals");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [router]);

    // 查看提案详情
    const handleViewDetails = async (proposal) => {
        try {
            // 调用详情接口（传入提案 ID 和用户 ID 做权限校验）
            const res = await axios.post(`/api/faculty/proposal-details`, {
                proposal_id: proposal.id,
                user_id: currentUser.id
            });
            setSelectedProposal(res.data.data);
            setDetailDialogOpen(true);
        } catch (err) {
            toast.error("Failed to load proposal details");
            console.error(err);
        }
    };

    return (
        <FacultyLayout pathArr={currentPathArr}>
            <Box sx={{ maxWidth: "100%", padding: 3 }}>
                <Typography variant="h5" gutterBottom>My Project Proposals</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    View and manage your submitted proposals
                </Typography>

                {/* 角色提示条 */}
                <Chip
                    label="Faculty View"
                    sx={{ mb: 2, bgcolor: "#EDE7F6", color: "#6A1B9A" }}
                    icon={<span>🔑</span>}
                />
                <Typography variant="body2" color="text.secondary" mb={3}>
                    You can view all proposals submitted by yourself.
                </Typography>

                {/* 提案列表（DataGrid） */}
                <Box sx={{ height: 600, width: "100%", mt: 2 }}>
                    <DataGrid
                        rows={proposals}
                        columns={columns}
                        loading={loading}
                        rowKey="id"
                        slots={{ toolbar: GridToolbar }}
                        slotProps={{ toolbar: { showQuickFilter: true } }} // 支持搜索
                        pagination
                        pageSizeOptions={[10, 20, 50]}
                        initialState={{ pagination: { pageSize: 10 } }}
                        disableRowSelectionOnClick
                        sx={{ border: 1, borderColor: "#e0e0e0" }}
                    />
                </Box>
            </Box>

            {/* 提案详情弹窗 */}
            <Dialog
                open={detailDialogOpen}
                onClose={() => setDetailDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                sx={{
                    '& .MuiDialog-paper': {
                        borderRadius: 2,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 600, fontSize: "1.2rem" }}>
                    {selectedProposal?.title}
                </DialogTitle>

                <DialogContent sx={{ padding: 3 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

                        {/* Professor + Programme */}
                        <Box sx={{ display: "flex", gap: 4 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" color="text.secondary">Professor</Typography>
                                <Typography variant="body1">{selectedProposal?.professor_name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {selectedProposal?.professor_email}
                                </Typography>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" color="text.secondary">Programme</Typography>
                                <Typography variant="body1">{selectedProposal?.programme_name}</Typography>
                            </Box>
                        </Box>

                        {/* Semester + Venue */}
                        <Box sx={{ display: "flex", gap: 4 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" color="text.secondary">Semester</Typography>
                                <Typography variant="body1">{selectedProposal?.semester_name}</Typography>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" color="text.secondary">Venue</Typography>
                                <Typography variant="body1">{selectedProposal?.venue}</Typography>
                            </Box>
                        </Box>

                        {/* Created + Updated */}
                        <Box sx={{ display: "flex", gap: 4 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" color="text.secondary">Created</Typography>
                                <Typography variant="body1">
                                    {new Date(selectedProposal?.created_at).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric"
                                    })}
                                </Typography>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" color="text.secondary">Updated</Typography>
                                <Typography variant="body1">
                                    {new Date(selectedProposal?.updated_at).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric"
                                    })}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Status */}
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                            <Typography variant="body2" color="text.secondary">Status</Typography>
                            <Chip
                                label={selectedProposal?.status?.toUpperCase()}
                                sx={{
                                    color: statusStyle[selectedProposal?.status]?.color,
                                    bgcolor: statusStyle[selectedProposal?.status]?.bgcolor,
                                    mt: 0.5,
                                    width: "fit-content"
                                }}
                            />

                            {selectedProposal?.status === "rejected" && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="body2" color="text.secondary">Rejection Reason</Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{ color: "#B71C1C", mt: 0.5, whiteSpace: "pre-wrap" }}
                                    >
                                        {selectedProposal?.reason || "No rejection reason provided"}
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        {/* Description */}
                        <Box>
                            <Typography variant="body2" color="text.secondary">Description</Typography>
                            <Typography variant="body1" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
                                {selectedProposal?.description || "No description provided"}
                            </Typography>
                        </Box>

                    </Box>
                </DialogContent>

                <DialogActions sx={{ padding: 2, justifyContent: "center" }}>
                    <Button
                        onClick={() => setDetailDialogOpen(false)}
                        variant="contained"
                        sx={{ bgcolor: "#1A237E", color: "white", px: 4 }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </FacultyLayout>
    );
}