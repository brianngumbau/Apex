import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import axios from 'axios';
import { Card, CardContent, Typography } from '@mui/material';

const COLORS = ['#4ade80', '#f87171']; // green = current, red = missing

const PieChartComponent = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchContributions = async () => {
      try {
        const res = await axios.get('/contributions', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`, // Or from context
          },
        });

        const contributions = res.data;

        // Compute expected months (based on start of year)
        const currentMonth = new Date().getMonth() + 1;
        const expectedContributions = currentMonth;

        const actualContributions = contributions.length;

        const chartData = [
          { name: 'Paid', value: actualContributions },
          { name: 'Missing', value: Math.max(expectedContributions - actualContributions, 0) },
        ];

        setData(chartData);
      } catch (err) {
        console.error('Failed to load contributions:', err);
      }
    };

    fetchContributions();
  }, []);

  if (!data) return <div className="text-center py-10">Loading chart...</div>;

  return (
    <Card className="shadow-md">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Contribution Overview
        </Typography>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PieChartComponent;
