import React, { useEffect, useState } from "react";
import axios from "axios";

function PendingWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  // Toggle this to true to use mock data
  const useTestData = true;

  useEffect(() => {
    const fetchWithdrawals = async () => {
      try {
        if (useTestData) {
          // Simulated delay
          setTimeout(() => {
            const mockData = [
              {
                id: 1,
                amount: 15000,
                date: "2025-08-14",
                reason: "Office rent payment",
                status: "PENDING",
              },
              {
                id: 2,
                amount: 8500,
                date: "2025-08-12",
                reason: "Event sponsorship",
                status: "PENDING",
              },
              {
                id: 3,
                amount: 12000,
                date: "2025-08-10",
                reason: "New equipment purchase",
                status: "PENDING",
              },
            ];
            setWithdrawals(mockData);
            setLoading(false);
          }, 500);
        } else {
          const res = await axios.get("http://maziwa-90gd.onrender.com/withdrawal/status", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const pending = res.data.filter((w) => w.status === "PENDING");
          setWithdrawals(pending);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch withdrawals:", err);
        setLoading(false);
      }
    };

    fetchWithdrawals();
  }, [token]);

  const handleVote = async (transactionId, action) => {
    if (useTestData) {
      alert(`Test Mode: ${action} vote for transaction ID ${transactionId}`);
      return;
    }

    const url = `https://maziwa-90gd.onrender.com/withdrawal/${action}/${transactionId}`;
    try {
      const res = await axios.post(url, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(res.data.message);
      setWithdrawals((prev) =>
        prev.map((w) =>
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
    <div className="bg-white shadow-lg rounded-xl p-6 mb-6 max-w-lg mx-auto border border-gray-200">
      <h2 className="text-xl font-bold text-red-600 mb-4 text-center">
        Pending Withdrawals
      </h2>
      {withdrawals.map((w) => (
        <div
          key={w.id}
          className="border border-gray-200 p-4 rounded-lg mb-3 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <p className="text-lg font-semibold text-gray-800">
            Amount: <span className="text-green-600">KES {w.amount.toLocaleString()}</span>
          </p>
          <p className="text-sm text-gray-500">Date: {w.date}</p>
          <p className="mt-1 text-gray-700">
            <strong>Reason:</strong> {w.reason}
          </p>
          {w.status === "PENDING" && (
            <div className="flex gap-3 mt-4 justify-center">
              <button
                onClick={() => handleVote(w.id, "approve")}
                className="px-4 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition"
              >
                Approve
              </button>
              <button
                onClick={() => handleVote(w.id, "reject")}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
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
