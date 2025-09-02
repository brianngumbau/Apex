import React, { useEffect, useState } from "react";
import axios from "axios";
import { Avatar, Card, CardContent, Typography, CircularProgress } from "@mui/material";

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:5000/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data);
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <CircularProgress />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Typography variant="h6" color="error">
          Failed to load profile.
        </Typography>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-6">
      <Card className="w-full max-w-md shadow-lg rounded-2xl">
        <CardContent className="flex flex-col items-center space-y-4">
          {/* Avatar */}
          <Avatar
            alt={user.name}
            sx={{ width: 80, height: 80 }}
            className="bg-blue-500 text-white text-xl"
          >
            {user.name?.charAt(0).toUpperCase()}
          </Avatar>

          {/* User Info */}
          <Typography variant="h6" className="font-bold">
            {user.name}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            📞 {user.phone}
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
}

export default Profile;
