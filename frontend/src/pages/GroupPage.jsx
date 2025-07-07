import React, { useEffect, useState } from "react";
import Nav from "../components/Navbar";
import ProminentAppBar from "../components/header";

const BACKEND_URL = "http://127.0.0.1:5000";

export default function GroupPage() {
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/groups`, { headers: authHeaders });
      const data = await res.json();
      if (res.ok) setGroups(data);
      else setMessage(data.error || "Failed to fetch groups.");
    } catch (error) {
      setMessage("Error fetching groups: " + error.message);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/group/members`, { headers: authHeaders });
      const data = await res.json();
      if (res.ok) setMembers(data);
      else setMembers([]); // user is not in a group
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
      return;
    }
    fetchGroups();
    fetchMembers();
  }, [token]);

  if (!token) {
    return (
      <div className="max-w-2xl mx-auto mt-10 text-center text-red-600">
        You must be logged in to view this page.
      </div>
    );
  }

  return (
    <>
      <ProminentAppBar />
      <div className="max-w-4xl mx-auto mt-10 space-y-8 px-4">
        <h1 className="text-3xl font-bold text-center text-gray-800">Group Dashboard</h1>

        {message && (
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded shadow">
            {message}
          </div>
        )}

        {/* IF user is in a group - show group members */}
        {members.length > 0 ? (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Your Group Members</h2>
            <ul className="divide-y">
              {members.map((member) => (
                <li key={member.id} className="py-2 flex justify-between">
                  <span>{member.name}</span>
                  <span className="text-sm text-gray-500">
                    {member.is_admin ? "Admin" : "Member"}
                  </span>
                </li>
              ))}
            </ul>
            <button
              onClick={leaveGroup}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Leave Group
            </button>
          </div>
        ) : (
          // IF user is NOT in a group - show available groups
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Available Groups</h2>
            <ul className="space-y-2">
              {groups.map((group) => (
                <li
                  key={group.id}
                  className="flex justify-between items-center p-3 border rounded"
                >
                  <span>{group.name}</span>
                  <button
                    onClick={() => requestJoin(group.id)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Request to Join
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Nav />
      </div>
    </>
  );
}
