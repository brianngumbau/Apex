import React, { useEffect, useState } from "react";
import axios from "axios";

function ContributionStreakTable() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  const DAILY_GOAL = 20; // Daily expected contribution in KES

  useEffect(() => {
    const fetchContributions = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:5000/contributions", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const rawData = response.data;
        const grouped = {};

        // Group by user and sum total for the current month
        rawData.forEach(entry => {
          const date = new Date(entry.date);
          const now = new Date();
          if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
            if (!grouped[entry.user_id]) {
              grouped[entry.user_id] = { name: entry.user_name, total: 0 };
            }
            grouped[entry.user_id].total += entry.amount;
          }
        });

        const result = Object.entries(grouped).map(([user_id, data]) => {
          const streak = Math.floor(data.total / DAILY_GOAL);
          return {
            user_id,
            name: data.name,
            streak,
          };
        });

        // Sort by streak descending
        result.sort((a, b) => b.streak - a.streak);

        setMembers(result);
      } catch (err) {
        console.error("Failed to fetch contributions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContributions();
  }, [token]);

  if (loading) return <div className="text-center">Loading streaks...</div>;

  return (
    <div className="bg-white shadow rounded p-4 mb-6 max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold mb-2 text-blue-600">Contribution Streak</h2>
      <table className="min-w-full text-sm text-left">
        <thead>
          <tr className="text-gray-600 border-b">
            <th className="py-2 px-2">#</th>
            <th className="py-2 px-2">Name</th>
            <th className="py-2 px-2">Streak (days)</th>
            <th className="py-2 px-2">Progress</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member, idx) => {
            const progress = (member.streak / 31) * 100;
            return (
              <tr key={member.user_id} className="border-b hover:bg-gray-50">
                <td className="py-1 px-2">{idx + 1}</td>
                <td className="py-1 px-2">{member.name}</td>
                <td className="py-1 px-2">{member.streak} / 31</td>
                <td className="py-1 px-2 w-full">
                  <div className="w-full bg-gray-200 h-2 rounded">
                    <div
                      className="bg-green-500 h-2 rounded"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ContributionStreakTable;