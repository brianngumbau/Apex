import React from "react";

const PendingJoinRequests = ({ requests, onApprove, onReject }) => {
  if (!requests?.length) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Pending Join Requests</h2>
      <ul className="space-y-2">
        {requests.map((r) => (
          <li
            key={r.id}
            className="p-3 border rounded flex justify-between items-center"
          >
            <span>{r.name} ({r.email})</span>
            <div className="space-x-2">
              <button
                onClick={() => onApprove(r.id)}
                className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
              >
                Approve
              </button>
              <button
                onClick={() => onReject(r.id)}
                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PendingJoinRequests;