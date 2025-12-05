'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  List, ListItemButton, ListItemIcon, ListItemText,
  Collapse, Drawer, Toolbar, Box, Typography, Divider
} from '@mui/material';
import { ExpandLess, ExpandMore, Logout } from '@mui/icons-material';
import menuConfig from '../lib/menuConfig';
import iconMap from '../styles/iconMap';
import { useRouter } from "next/navigation";
import { toast } from 'react-toastify';

export default function SideNavBar({ role }) {
  const [expandedItemIds, setExpandedItemIds] = useState([]);
  const [pathname, setPathname] = useState('');
  const CourseIcon = iconMap['Course'];
  const router = useRouter();

  // 初始化当前路径
  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  // 处理菜单点击（展开/折叠/跳转）
  const handleClick = useCallback((item) => {
    if (item.children) {
      setExpandedItemIds((prev) =>
        prev.includes(item.title)
          ? prev.filter((id) => id !== item.title)
          : [...prev, item.title]
      );
    } else if (item.path) {
      router.push(item.path);
    } else if (item.action === 'logout') {
      handleLogout(); // 触发退出登录
    }
  }, []);

  // 退出登录逻辑
  const handleLogout = () => {
    try {
      // 清除 LocalStorage 中的用户信息
      localStorage.removeItem('user');
      // 可选：清除其他存储的状态（如 Token、权限等）
      // localStorage.removeItem('token');

      toast.success('Logged out successfully');
      // 跳转登录页（根据实际登录页路径修改）
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  // 渲染菜单（递归处理子菜单）
  const renderMenu = useCallback(
    (items) =>
      items.map((item) => {
        const Icon = item.icon ? iconMap[item.icon] : null;
        const selected = item.path ? pathname.startsWith(item.path) : false;

        return (
          <div key={item.title}>
            <ListItemButton
              onClick={() => handleClick(item)}
              selected={selected}
              sx={{ pl: 2 }}
            >
              {Icon ? (
                <ListItemIcon sx={{ mr: -3 }}>
                  <Icon sx={{ p: 0, m: 0, fontSize: 20 }} />
                </ListItemIcon>
              ) : item.action === 'logout' ? (
                <ListItemIcon sx={{ mr: -3 }}>
                  <Logout sx={{ p: 0, m: 0, fontSize: 20 }} />
                </ListItemIcon>
              ) : null}
              <ListItemText
                primary={item.title}
                primaryTypographyProps={{ fontSize: '0.8rem', color: 'secondary' }}
              />
              {item.children &&
                (expandedItemIds.includes(item.title) ? <ExpandMore /> : <ExpandLess />)}
            </ListItemButton>
            {item.children && (
              <Collapse in={expandedItemIds.includes(item.title)} timeout="auto" unmountOnExit>
                <List component="div" disablePadding sx={{ pl: 4, '& .MuiListItemButton-root': { pt: 0, pb: 0.2 } }}>
                  {renderMenu(item.children)}
                </List>
              </Collapse>
            )}
          </div>
        );
      }),
    [expandedItemIds, handleClick, pathname]
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 250,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: 250, boxSizing: 'border-box' },
      }}
    >
      {/* 顶部 Logo 和标题 */}
      <Box display="flex" alignItems="center" mt={2} mb={2}>
        <CourseIcon sx={{ fontSize: 32, mx: 2, pl: 1 }} />
        <Typography variant="h9" fontWeight={600}>
          EE6008
        </Typography>
      </Box>

      {/* 角色标签 */}
      <Box sx={{ px: 2, mb: 1 }}>
        <Typography variant="caption" fontWeight="bold">
          {role.toUpperCase()}
        </Typography>
      </Box>
      <Divider sx={{ mb: 1 }} />

      {/* 菜单列表 */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%', // 父容器高度必须固定
        }}
      >
        {/* 滚动菜单区域 */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <List>
            {renderMenu(menuConfig[role] || [])}
          </List>
        </Box>

        {/* 退出登录按钮固定底部 */}
        <Box sx={{ p: 1 }}>
          <Divider sx={{ my: 1 }} />
          <ListItemButton
            onClick={handleLogout}
            sx={{ pl: 2, color: '#d32f2f' }}
          >
            <ListItemIcon sx={{ mr: -3 }}>
              <Logout sx={{ fontSize: 20, color: '#d32f2f' }} />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 'bold' }}
            />
          </ListItemButton>
        </Box>
      </Box>
    </Drawer>
  );
}