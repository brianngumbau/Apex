import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, Typography } from '@mui/material';

// Example colors for different asset categories
const COLORS = ['#6366f1', '#22c55e', '#f97316', '#eab308']; 

const GroupAUMChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // This will later be replaced with admin-fed data from backend
    // For now, use placeholder values for visual impression
    const placeholderData = [
      { name: 'Cash', value: 500000 },
      { name: 'Investments', value: 1200000 },
      { name: 'Real Estate', value: 800000 },
      { name: 'Other Assets', value: 200000 },
    ];

    setData(placeholderData);
  }, []);

  return (
    <Card className="max-w-md mx-auto shadow-lg rounded-lg">
      <CardContent>
        <Typography
          variant="h6"
          className="text-center font-semibold text-gray-800 mb-4"
        >
          Assets Under Management
        </Typography>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={100}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `KES ${value.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupAUMChart;
