import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Nav from "../components/Navbar";
import ProminentAppBar from "../components/header";

function Settings({ toggleTheme, isDarkMode }) {
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const token = localStorage.getItem("token");

  // ✅ Handle Delete Account
  const handleDelete = async () => {
    try {
      setDeleting(true);
      await axios.delete("https://maziwa-90gd.onrender.com/user/delete", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // clear storage + redirect
      localStorage.clear();
      navigate("/login");
    } catch (error) {
      console.error("Account deletion failed:", error);
      alert("Failed to delete account. Try again later.");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <>
      <ProminentAppBar />
    
    <Box className="p-6 bg-gray-100 min-h-screen flex justify-center items-start">
      <Paper elevation={4} className="p-6 w-full max-w-lg rounded-xl">
        <Typography variant="h5" gutterBottom>
          Settings ⚙️
        </Typography>

        {/* ✅ Dark Mode Toggle */}
        <FormControlLabel
          control={
            <Switch
              checked={isDarkMode}
              onChange={toggleTheme}
              color="primary"
            />
          }
          label="Dark Mode"
        />

        {/* ✅ Delete Account */}
        <Box mt={4}>
          
          <Button
            variant="contained"
            color="error"
            onClick={() => setDeleteOpen(true)}
          >
            Delete Account
          </Button>
        </Box>
      </Paper>

      {/* ✅ Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Confirm Account Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete your account? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={24} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    <Nav />
    </>
  );
}

export default Settings;
