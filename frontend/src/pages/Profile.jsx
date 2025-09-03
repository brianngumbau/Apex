import React, { useEffect, useState } from "react";
import axios from "axios";
import { Avatar, Card, CardContent, Typography, CircularProgress, Box, Paper, Grid, Icon } from "@mui/material";
import { Email, Phone, Person } from "@mui/icons-material";
import Nav from "../components/Navbar";
import ProminentAppBar from "../components/header";

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setError("Authentication token not found. Please log in.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get("http://127.0.0.1:5000/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data);
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        setError("Failed to load profile. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <ProminentAppBar />
      <Box className="flex items-center justify-center p-4">
        <Paper elevation={6} className="w-full max-w-2xl rounded-2xl overflow-hidden mt-10">
          <Box
            className="h-48 bg-cover bg-center"
            style={{ backgroundImage: "url('https://source.unsplash.com/random/800x600?nature')" }}
          />
          <Grid container direction="column" alignItems="center" className="p-6 relative">
            <Avatar
              alt={user.name}
              sx={{
                width: 120,
                height: 120,
                marginTop: "-80px",
                border: "4px solid white",
                fontSize: "2.5rem",
              }}
              className="bg-blue-600 text-white shadow-lg"
            >
              {user.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="h4" component="h1" className="font-bold mt-4">
              {user.name}
            </Typography>
            <Typography variant="body1" color="textSecondary" className="mt-1">
              {user.email || "No email provided"}
            </Typography>
          </Grid>
          <CardContent className="p-6 border-t border-gray-200">
            <Typography variant="h6" className="font-semibold mb-4 text-gray-700">
              User Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} className="flex items-center">
                <Icon className="mr-3 text-gray-500"><Person /></Icon>
                <Typography variant="body1">
                  <strong>Name:</strong> {user.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} className="flex items-center">
                <Icon className="mr-3 text-gray-500"><Phone /></Icon>
                <Typography variant="body1">
                  <strong>Phone:</strong> {user.phone}
                </Typography>
              </Grid>
              <Grid item xs={12} className="flex items-center">
                <Icon className="mr-3 text-gray-500"><Email /></Icon>
                <Typography variant="body1">
                  <strong>Email:</strong> {user.email || "Not available"}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Paper>
      </Box>
      <Nav />
    </div>
  );
}

export default Profile;