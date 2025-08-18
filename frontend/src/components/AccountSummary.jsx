import React, { useEffect, useState } from "react";
import axios from "axios";
import { CircularProgress } from "@mui/material";
import { Group, AccountBalanceWallet, People } from "@mui/icons-material";

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
        console.warn("Group contribution data unavailable. User might not be in a group.");
        setGroupTotal(null);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupTotal();
  }, [token]);

 {loading && (
  <div className="flex justify-center items-center py-4">
    <div className="w-6 h-6 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
  </div>
)}



  return (
    <div className="bg-white max-w-md mx-auto shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 px-6 py-4 border-b">
        <h2 className="text-lg font-semibold text-center">Account Summary</h2>
      </div>

      {/* Content */}
      <div className="px-6 py-4 space-y-4">
        {/* Monthly Total */}
        <div className="flex items-center gap-3">
          <AccountBalanceWallet className="text-indigo-500" />
          <div>
            <p className="text-sm text-gray-500">Your Monthly Total</p>
            <p className="text-lg font-semibold text-gray-800">
              KES {userMonthlyTotal?.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Group Name */}
        <div className="flex items-center gap-3">
          <Group className="text-green-500" />
          <div>
            <p className="text-sm text-gray-500">Group</p>
            <p className="text-lg font-semibold text-gray-800">
              {groupName || "No group joined"}
            </p>
          </div>
        </div>

        {/* Group Contributions */}
        <div className="flex items-center gap-3">
          <People className="text-orange-500" />
          <div>
            <p className="text-sm text-gray-500">Group Contributions</p>
            <p className="text-lg font-semibold text-gray-800">
              {groupTotal !== null ? `KES ${groupTotal.toFixed(2)}` : "Not available"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountSummary;
