import * as React from 'react';
import { styled } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreIcon from '@mui/icons-material/MoreVert';
import { useNavigate } from 'react-router-dom';

// 👇 Replace with your actual logo import or image URL
// import CompanyLogo from '../assets/logo.png'; // or use a public path

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  alignItems: 'flex-start',
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(2),
  '@media all': {
    minHeight: 64,
  },
}));

export default function ProminentAppBar() {
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

  const isLoggedIn = Boolean(localStorage.getItem("token")); // adjust if using context

  const handleLoginLogout = () => {
    if (isLoggedIn) {
      localStorage.removeItem("token");
      navigate("/login");
    } else {
      navigate("/login");
    }
    handleMenuClose();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="default" enableColorOnDark>
        <StyledToolbar>
          {/* ✅ Company Logo */}
          <Box sx={{ mr: 2, mt: 0.5 }}>
            <img
              src="cj2.jpg" // Replace with your logo path
              alt="Company Logo"
              style={{ height: 40, cursor: 'pointer' }}
              onClick={() => navigate("/")}
            />
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* ✅ Menu Icon */}
          <IconButton
            size="large"
            aria-label="display more actions"
            edge="end"
            color="inherit"
            onClick={handleMenuOpen}
          >
            <MoreIcon />
          </IconButton>

          {/* ✅ Dropdown Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={() => handleNavigation("/notifications")}>
              Notifications
            </MenuItem>
            <MenuItem onClick={() => handleNavigation("/contribute")}>
              Contribute
            </MenuItem>
            <MenuItem onClick={() => handleNavigation("/borrow")}>
              Borrow Funds
            </MenuItem>
            <MenuItem onClick={() => handleNavigation("/repay")}>
              Repay Loan
            </MenuItem>
            <MenuItem onClick={handleLoginLogout}>
              {isLoggedIn ? "Logout" : "Login"}
            </MenuItem>
          </Menu>
        </StyledToolbar>
      </AppBar>
    </Box>
  );
}
