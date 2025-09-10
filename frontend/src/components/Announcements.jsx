import React, { useEffect, useState } from "react";
import axios from "axios";

function Announcements({ groupId, token }) {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    if (!groupId) return;

    axios
      .get(`http://127.0.0.1:5000/group/${groupId}/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setAnnouncements(res.data))
      .catch((err) => console.error(err));
  }, [groupId, token]);

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 mt-6">
      <h2 className="text-lg font-semibold mb-3">📢 Announcements</h2>
      {announcements.length === 0 ? (
        <p className="text-gray-500">No announcements yet.</p>
      ) : (
        <ul className="space-y-3">
          {announcements.map((a) => (
            <li
              key={a.id}
              className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
            >
              <h3 className="font-bold">{a.title || "Untitled"}</h3>
              <p className="text-gray-700">{a.message}</p>
              <p className="text-sm text-gray-400">
                {new Date(a.created_at).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Announcements;