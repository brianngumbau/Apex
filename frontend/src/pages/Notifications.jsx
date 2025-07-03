import React, { useEffect, useState } from "react";
import Nav from "../components/Navbar";
import ProminentAppBar from "../components/header";


const BACKEND_URL = "http://127.0.0.1:5000";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/notifications`, {
        headers: authHeaders,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch notifications");
      }

      setNotifications(data);
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Error fetching notifications");
    }
  };

  useEffect(() => {
    if (!token) {
      setMessage("You must be logged in to view notifications.");
      return;
    }

    fetchNotifications();
  }, [token]);

  return (
    <>
    <ProminentAppBar />
    <div className="max-w-3xl mx-auto mt-10 px-4">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Notifications</h1>

      {message && (
        <div className="bg-red-100 text-red-800 px-4 py-2 rounded mb-4 shadow">
          {message}
        </div>
      )}

      {notifications.length === 0 && !message ? (
        <p className="text-center text-gray-500">No notifications available.</p>
      ) : (
        <ul className="space-y-3">
          {notifications.map((note) => (
            <li
              key={note.id}
              className="border rounded p-4 bg-white shadow-sm flex justify-between items-center"
            >
              <div>
                <p className="text-gray-800">{note.message}</p>
                <p className="text-sm text-gray-500">
                  {note.type} • {new Date(note.date).toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>

    <Nav />
    </> 
  );
}
