import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";

const COLORS = ["#4CAF50", "#FF5722"]; // green for PAID, red for MISSING

function ContributionPieChart() {
  const [data, setData] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchContributions = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:5000/contributions", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const paid = res.data.filter((c) => c.status === "PAID").length;
        const missing = res.data.filter((c) => c.status === "MISSING").length;

        setData([
          { name: "Paid", value: paid },
          { name: "Missing", value: missing },
        ]);
      } catch (err) {
        console.error("Failed to fetch contribution data", err);
      }
    };

    fetchContributions();
  }, [token]);

  return (
    <div className="bg-white shadow rounded p-4 mb-6 max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-4 text-black-600">Contribution Overview</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            label
            outerRadius={90}
            dataKey="value"
          >
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ContributionPieChart;