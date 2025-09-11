import React, { useEffect, useState } from "react";
import Nav from "../components/Navbar";
import ProminentAppBar from "../components/header";
import Announcements from "../components/Announcements"; // ✅ import

const BACKEND_URL = "https://maziwa-90gd.onrender.com";

export default function GroupPage() {
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors duration-300"
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
              <Announcements
                groupId={members[0]?.group_id}
                token={token}
              />
            </div>
          </>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800">Available Groups</h2>
            <p className="text-gray-600">You are not currently in a group. Join one below!</p>
            <ul className="mt-6 space-y-4">
              {groups.map((group) => (
                <li
                  key={group.id}
                  className="p-4 border rounded-md flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="font-semibold text-lg text-gray-800">{group.name}</span>
                  <button
                    onClick={() => requestJoin(group.id)}
                    className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition-colors duration-300"
                  >
                    Request to Join
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}