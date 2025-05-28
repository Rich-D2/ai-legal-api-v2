import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, Container, Box } from '@mui/material';
import { Dashboard, People, Assignment, Gavel } from '@mui/icons-material';

const drawerWidth = 240;

function Layout({ children }) {
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            AI Legal API
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItem button component={Link} to="/customer">
              <ListItemIcon><Dashboard /></ListItemIcon>
              <ListItemText primary="Customer Dashboard" />
            </ListItem>
            <ListItem button component={Link} to="/paralegal">
              <ListItemIcon><People /></ListItemIcon>
              <ListItemText primary="Paralegal Dashboard" />
            </ListItem>
            <ListItem button component={Link} to="/lawyer">
              <ListItemIcon><Gavel /></ListItemIcon>
              <ListItemText primary="Lawyer Dashboard" />
            </ListItem>
            <ListItem button component={Link} to="/admin">
              <ListItemIcon><Assignment /></ListItemIcon>
              <ListItemText primary="Admin Dashboard" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>
    </Box>
  );
}

export default Layout;
