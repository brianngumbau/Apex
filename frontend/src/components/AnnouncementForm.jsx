import React, { useState } from "react";

const AnnouncementForm = ({ onSubmit }) => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(title, message);
    setTitle("");
    setMessage("");
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Make Announcement</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="w-full border px-3 py-2 rounded"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows="3"
          placeholder="Write an announcement..."
          className="w-full border px-3 py-2 rounded"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded shadow"
        >
          Post Announcement
        </button>
      </form>
    </div>
  );
};

export default AnnouncementForm;