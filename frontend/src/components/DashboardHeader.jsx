import React from "react";

const DashboardHeader = ({ dashboard }) => {
  if (!dashboard) return null;

  // Calculate values directly from dashboard data
  const totalMembers = dashboard.members?.length || 0;
  const totalContributions =
    dashboard.members?.reduce(
      (sum, m) => sum + (m.total_contributed || 0),
      0
    ) || 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
          <h2 className="text-sm text-gray-500">Total Members</h2>
          <p className="text-xl font-semibold">{totalMembers}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
          <h2 className="text-sm text-gray-500">Total Contributions</h2>
          <p className="text-xl font-semibold">{totalContributions}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
          <h2 className="text-sm text-gray-500">Pending Withdrawals</h2>
          <p className="text-xl font-semibold">{dashboard.pending_withdrawals?.length || 0}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
          <h2 className="text-sm text-gray-500">Pending Join Requests</h2>
          <p className="text-xl font-semibold">{dashboard.pending_join_requests?.length || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;