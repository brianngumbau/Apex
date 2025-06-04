import React, { useEffect, useState } from "react";
import axios from "axios";
import { ButtonGroupButtonContext } from "@mui/material";

function PendingWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchWithdrawals = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:5000/withdrawal/status", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const pending = res.data.filter((w) => w.status === "PENDING");
        setWithdrawals(pending);
      } catch (err) {
        console.error("Failed to fetch withdrawals:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWithdrawals();
  }, [token]);

  const handleVote = async (transactionId, action) => {
    const url = `http://127.0.0.1:5000/withdrawal/${action}/${transactionId}`;
    try {
        const res = await axios.post(url, {}, {
            headers: { Authorization: `Bearer ${token}`},
        });
        alert (res.data.message);
        // refreshing after voting
        setWithdrawals(prev => 
            prev.map(w =>
                w.id === transactionId ? { ...w, status: res.data.status } : w
            )
        );
    } catch (err) {
        console.error(err);
        alert("Vote failed. " + (err.response?.data?.error || ""));
    }
  };

  if (loading) return <p className="text-center">Loading pending withdrawals...</p>;
  if (withdrawals.length === 0) return <p className="text-center text-gray-500">No pending withdrawals</p>;

  return (
    <div className="bg-white shadow rounded p-4 mb-6 max-w-md mx-auto">
      <h2 className="text-lg font-semibold text-red-600 mb-4">Pending Withdrawals</h2>
      {withdrawals.map((w) => (
        <div key={w.id} className="border p-2 rounded mb-2">
          <p><strong>Amount:</strong> KES {w.amount}</p>
          <p><strong>Date:</strong> {w.date}</p>
          <p><strong>Reason:</strong> {w.reason}</p>
          <p><strong>Status:</strong></p>

          {w.status === "PENDING" && (
            <div className="flex gap-2 mt-2 justify-center">
                <button
                onClick={() => handleVote(w.id, "approve")}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Approve
                </button>
                <button
                onClick={() => handleVote(w.id, "reject")}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    Reject
                </button>
                </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default PendingWithdrawals;
