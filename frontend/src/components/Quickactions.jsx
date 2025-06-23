import React from "react";
import { useNavigate } from "react-router-dom";

function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="bg-white shadow rounded p-4 mb-6 max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-4 text-blue-600">Quick Actions</h2>
      <div className="flex flex-col gap-3">
        <button
          onClick={() => navigate("/mpesa")}
          className="bg-green-500 text-white py-2 rounded hover:bg-green-600 transition"
        >
          Contribute Now
        </button>
        <button
          onClick={() => navigate("/transactions")}
          className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
        >
          View Transactions
        </button>
        <button
          onClick={() => navigate("/group")}
          className="bg-purple-500 text-white py-2 rounded hover:bg-purple-600 transition"
        >
          View Group Details
        </button>
      </div>
    </div>
  );
}

export default QuickActions;