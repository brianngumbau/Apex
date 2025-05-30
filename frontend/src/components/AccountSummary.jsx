import React, { useEffect, useState } from "react";
import axios from "axios";

function AccountSummary({ userMonthlyTotal, groupName }) {
  const [groupTotal, setGroupTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchGroupTotal = async () => {
      try {
        const groupRes = await axios.get("http://127.0.0.1:5000/contributions/total", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGroupTotal(groupRes.data.total_contributions || 0);
      } catch (err) {
        console.error("Failed to fetch group total:", err);
        console.warn("Group contribution data unavailable. User might not ber in a group.");
        setGroupTotal(null);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupTotal();
  }, [token]);

  if (loading) {
    return <div className="text-center">Loading summary...</div>;
  }

  return (
    <div className="bg-white shadow rounded p-4 mb-6 max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-2 text-blue-600">Account Summary</h2>
      <div className="text-sm text-gray-700 space-y-1">
        <p><strong>Your Monthly Total:</strong> KES {userMonthlyTotal?.toFixed(2)}</p>
        <p><strong>Group:</strong> {groupName || "No group joined"}</p>
        <p><strong>Group Contributions:</strong> {groupTotal !== null ? `KES ${groupTotal.toFixed(2)}` : "Not available"}</p>
      </div>
    </div>
  );
}

export default AccountSummary;