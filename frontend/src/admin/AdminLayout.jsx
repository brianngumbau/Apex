
import React, { useState } from "react";
import { AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemText } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Outlet, useNavigate } from "react-router-dom";

export default function AdminLayout() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  const menuItems = [
    { text: "Dashboard", path: "/admin" },
    { text: "Users", path: "/admin/users" },
    { text: "Notifications", path: "/admin/notifications" },
    { text: "Streak Settings", path: "/admin/streak" },
    { text: "Budget Allocation", path: "/admin/budget" },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Drawer variant="persistent" anchor="left" open={open}>
        <div className="w-64 bg-white h-full shadow-lg">
          <Typography variant="h6" className="p-4">Admin Panel</Typography>
          <List>
            {menuItems.map((item) => (
              <ListItem button key={item.text} onClick={() => navigate(item.path)}>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </div>
      </Drawer>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Top Navbar */}
        <AppBar position="static" color="primary" className="shadow-md">
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => setOpen(!open)}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6">Finance Admin</Typography>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet /> {/* Where child pages render */}
        </main>
      </div>
    </div>
  );
}
