// src/admin/pages/Dashboard.jsx
import React from "react";
import { Card, CardContent, Typography } from "@mui/material";

function StatCard({ title, value }) {
  return (
    <Card className="shadow-md rounded-2xl">
      <CardContent>
        <Typography variant="h6" className="text-gray-700">{title}</Typography>
        <Typography variant="h4" className="font-bold text-blue-600">{value}</Typography>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  // Later: fetch from backend 
  const stats = [
    { title: "Total Users", value: 245 },
    { title: "Total Contributions", value: "$12,500" },
    { title: "Pending Withdrawals", value: 8 },
    { title: "Daily Streak Target", value: "$500" },
  ];

  return (
    <div>
      <Typography variant="h5" className="mb-6 font-semibold">Admin Dashboard</Typography>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((s, i) => (
          <StatCard key={i} title={s.title} value={s.value} />
        ))}
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md rounded-2xl">
          <CardContent>
            <Typography variant="h6" className="mb-4">Contribution Trends</Typography>
            <div className="h-64 flex items-center justify-center text-gray-400">
              [Line Chart Here]
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md rounded-2xl">
          <CardContent>
            <Typography variant="h6" className="mb-4">Budget Allocation</Typography>
            <div className="h-64 flex items-center justify-center text-gray-400">
              [Pie Chart Here]
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
