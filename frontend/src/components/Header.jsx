import * as React from "react";
import { styled, useTheme } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Badge from "@mui/material/Badge";
import MoreIcon from "@mui/icons-material/MoreVert";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import CalculateIcon from "@mui/icons-material/Calculate";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SettingsIcon from "@mui/icons-material/Settings";
import { useNavigate } from "react-router-dom";

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  alignItems: "center",
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
  "@media all": { minHeight: 64 },
}));

const StyledMenu = styled(Menu)(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: 12,
    marginTop: theme.spacing(1),
    minWidth: 180,
    boxShadow:
      theme.palette.mode === "dark"
        ? "0 4px 20px rgba(0,0,0,0.7)"
        : "0 4px 20px rgba(0,0,0,0.15)",
    "& .MuiMenuItem-root": {
      padding: theme.spacing(1.2, 2),
      borderRadius: 8,
      transition: "background 0.2s ease",
      "&:hover": {
        backgroundColor:
          theme.palette.mode === "dark"
            ? theme.palette.grey[800]
            : theme.palette.grey[100],
      },
    },
  },
}));

export default function ProminentAppBar() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [unreadCount, setUnreadCount] = React.useState(0);

  const token = localStorage.getItem("token");

  const fetchUnreadCount = async () => {
    if (!token) return;
    try {
      const res = await fetch("https://maziwa-90gd.onrender.com/notifications/unread-count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.count !== undefined) setUnreadCount(data.count);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  };

  React.useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // every 30s
    return () => clearInterval(interval);
  }, []);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleNavigation = (path) => {
    navigate(path);
    handleMenuClose();
  };

  const isLoggedIn = Boolean(token);
  const isAdmin = localStorage.getItem("is_admin") === "true";

  const handleLoginLogout = () => {
    if (isLoggedIn) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("is_admin");
      navigate("/login");
    } else {
      navigate("/login");
    }
    handleMenuClose();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="static"
        sx={{
          backgroundColor: "#ffffff",
          color: theme.palette.text.primary,
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <StyledToolbar>
          {/* ✅ Logo */}
          <Box sx={{ mr: 2, display: "flex", alignItems: "center" }}>
            <img
              src="maziwa.jpg"
              alt="Logo"
              style={{ height: 40, cursor: "pointer", borderRadius: "8px" }}
              onClick={() => navigate("/")}
            />
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* ✅ Menu Button */}
          <IconButton size="large" edge="end" color="inherit" onClick={handleMenuOpen}>
            <Badge
              color="error"
              variant={unreadCount > 0 ? "dot" : "standard"}
              badgeContent={unreadCount > 0 ? unreadCount : null}
            >
              <MoreIcon />
            </Badge>
          </IconButton>

          {/* ✅ Dropdown Menu */}
          <StyledMenu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem onClick={() => handleNavigation("/notifications")}>
              <Badge
                color="error"
                badgeContent={unreadCount > 0 ? unreadCount : null}
                sx={{ mr: 1 }}
              >
                <NotificationsIcon fontSize="small" />
              </Badge>
              Notifications
            </MenuItem>

            <MenuItem onClick={() => handleNavigation("/FinanceUtilities")}>
              <CalculateIcon fontSize="small" sx={{ mr: 1 }} />
              Finance Utilities
            </MenuItem>

            {isAdmin && (
              <MenuItem onClick={() => handleNavigation("/admin-dashboard")}>
                <DashboardIcon fontSize="small" sx={{ mr: 1 }} />
                Admin Dashboard
              </MenuItem>
            )}

            <MenuItem onClick={() => handleNavigation("/settings")}>
              <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
              Settings
            </MenuItem>

            <MenuItem onClick={handleLoginLogout}>
              {isLoggedIn ? (
                <>
                  <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Logout
                </>
              ) : (
                <>
                  <LoginIcon fontSize="small" sx={{ mr: 1 }} /> Login
                </>
              )}
            </MenuItem>
          </StyledMenu>
        </StyledToolbar>
      </AppBar>
    </Box>
  );
}