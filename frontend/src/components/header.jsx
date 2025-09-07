import * as React from "react";
import { styled, useTheme } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MoreIcon from "@mui/icons-material/MoreVert";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import CalculateIcon from "@mui/icons-material/Calculate";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { useNavigate } from "react-router-dom";

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  alignItems: "center",
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
  "@media all": {
    minHeight: 64,
  },
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

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleMenuClose();
  };

  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const isAdmin = localStorage.getItem("is_admin") === "true"; // ✅ check admin

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
          backgroundColor:
            theme.palette.mode === "dark"
              ? theme.palette.background.paper
              : "#ffffff",
          color: theme.palette.text.primary,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 2px 10px rgba(0,0,0,0.7)"
              : "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <StyledToolbar>
          {/* ✅ Company Logo */}
          <Box sx={{ mr: 2, display: "flex", alignItems: "center" }}>
            <img
              src="maziwa.jpg"
              alt="Company Logo"
              style={{ height: 40, cursor: "pointer", borderRadius: "8px" }}
              onClick={() => navigate("/")}
            />
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* ✅ Menu Button */}
          <IconButton
            size="large"
            edge="end"
            color="inherit"
            onClick={handleMenuOpen}
          >
            <MoreIcon />
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
              <NotificationsIcon fontSize="small" sx={{ mr: 1 }} />
              Notifications
            </MenuItem>

            <MenuItem onClick={() => handleNavigation("/FinanceUtilities")}>
              <CalculateIcon fontSize="small" sx={{ mr: 1 }} />
              Finance Utilities
            </MenuItem>

            {/* ✅ Only show for admins */}
            {isAdmin && (
              <MenuItem onClick={() => handleNavigation("/admin-dashboard")}>
                <DashboardIcon fontSize="small" sx={{ mr: 1 }} />
                Admin Dashboard
              </MenuItem>
            )}

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