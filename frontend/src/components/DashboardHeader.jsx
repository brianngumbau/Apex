import React from "react";

const DashboardHeader = ({ dashboard }) => (
  <header className="text-center space-y-2">
    <h1 className="text-3xl font-bold">
      Admin Dashboard – {dashboard.group_name}
    </h1>
    <p className="text-gray-600">
      {dashboard.month} | Daily contribution:{" "}
      <span className="font-semibold">
        Ksh {dashboard.daily_contribution_amount}
      </span>
    </p>
    {dashboard.join_code && (
      <p className="text-gray-800">
        Group Join Code:{" "}
        <span className="font-mono font-bold">{dashboard.join_code}</span>
      </p>
    )}
  </header>
);

export default DashboardHeader;