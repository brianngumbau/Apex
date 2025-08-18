import React, { useEffect, useState } from "react";
import { Card, CardContent, Typography, LinearProgress, Box } from "@mui/material";

const blueShades = [
  "rgba(191, 219, 254, 0.9)", // Light Blue
  "rgba(147, 197, 253, 0.9)", // Medium Blue
  "rgba(96, 165, 250, 0.9)",  // Deeper Blue
  "rgba(59, 130, 246, 0.9)",  // Blue
  "rgba(37, 99, 235, 0.9)",   // Darker Blue
];

const BudgetAllocation = () => {
  const [data, setData] = useState([]);
  const [progress, setProgress] = useState([]);

  useEffect(() => {
    // Placeholder budget data until admin input is added
    const placeholderData = [
      { category: "Research & Development", value: 60 },
      { category: "Marketing", value: 45 },
      { category: "Operations", value: 50 },
      { category: "Dividends", value: 30 },
      { category: "Reinvestments", value: 55 },
    ];
    setData(placeholderData);

    // Animate fill-up effect
    setProgress(Array(placeholderData.length).fill(0));
    setTimeout(() => {
      placeholderData.forEach((item, index) => {
        setTimeout(() => {
          setProgress((prev) => {
            const updated = [...prev];
            updated[index] = item.value;
            return updated;
          });
        }, index * 150);
      });
    }, 300);
  }, []);

  return (
    <Card className="max-w-md mx-auto shadow-md rounded-xl bg-white">
      <CardContent>
        {/* Title */}
        <Typography
          variant="h6"
          className="text-center font-semibold text-gray-700 mb-4"
        >
          Company Budget Allocation
        </Typography>

        {/* Bars */}
        <div className="space-y-4">
          {data.map((item, index) => (
            <Box key={index}>
              <Typography
                variant="body2"
                className="font-medium mb-1 text-gray-600"
              >
                {item.category}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progress[index] || 0}
                sx={{
                  height: 10,
                  borderRadius: 6,
                  backgroundColor: "#e5e7eb", // Tailwind gray-200
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: blueShades[index % blueShades.length],
                    transition: "width 1s ease-in-out",
                  },
                }}
              />
            </Box>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetAllocation;
