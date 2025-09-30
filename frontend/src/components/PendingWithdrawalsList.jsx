import React from "react";

const PendingWithdrawalsList = ({ withdrawals, onCancel }) => (
  <div className="bg-white rounded-2xl shadow-md p-6">
    <h2 className="text-xl font-semibold mb-4">Pending Withdrawals</h2>
    {withdrawals.length ? (
      withdrawals.map((w) => (
        <div
          key={w.id}
          className="p-4 border rounded mb-2 bg-gray-50 flex justify-between items-center"
        >
          <div>
            <p>
              Request of Ksh {w.amount} by {w.requested_by || "Admin"} for{" "}
              {w.reason} on {new Date(w.date).toLocaleDateString()}
            </p>
            <p>
              Status: {w.status} | Approvals: {w.approvals} | Rejections:{" "}
              {w.rejections}
            </p>
          </div>
          {w.status === "pending" && (
            <button
              onClick={() => onCancel(w.id)}
              className="bg-red-600 text-white px-4 py-2 rounded shadow ml-4"
            >
              Cancel
            </button>
          )}
        </div>
      ))
    ) : (
      <p>No pending withdrawals</p>
    )}
  </div>
);

export default PendingWithdrawalsList;