import React from "react";

const PendingJoinRequests = ({ requests, onApprove, onReject }) => (
  <div className="bg-white rounded-2xl shadow-md p-6">
    <h2 className="text-xl font-semibold mb-4">Pending Join Requests</h2>
    {requests?.length ? (
      requests.map((req) => (
        <div
          key={req.id}
          className="p-4 border rounded flex justify-between items-center mb-2"
        >
          <p>
            {req.user_name} requested to join on{" "}
            {new Date(req.date).toLocaleDateString()}
          </p>
          <div className="space-x-2">
            <button
              onClick={() => onApprove(req.id)}
              className="bg-green-600 text-white px-4 py-2 rounded shadow"
            >
              Approve
            </button>
            <button
              onClick={() => onReject(req.id)}
              className="bg-red-600 text-white px-4 py-2 rounded shadow"
            >
              Reject
            </button>
          </div>
        </div>
      ))
    ) : (
      <p>No join requests</p>
    )}
  </div>
);

export default PendingJoinRequests;