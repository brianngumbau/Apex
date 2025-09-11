import React, { useState } from "react"; // Corrected this line
import { useNavigate } from "react-router-dom";
import { Button, TextField, CircularProgress, Alert, Box, Paper, Typography } from "@mui/material";
import { GroupAdd, Lock } from "@mui/icons-material";
import ProminentAppBar from "../components/header";
import Nav from "../components/Navbar";

const BACKEND_URL = "https://maziwa-90gd.onrender.com";

export default function CreateGroupPage() {
  const [groupName, setGroupName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const handleCreateGroup = async (event) => {
    event.preventDefault(); // Prevent default form submission
    setMessage("");
    setError("");

    if (!groupName.trim()) {
      setError("Group name is required.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/group/create`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ group_name: groupName }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create group");
      }

      setMessage(data.message || "Group created successfully!");
      setGroupName("");

      // Redirect to the group dashboard after a short delay
      setTimeout(() => navigate("/group"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <ProminentAppBar />
        <Box className="flex-grow flex items-center justify-center p-4">
          <Paper elevation={3} className="p-8 text-center max-w-md w-full">
            <Lock className="text-red-500 mx-auto" style={{ fontSize: 60 }} />
            <Typography variant="h5" component="h1" className="mt-4 font-semibold">
              Access Denied
            </Typography>
            <Typography color="textSecondary" className="my-4">
              You must be logged in to create a new group.
            </Typography>
          </Paper>
        </Box>
        <Nav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProminentAppBar />
      <Box className="flex items-center justify-center p-4 mt-10">
        <Paper elevation={6} className="w-full max-w-lg p-8 rounded-2xl">
          <Box className="text-center">
            <GroupAdd className="mx-auto text-gray-700" style={{ fontSize: 50 }} />
            <Typography variant="h4" component="h1" className="font-bold mt-2">
              Create a New Group
            </Typography>
            <Typography color="textSecondary" className="mb-6">
              Start by giving your new group a name.
            </Typography>
          </Box>

          <form onSubmit={handleCreateGroup} className="space-y-6">
            {message && <Alert severity="success">{message}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Group Name"
              variant="outlined"
              fullWidth
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., 'Project Innovate Team'"
              disabled={isLoading}
            />

            <Box sx={{ position: 'relative' }}>
     git pu         <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isLoading}
                sx={{
                  padding: '12px',
                  backgroundColor: 'black',
                  color: 'white',
                  '&:hover': { backgroundColor: '#333' },
                  '&:disabled': {
                    backgroundColor: 'grey.300'
                  }
                }}
              >
                {isLoading ? 'Creating...' : 'Create Group'}
              </Button>
              {isLoading && (
                <CircularProgress
                  size={24}
                  sx={{
                    color: 'primary.main',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    marginTop: '-12px',
                    marginLeft: '-12px',
                  }}
                />
              )}
            </Box>
          </form>
        </Paper>
      </Box>
      <Nav />
    </div>
  );
}