'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { List, ListItemButton, ListItemIcon, ListItemText, Collapse, Drawer, Toolbar, Box, Typography } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import menuConfig from '../lib/menuConfig';
import iconMap from '../styles/iconMap';
import { useRouter } from "next/navigation";

export default function SideNavBar({ role }) {
  const [expandedItemIds, setExpandedItemIds] = useState([]);
  const [pathname, setPathname] = useState('');
  const CourseIcon = iconMap['Course'];
  const router = useRouter();

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  const handleClick = useCallback((item) => {
    if (item.children) {
      setExpandedItemIds((prev) =>
        prev.includes(item.title)
          ? prev.filter((id) => id !== item.title)
          : [...prev, item.title]
      )
    } else if (item.path) {
      router.push(item.path)
    };

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
                <ListItemIcon sx={{ mr: -3 }}>
                  <Icon sx={{ p: 0, m: 0, fontSize: 20 }} />
                </ListItemIcon>
              )}
              <ListItemText
                primary={item.title}
                primaryTypographyProps={{ fontSize: '0.8rem', color: 'secondary' }} // font size
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

      <Box display="flex" alignItems="center" mt={2} mb={2}>
        <CourseIcon sx={{ fontSize: 32, mx: 2, pl: 1 }} />
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

// 'use client';

// import * as React from 'react';
// import { Box, Typography } from '@mui/material';
// import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
// import { TreeItem } from '@mui/x-tree-view/TreeItem';
// import iconMap from '../styles/iconMap';
// import menuConfig from '../lib/menuConfig';
// import { useRouter } from 'next/navigation';

// export default function SideNavBar({ role }) {
//   const router = useRouter();
//   const CourseIcon = iconMap['Course'];

//   const handleClick = (item) => {
//     if (item.path) router.push(item.path);
//   };

//   const renderTree = (items) =>
//     items.map((item) => {
//       const Icon = iconMap[item.icon];
//       return (
//         <TreeItem
//           key={item.title}
//           itemId={item.title}
//           label={
//             <Box display="flex" alignItems="center">
//               {Icon && <Icon sx={{ fontSize: 18, mr: 1 }} />}
//               {item.title}
//             </Box>
//           }
//           onClick={() => handleClick(item)}
//         >
//           {item.children && renderTree(item.children)}
//         </TreeItem>
//       );
//     });

//   return (
//     <Box
//       sx={{
//         width: 250,
//         flexShrink: 0,
//         overflow: 'auto',
//         bgcolor: 'background.paper',
//         p: 2,
//       }}
//     >
//       <Box display="flex" alignItems="center" mb={2}>
//         <CourseIcon sx={{ fontSize: 32, mx: 2 }} />
//         <Typography variant="h6" fontWeight={600}>
//           EE6008
//         </Typography>
//       </Box>

//       <Typography sx={{ fontSize: '0.8rem', fontWeight: 'bold', mb: 1 }}>
//         {role}
//       </Typography>

//       <SimpleTreeView>{renderTree(menuConfig[role] || [])}</SimpleTreeView>
//     </Box>
//   );
// }
