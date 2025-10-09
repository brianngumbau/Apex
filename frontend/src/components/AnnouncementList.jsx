import React from "react";

const AnnouncementList = ({ announcements, onDelete }) => {
  if (!announcements?.length) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Announcements</h2>
      <ul className="space-y-2">
        {announcements.map((a) => (
          <li
            key={a.id}
            className="p-3 border rounded flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{a.title}</p>
              <p className="text-gray-600">{a.message}</p>
            </div>
            <button
              onClick={() => onDelete(a.id)}
              className="text-red-500 hover:underline"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AnnouncementList;