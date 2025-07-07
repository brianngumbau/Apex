import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProminentAppBar from "../components/header";
import Nav from "../components/Navbar";

const BACKEND_URL = "http://127.0.0.1:5000";

export default function CreateGroupPage() {
  const [groupName, setGroupName] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const handleCreateGroup = async () => {
    setMessage("");
    if (!groupName.trim()) {
      setMessage("Group name is required.");
      return;
    }

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

      // Optionally redirect to group dashboard
      setTimeout(() => navigate("/group"), 1500);
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (!token) {
    return (
      <div className="text-center text-red-600 mt-10">
        You must be logged in to create a group.
      </div>
    );
  }

  return (
    <>
      <ProminentAppBar />
      <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow space-y-4">
        <h1 className="text-2xl font-bold text-gray-800 text-center">
          Create a New Group
        </h1>

        {message && (
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded">
            {message}
          </div>
        )}

        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Enter group name"
        />

        <button
          onClick={handleCreateGroup}
          className="w-full bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
        >
          Create Group
        </button>
      </div>
        <Nav />
    </>
  );
}
