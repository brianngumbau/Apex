import React from "react";

const PendingWithdrawalsList = ({ withdrawals, onCancel }) => {
  if (!withdrawals?.length) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Pending Withdrawals</h2>
      <ul className="space-y-2">
        {withdrawals.map((w) => (
          <li
            key={w.id}
            className="p-3 border rounded flex justify-between items-center"
          >
            <div>
              <p>Amount: {w.amount}</p>
              <p className="text-sm text-gray-600">{w.reason}</p>
            </div>
            <button
              onClick={() => onCancel(w.id)}
              className="text-red-500 hover:underline"
            >
              Cancel
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PendingWithdrawalsList;