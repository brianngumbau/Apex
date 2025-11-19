import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Avatar,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  CircularProgress,
} from "@mui/material";
import { Delete, Edit, Lock, PhotoCamera } from "@mui/icons-material";
import ProminentAppBar from "../components/header";
import Nav from "../components/Navbar";
import AvatarUpload from "../components/AvatarUpload";

const API_BASE_URL = "https://maziwa-90gd.onrender.com";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [formData, setFormData] = useState({});
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
  });

  const token = localStorage.getItem("token");

  // 🧩 Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
        setFormData(res.data);
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const handleEditSave = async () => {
    try {
      await axios.put(`${API_BASE_URL}/user/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(formData);
      setShowEdit(false);
      alert("✅ Profile updated successfully!");
    } catch (err) {
      console.error("Update failed:", err);
      alert("❌ Failed to update profile.");
    }
  };

  const handlePasswordChange = async () => {
    try {
      await axios.put(`${API_BASE_URL}/change_password`, passwordData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("✅ Password changed successfully!");
      setShowPassword(false);
      setPasswordData({ current_password: "", new_password: "" });
    } catch (err) {
      console.error("Password change failed:", err);
      alert("❌ Failed to change password.");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/user/delete`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("🧾 Account deleted successfully.");
      localStorage.removeItem("token");
      window.location.href = "/";
    } catch (err) {
      console.error("Account deletion failed:", err);
      alert("❌ Could not delete account.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <CircularProgress />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen text-red-600">
        Failed to load profile.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProminentAppBar />
      <motion.div
        className="flex justify-center items-center px-4 py-12"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-3xl shadow-xl rounded-3xl overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col items-center">
              <Avatar
                src={user.profile_photo || ""}
                alt={user.name}
                sx={{ width: 120, height: 120 }}
                className="mb-3 border-4 border-white shadow-lg bg-blue-600 text-white text-3xl"
              >
                {!user.profile_photo && user.name?.charAt(0).toUpperCase()}
              </Avatar>

              <Button
                startIcon={<PhotoCamera />}
                onClick={() => setShowUpload(true)}
                variant="outlined"
                size="small"
              >
                Change Photo
              </Button>

              <Typography variant="h5" className="mt-4 font-bold text-gray-800">
                {user.name}
              </Typography>
              <Typography className="text-gray-500">{user.email}</Typography>
            </div>

            <Divider className="my-6" />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Typography variant="h6" className="font-semibold text-gray-700">
                  Profile Information
                </Typography>
                <Button
                  startIcon={<Edit />}
                  variant="contained"
                  onClick={() => setShowEdit(true)}
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  Edit Info
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 mt-4">
                <Typography>
                  <strong>Name:</strong> {user.name}
                </Typography>
                <Typography>
                  <strong>Phone:</strong> {user.phone}
                </Typography>
                <Typography>
                  <strong>Email:</strong> {user.email}
                </Typography>
              </div>
            </div>

            <Divider className="my-6" />

            <div className="space-y-4">
              <Typography variant="h6" className="font-semibold text-gray-700">
                Security
              </Typography>
              <Button
                startIcon={<Lock />}
                onClick={() => setShowPassword(true)}
                variant="outlined"
              >
                Change Password
              </Button>

              <div className="mt-6 border-t border-red-200 pt-4">
                <Typography variant="h6" className="text-red-500 font-semibold">
                  Danger Zone
                </Typography>
                <Button
                  startIcon={<Delete />}
                  color="error"
                  variant="contained"
                  onClick={() => setShowDelete(true)}
                  className="mt-2"
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 🧩 Modals */}
      {/* Edit Info */}
      <Dialog open={showEdit} onClose={() => setShowEdit(false)}>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent className="space-y-4 mt-2">
          <TextField
            label="Name"
            fullWidth
            value={formData.name || ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            label="Email"
            fullWidth
            value={formData.email || ""}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <TextField
            label="Phone"
            fullWidth
            value={formData.phone || ""}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEdit(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password */}
      <Dialog open={showPassword} onClose={() => setShowPassword(false)}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent className="space-y-4 mt-2">
          <TextField
            label="Current Password"
            type="password"
            fullWidth
            value={passwordData.current_password}
            onChange={(e) =>
              setPasswordData({
                ...passwordData,
                current_password: e.target.value,
              })
            }
          />
          <TextField
            label="New Password"
            type="password"
            fullWidth
            value={passwordData.new_password}
            onChange={(e) =>
              setPasswordData({
                ...passwordData,
                new_password: e.target.value,
              })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPassword(false)}>Cancel</Button>
          <Button onClick={handlePasswordChange} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account */}
      <Dialog open={showDelete} onClose={() => setShowDelete(false)}>
        <DialogTitle className="text-red-600 font-bold">
          Confirm Account Deletion
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete your account? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDelete(false)}>Cancel</Button>
          <Button onClick={handleDeleteAccount} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {showUpload && (
        <AvatarUpload
          onClose={() => setShowUpload(false)}
          onUploaded={(photoUrl) =>
            setUser((prev) => ({ ...prev, profile_photo: photoUrl }))
          }
        />
      )}

      <Nav />
    </div>
  );
}