import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Group,
  AccountBalanceWallet,
  People,
  MonetizationOn,
  CalendarToday,
} from "@mui/icons-material";

function AccountSummary() {
  const [summary, setSummary] = useState(null);
  const [groupTotal, setGroupTotal] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch account summary
        const summaryRes = await axios.get("http://localhost:5000/user/account_summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSummary(summaryRes.data);

        // Fetch group contributions total
        const groupRes = await axios.get("http://localhost:5000/contributions/total", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGroupTotal(groupRes.data.total_contributions || 0);
      } catch (err) {
        console.error("Failed to fetch account summary:", err);
        setGroupTotal(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-4">
        <div className="w-6 h-6 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white max-w-md mx-auto shadow-lg rounded-lg overflow-hidden p-6 text-center">
        <p className="text-gray-500">No account summary available</p>
      </div>
    );
  }

  return (
    <div className="bg-white max-w-md mx-auto shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 px-6 py-4 border-b text-center">
        <h2 className="text-lg font-semibold">Account Summary</h2>
        <p className="text-sm text-gray-500">{summary.month}</p>
      </div>

      {/* Content */}
      <div className="px-6 py-4 space-y-4">
        {/* Monthly Total */}
        <div className="flex items-center gap-3">
          <AccountBalanceWallet className="text-indigo-500" />
          <div>
            <p className="text-sm text-gray-500">Your Monthly Total</p>
            <p className="text-lg font-semibold text-gray-800">
              KES {summary.total_contributed?.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Pending Contributions */}
        <div className="flex items-center gap-3">
          <CalendarToday className="text-yellow-500" />
          <div>
            <p className="text-sm text-gray-500">Pending Contributions</p>
            <p className="text-lg font-semibold text-gray-800">
              KES {summary.pending_amount?.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Outstanding Loan */}
        <div className="flex items-center gap-3">
          <MonetizationOn className="text-red-500" />
          <div>
            <p className="text-sm text-gray-500">Outstanding Loan</p>
            <p className="text-lg font-semibold text-gray-800">
              KES {summary.outstanding_loan?.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Daily Contribution Amount */}
        <div className="flex items-center gap-3">
          <CalendarToday className="text-purple-500" />
          <div>
            <p className="text-sm text-gray-500">Daily Contribution</p>
            <p className="text-lg font-semibold text-gray-800">
              KES {summary.daily_amount?.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Group Name */}
        <div className="flex items-center gap-3">
          <Group className="text-green-500" />
          <div>
            <p className="text-sm text-gray-500">Group</p>
            <p className="text-lg font-semibold text-gray-800">
              {summary.group_name || "No group joined"}
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