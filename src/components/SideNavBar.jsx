'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { List, ListItemButton, ListItemIcon, ListItemText, Collapse, Drawer, Toolbar, Box, Typography } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import menuConfig from '../lib/menuConfig';
import iconMap from '../lib/iconMap';

export default function SideNavBar({ role }) {
  const [expandedItemIds, setExpandedItemIds] = useState([]);
  const [pathname, setPathname] = useState('');
  const CourseIcon = iconMap['Course'];

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  const handleClick = useCallback((item) => {
    if (item.children) {
      setExpandedItemIds((prev) =>
        prev.includes(item.title)
          ? prev.filter((id) => id !== item.title)
          : [...prev, item.title]
      );
    }
  }, []);

  const renderMenu = useCallback(
    (items) =>
      items.map((item) => {
        const Icon = iconMap[item.icon];
        const selected = item.path ? pathname.startsWith(item.path) : false;

        return (
          <div key={item.title}>
            <ListItemButton onClick={() => handleClick(item)} selected={selected} sx={{ pl: 2 }}>
              {Icon && (
                <ListItemIcon sx={{ mr: -2 }}>
                  <Icon sx={{ p:0,m:0}}/>
                </ListItemIcon>
              )}
              <ListItemText
                primary={item.title}
                primaryTypographyProps={{ fontSize: '0.8rem' }} // font size
              />
              {item.children &&
                (expandedItemIds.includes(item.title) ?  <ExpandMore /> : <ExpandLess /> )}
            </ListItemButton>
            {item.children && (
              <Collapse in={expandedItemIds.includes(item.title)} timeout="auto" unmountOnExit>
                <List component="div" disablePadding sx={{ pl: 5, '& .MuiListItemButton-root': { pt: 0 ,pb: 0.2 } }}>
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

      <Box display="flex" alignItems="center" mt={2} mb={2}>
        <CourseIcon sx={{ fontSize: 32, color: "#673ab7", mx: 2, pl: 1 }} />
        <Typography variant="h9" fontWeight={600}>
          EE6008
        </Typography>
      </Box>


      <div style={{ padding: '0 16px', fontSize: '0.8rem', fontWeight: 'bold' }}>{role}</div>
      <Box sx={{ overflow: 'auto' }}>
        <List>{renderMenu(menuConfig[role] || [])}</List>
      </Box>
    </Drawer>
  );
}
