import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Snackbar from "@mui/material/Snackbar";
import {
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Notifications as NotificationsIcon,
  DoneAll as DoneAllIcon,
} from "@mui/icons-material";
import { CircularProgress, Button } from "@mui/material";
import Nav from "../components/Navbar";
import ProminentAppBar from "../components/Header";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "https://maziwa-90gd.onrender.com";

const getNotificationIcon = (type) => {
  switch (type) {
    case "join_request":
      return <PersonAddIcon className="text-blue-500" fontSize="large" />;
    default:
      return <InfoIcon className="text-gray-500" fontSize="large" />;
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const token = localStorage.getItem("token");
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/notifications`, {
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to fetch notifications");
      setNotifications(data.notifications || data);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchNotifications();
    else {
      setMessage("You must be logged in to view notifications.");
      setIsLoading(false);
    }
  }, [token]);

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch(`${BACKEND_URL}/notifications/mark-all-read`, {
        method: "PUT",
        headers: authHeaders,
      });
      await fetchNotifications();
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  // ✅ NEW: Mark individual notification as read
  const markAsRead = async (id) => {
    try {
      await fetch(`${BACKEND_URL}/notifications/${id}/mark-read`, {
        method: "PUT",
        headers: authHeaders,
      });
      // Instantly update UI without reloading
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  // Handle join request actions
  const handleRequest = async (requestId, action) => {
    try {
      const res = await fetch(`${BACKEND_URL}/group/join/${requestId}`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action} request`);
      fetchNotifications();
      setMessage(data.message);
    } catch (err) {
      setMessage(err.message);
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "read") return n.is_read;
    return true;
  });

  // Group notifications by date
  const grouped = filteredNotifications.reduce((acc, note) => {
    const dateKey = new Date(note.date).toLocaleDateString("en-KE", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    acc[dateKey] = acc[dateKey] || [];
    acc[dateKey].push(note);
    return acc;
  }, {});

  // Count summaries
  const counts = {
    all: notifications.length,
    unread: notifications.filter((n) => !n.is_read).length,
    read: notifications.filter((n) => n.is_read).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ProminentAppBar />

      <main className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between mb-10">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl font-extrabold text-gray-900 flex items-center justify-center sm:justify-start">
              <NotificationsIcon className="mr-3" fontSize="large" />
              Notifications
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Stay up-to-date with all your latest updates and requests.
            </p>
          </div>

          <Button
            onClick={markAllAsRead}
            variant="contained"
            color="primary"
            startIcon={<DoneAllIcon />}
            sx={{
              mt: { xs: 4, sm: 0 },
              backgroundColor: "#2563eb",
              textTransform: "none",
              borderRadius: "12px",
              "&:hover": { backgroundColor: "#1e40af" },
            }}
          >
            Mark all as read
          </Button>
        </header>

        {/* Filter Buttons */}
        <div className="flex justify-center space-x-3 mb-8">
          {["all", "unread", "read"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                filter === type
                  ? "bg-blue-100 border-blue-400 text-blue-600"
                  : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)} ({counts[type]})
            </button>
          ))}
        </div>

        {/* Message Feedback */}
        {message && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md shadow-sm">
            <p className="font-bold">Message</p>
            <p>{message}</p>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="text-center py-10">
            <CircularProgress />
            <p className="mt-4 text-lg font-semibold text-gray-700">
              Loading notifications...
            </p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <InfoIcon style={{ fontSize: 60 }} className="mx-auto text-gray-400" />
            <p className="mt-4 text-xl text-gray-600">No notifications yet.</p>
            <p className="text-gray-500">
              When new updates arrive, they’ll appear here.
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date} className="mb-8">
              <h3 className="text-gray-500 font-semibold mb-3">{date}</h3>
              <ul className="space-y-4">
                {items.map((note) => (
                  <motion.li
                    key={note.id}
                    onClick={() => markAsRead(note.id)} // ✅ added
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`cursor-pointer p-5 rounded-lg shadow-md border flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 transition-all duration-300 ${
                      note.is_read
                        ? "bg-white border-gray-200"
                        : "bg-blue-50 border-blue-300"
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(note.type)}
                      </div>
                      <div>
                        <p
                          className={`${
                            note.is_read
                              ? "text-gray-800"
                              : "text-gray-900 font-semibold"
                          }`}
                        >
                          {note.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(note.date).toLocaleString("en-KE", {
                            weekday: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "short",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons for join requests */}
                    {note.type === "join_request" && (
                      <div className="flex flex-row items-center justify-end space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // ✅ prevent auto mark
                            handleRequest(note.id, "accept");
                          }}
                          className="flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                        >
                          <CheckCircleIcon className="mr-2" />
                          Accept
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // ✅ prevent auto mark
                            handleRequest(note.id, "decline");
                          }}
                          className="flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                        >
                          <CancelIcon className="mr-2" />
                          Decline
                        </button>
                      </div>
                    )}

                    {/* Unread badge */}
                    {!note.is_read && (
                      <span className="self-end sm:self-center px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                        New
                      </span>
                    )}
                  </motion.li>
                ))}
              </ul>
            </div>
          ))
        )}

        {/* Snackbar for success feedback */}
        <Snackbar
          open={snackbarOpen}
          onClose={() => setSnackbarOpen(false)}
          autoHideDuration={3000}
          message="✅ All notifications marked as read"
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        />
      </main>

      <Nav />
    </div>
  );
}