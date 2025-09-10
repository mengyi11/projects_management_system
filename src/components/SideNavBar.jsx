'use client';

import React, { useState, useCallback } from 'react';
import { List, ListItemButton, ListItemIcon, ListItemText, Collapse, Drawer, Toolbar, Box } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { usePathname } from 'next/navigation';
import menuConfig from '../lib/menuConfig';
import iconMap from '../lib/iconMap';

export default function SideNavBar({ role }) {
  const pathname = usePathname();
  const [expandedItemIds, setExpandedItemIds] = useState([]);

  const handleClick = useCallback((item) => {
    if (item.children) {
      setExpandedItemIds((prev) =>
        prev.includes(item.title) ? prev.filter((id) => id !== item.title) : [...prev, item.title]
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
                <ListItemIcon>
                  <Icon />
                </ListItemIcon>
              )}
              <ListItemText primary={item.title} />
              {item.children && (expandedItemIds.includes(item.title) ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>
            {item.children && (
              <Collapse in={expandedItemIds.includes(item.title)} timeout="auto" unmountOnExit>
                <List component="div" disablePadding sx={{ pl: 7, '& .MuiListItemButton-root': { py: 0.3 } }}>
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
      <Toolbar />
        <div>{role}</div>
      <Box sx={{ overflow: 'auto' }}>
        <List>{renderMenu(menuConfig[role] || [])}</List>
      </Box>
    </Drawer>
  );
}