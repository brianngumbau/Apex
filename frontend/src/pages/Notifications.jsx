import React, { useEffect, useState } from "react";
import Nav from "../components/Navbar";
import ProminentAppBar from "../components/header";
import {
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Notifications as NotificationsIcon,
  DoneAll as DoneAllIcon,
} from "@mui/icons-material";
import { CircularProgress, Button } from "@mui/material";

const BACKEND_URL = "https://maziwa-90gd.onrender.com";

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
  const [filter, setFilter] = useState("all"); // all, read, unread

  const token = localStorage.getItem("token");
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // 🔹 Fetch notifications
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/notifications`, {
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch notifications");
      setNotifications(data);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch(`${BACKEND_URL}/notifications/mark-all-read`, {
        method: "PUT",
        headers: authHeaders,
      });
      fetchNotifications();
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  // 🔹 Handle join requests
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

  useEffect(() => {
    if (token) {
      fetchNotifications();
    } else {
      setMessage("You must be logged in to view notifications.");
      setIsLoading(false);
    }
  }, [token]);

  const filteredNotifications =
    filter === "all"
      ? notifications
      : notifications.filter((n) => (filter === "unread" ? !n.is_read : n.is_read));

  return (
    <div className="min-h-screen bg-gray-50">
      <ProminentAppBar />
      <main className="max-w-4xl mx-auto py-8 px-4">
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row items-center justify-between mb-10">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl font-extrabold text-gray-900 flex items-center justify-center sm:justify-start">
              <NotificationsIcon className="mr-3" fontSize="large" />
              Notifications
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Here are your latest updates and requests.
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
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {message && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md shadow-sm">
            <p className="font-bold">Message</p>
            <p>{message}</p>
          </div>
        )}

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
              When you have new updates, they will appear here.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {filteredNotifications.map((note) => (
              <li
                key={note.id}
                className={`p-5 rounded-lg shadow-md border border-gray-200 flex items-start space-x-4 ${
                  note.is_read ? "bg-white" : "bg-blue-50"
                }`}
              >
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(note.type)}
                </div>
                <div className="flex-grow">
                  <p
                    className={`${
                      note.is_read ? "text-gray-800" : "text-gray-900 font-semibold"
                    }`}
                  >
                    {note.message}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(note.date).toLocaleString()}
                  </p>
                </div>

                {note.type === "join_request" && (
                  <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      onClick={() => handleRequest(note.id, "accept")}
                      className="flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                    >
                      <CheckCircleIcon className="mr-2" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleRequest(note.id, "decline")}
                      className="flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    >
                      <CancelIcon className="mr-2" />
                      Decline
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
      <Nav />
    </div>
  );
}