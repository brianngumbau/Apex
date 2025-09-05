import React, { useEffect, useState } from "react";
import Nav from "../components/Navbar";
import ProminentAppBar from "../components/header";
import {
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Notifications as NotificationsIcon,
} from "@mui/icons-material";
import { CircularProgress } from "@mui/material";


const BACKEND_URL = "http://127.0.0.1:5000";

// Helper function to get a Material-UI icon based on notification type
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

  const token = localStorage.getItem("token");
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/notifications`, { headers: authHeaders });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch notifications");
      setNotifications(data);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequest = async (requestId, action) => {
    try {
      const res = await fetch(`${BACKEND_URL}/group/join/${requestId}`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ action }), // "accept" or "decline"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action} request`);

      // Refresh notifications to reflect the change
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

  return (
    <div className="min-h-screen bg-gray-50">
      <ProminentAppBar />
      <main className="max-w-4xl mx-auto py-8 px-4">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 flex items-center justify-center">
            <NotificationsIcon className="mr-3" fontSize="large" />
            Notifications
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Here are your latest updates and requests.
          </p>
        </header>

        {message && (
          <div
            className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md shadow-sm"
            role="alert"
          >
            <p className="font-bold">Message</p>
            <p>{message}</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-10">
            <CircularProgress />
            <p className="mt-4 text-lg font-semibold text-gray-700">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <InfoIcon style={{ fontSize: 60 }} className="mx-auto text-gray-400" />
            <p className="mt-4 text-xl text-gray-600">No notifications yet.</p>
            <p className="text-gray-500">When you have new updates, they will appear here.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {notifications.map((note) => (
              <li
                key={note.id}
                className="bg-white p-5 rounded-lg shadow-md border border-gray-200 flex items-start space-x-4"
              >
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(note.type)}
                </div>
                <div className="flex-grow">
                  <p className="text-gray-800 font-medium">{note.message}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(note.date).toLocaleString()}
                  </p>
                </div>
                {note.type === "join_request" && (
                  <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      onClick={() => handleRequest(note.id, "accept")}
                      className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                      title="Accept"
                    >
                      <CheckCircleIcon className="mr-2" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleRequest(note.id, "decline")}
                      className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                      title="Decline"
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