import React, { useEffect, useState } from "react";
import ProminentAppBar from "../components/Header";
import Announcements from "../components/Announcements";
import Nav from "../components/Navbar";

const BACKEND_URL = "https://maziwa-90gd.onrender.com";

export default function GroupPage() {
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // ✅ For Create Group
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // ✅ For Join with Code
  const [joinCode, setJoinCode] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/groups`, { headers: authHeaders });
      const data = await res.json();
      if (res.ok) {
        setGroups(data);
      } else {
        setMessage(data.error || "Failed to fetch groups.");
      }
    } catch (error) {
      setMessage("Error fetching groups: " + error.message);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/group/members`, { headers: authHeaders });
      const data = await res.json();
      if (res.ok) {
        setMembers(data);
      } else {
        setMembers([]); // User is not in a group
      }
    } catch (error) {
      setMessage("Error fetching members: " + error.message);
    }
  };

  const requestJoin = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/group/join`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ group_id: id }),
      });
      const data = await res.json();
      setMessage(data.message || data.error);
    } catch (error) {
      setMessage("Error requesting to join group: " + error.message);
    }
  };

  const joinWithCode = async () => {
    if (!joinCode.trim()) {
      setMessage("Please enter a group code.");
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/group/join/code`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ code: joinCode }),
      });
      const data = await res.json();
      setMessage(data.message || data.error);
      if (res.ok) {
        await fetchMembers();
        setJoinCode("");
      }
    } catch (error) {
      setMessage("Error joining with code: " + error.message);
    }
  };

  const leaveGroup = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/group/leave`, {
        method: "POST",
        headers: authHeaders,
      });
      const data = await res.json();
      setMessage(data.message || data.error);
      if (res.ok) {
        setMembers([]);
        fetchGroups();
      }
    } catch (error) {
      setMessage("Error leaving group: " + error.message);
    }
  };

  // ✅ Create Group Logic
  const createGroup = async () => {
    if (!newGroupName.trim()) {
      setMessage("Group name cannot be empty.");
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/group/create`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ group_name: newGroupName }),
      });
      const data = await res.json();
      setMessage(data.message || data.error);
      if (res.ok) {
        setShowCreateModal(false);
        setNewGroupName("");
        await fetchMembers();
        localStorage.setItem("is_admin", "true");

        try {
          const profileRes = await fetch(`${BACKEND_URL}/user/profile`, {
            headers: authHeaders,
          });
          const profileData = await profileRes.json();
          if (profileRes.ok) {
            localStorage.setItem("user", JSON.stringify(profileData));
          }
        } catch (err) {
          console.error("Failed to refresh profile after group creation:", err);
        }
      }
    } catch (error) {
      setMessage("Error creating group: " + error.message);
    }
  };

  useEffect(() => {
    if (!token) {
      setMessage("You must be logged in to view groups.");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchGroups(), fetchMembers()]);
      setIsLoading(false);
    };

    fetchData();
  }, [token]);

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-semibold text-red-600">Access Denied</h2>
          <p className="mt-2 text-gray-700">You must be logged in to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProminentAppBar />
      <main className="max-w-5xl mx-auto py-8 px-4">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Group Dashboard
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Manage your group or find a new one to join.
          </p>
        </header>

        {message && (
          <div
            className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md shadow-sm"
            role="alert"
          >
            <p className="font-bold">Notification</p>
            <p>{message}</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-700">Loading...</p>
          </div>
        ) : members.length > 0 ? (
          <>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Your Group</h2>
                  <p className="text-gray-600">Here are the members of your current group.</p>
                </div>
                <button
                  onClick={leaveGroup}
                  className="px-5 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
                >
                  Leave Group
                </button>
              </div>
              <ul className="mt-6 divide-y divide-gray-200">
                {members.map((member) => (
                  <li key={member.id} className="py-4 flex items-center justify-between">
                    <span className="font-medium text-gray-800">{member.name}</span>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        member.is_admin
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {member.is_admin ? "Admin" : "Member"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ✅ Announcements Section */}
            <div className="mt-10">
              <Announcements groupId={members[0]?.group_id} token={token} />
            </div>
          </>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Available Groups</h2>
                <p className="text-gray-600">
                  You are not currently in a group. Join one below or create a new one.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
              >
                + Create Group
              </button>
            </div>

            {/* ✅ Join with Code */}
            <div className="mb-6 p-4 border rounded-md bg-gray-50">
              <h3 className="font-semibold text-gray-700 mb-2">Join with Code</h3>
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="Enter group code"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                />
                <button
                  onClick={joinWithCode}
                  className="px-5 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition"
                >
                  Join
                </button>
              </div>
            </div>

            
          </div>
        )}
      </main>

      {/* ✅ Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Create a New Group</h2>
            <input
              type="text"
              placeholder="Enter group name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={createGroup}
                className="px-5 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      <Nav />
    </div>
  );
}