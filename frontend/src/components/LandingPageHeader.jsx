import * as React from 'react';
import { styled } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreIcon from '@mui/icons-material/MoreVert';
import { useNavigate } from 'react-router-dom';

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  alignItems: 'flex-start',
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(2),
  '@media all': {
    minHeight: 64,
  },
}));

export default function LandingPageAppBar() {
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

  const handleLogin = () => {
    navigate("/login");
    handleMenuClose();
  };

  const handleRegister = () => {
    navigate("/register");
    handleMenuClose();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
    handleMenuClose();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="default" enableColorOnDark>
        <StyledToolbar>
          {/* ✅ Company Logo */}
          <Box sx={{ mr: 2, mt: 0.5 }}>
            <img
              src="maziwa.jpg"
              alt="Company Logo"
              style={{ height: 40, cursor: 'pointer' }}
              onClick={() => navigate("/")}
            />
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* ✅ Menu Button */}
          <IconButton
            size="large"
            aria-label="display more actions"
            edge="end"
            color="inherit"
            onClick={handleMenuOpen}
          >
            <MoreIcon />
          </IconButton>

          {/* ✅ Dropdown Menu Items */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            {isLoggedIn ? (
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            ) : (
              <>
                <MenuItem onClick={handleLogin}>Login</MenuItem>
                <MenuItem onClick={handleRegister}>Register</MenuItem>
              </>
            )}
          </Menu>
        </StyledToolbar>
      </AppBar>
    </Box>
  );
}
