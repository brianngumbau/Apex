import React from "react";

const AnnouncementList = ({ announcements, onDelete }) => (
  <div className="mt-6">
    <h3 className="text-lg font-semibold mb-2">Recent Announcements</h3>
    {announcements.length ? (
      <ul className="space-y-3">
        {announcements.map((a) => (
          <li
            key={a.id}
            className="p-4 border rounded bg-gray-50 shadow-sm flex justify-between items-start"
          >
            <div>
              <h4 className="font-semibold">{a.title || "No Title"}</h4>
              <p className="text-gray-700">{a.message}</p>
              <span className="text-xs text-gray-500">
                {new Date(a.created_at).toLocaleString()}
              </span>
            </div>
            <button
              onClick={() => onDelete(a.id)}
              className="bg-red-600 text-white px-3 py-1 rounded shadow ml-4"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-gray-500">No announcements yet.</p>
    )}
  </div>
);

export default AnnouncementList;