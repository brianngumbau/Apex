import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Group,
  AccountBalanceWallet,
  People,
  MonetizationOn,
  CalendarToday,
  AccountBalance,
} from "@mui/icons-material";

function AccountSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch account summary
        const summaryRes = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/user/account_summary`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSummary(summaryRes.data);
      } catch (err) {
        console.error("Failed to fetch account summary:", err);
        setSummary(null);
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
    <div className="bg-white max-w-3xl mx-auto shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 px-6 py-4 border-b text-center">
        <h2 className="text-lg font-semibold">Account Summary</h2>
        <p className="text-sm text-gray-500">{summary.month}</p>
      </div>

      {/* Content */}
      <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Group Name */}
        <div className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50">
          <Group className="text-green-500" />
          <div>
            <p className="text-sm text-gray-500">Group</p>
            <p className="text-lg font-semibold text-gray-800">
              {summary.group_name || "No group joined"}
            </p>
          </div>
        </div>

        {/* Your Monthly Total */}
        <div className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50">
          <AccountBalanceWallet className="text-indigo-500" />
          <div>
            <p className="text-sm text-gray-500">Your Monthly Total</p>
            <p className="text-lg font-semibold text-gray-800">
              KES {summary.monthly_contributed?.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Pending Contributions */}
        <div className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50">
          <CalendarToday className="text-yellow-500" />
          <div>
            <p className="text-sm text-gray-500">Pending Contributions</p>
            <p className="text-lg font-semibold text-gray-800">
              KES {summary.pending_amount?.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Daily Contribution Amount */}
        <div className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50">
          <CalendarToday className="text-purple-500" />
          <div>
            <p className="text-sm text-gray-500">Daily Contribution</p>
            <p className="text-lg font-semibold text-gray-800">
              KES {summary.daily_amount?.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Outstanding Loan */}
        <div className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50">
          <MonetizationOn className="text-red-500" />
          <div>
            <p className="text-sm text-gray-500">Outstanding Loan</p>
            <p className="text-lg font-semibold text-gray-800">
              KES {summary.outstanding_loan?.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Loan Limit */}
        <div className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50">
          <MonetizationOn className="text-green-600" />
          <div>
            <p className="text-sm text-gray-500">Loan Limit</p>
            <p className="text-xl font-bold text-green-700">
              KES{" "}
              {summary.loan_limit !== undefined
                ? summary.loan_limit.toFixed(2)
                : "0.00"}
            </p>
          </div>
        </div>

        {/* Group Monthly Contributions */}
        <div className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50">
          <People className="text-blue-500" />
          <div>
            <p className="text-sm text-gray-500">Group Monthly Contributions</p>
            <p className="text-lg font-semibold text-gray-800">
              KES {summary.group_monthly_contributions?.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Total Group Contributions (All Time) */}
        <div className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50">
          <People className="text-orange-500" />
          <div>
            <p className="text-sm text-gray-500">Total Group Contributions</p>
            <p className="text-lg font-semibold text-gray-800">
              KES {summary.group_total_contributions?.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Current Balance (Adjusted Group Funds) */}
        <div className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50">
          <AccountBalance className="text-green-700" />
          <div>
            <p className="text-sm text-gray-500">Current Balance</p>
            <p className="text-xl font-bold text-gray-900">
              KES {summary.adjusted_group_funds?.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Your % Share */}
        <div className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50 md:col-span-2">
          <MonetizationOn className="text-teal-500" />
          <div>
            <p className="text-sm text-gray-500">Your Share in Group Funds</p>
            <p className="text-lg font-semibold text-gray-800">
              {summary.percentage_share?.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountSummary;