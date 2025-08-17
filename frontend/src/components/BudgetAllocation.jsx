import React, { useEffect, useState } from "react";
import { Card, CardContent, Typography, LinearProgress, Box } from "@mui/material";

const colors = [
  "rgba(99, 102, 241, 0.6)", // Indigo
  "rgba(34, 197, 94, 0.6)",  // Green
  "rgba(249, 115, 22, 0.6)", // Orange
  "rgba(234, 179, 8, 0.6)",  // Yellow
  "rgba(59, 130, 246, 0.6)", // Blue
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
        }, index * 150); // small stagger delay for nicer animation
      });
    }, 300);
  }, []);

  return (
    <Card className="max-w-md mx-auto shadow-lg rounded-lg">
      <CardContent>
        {/* Title */}
        <Typography
          variant="h6"
          className="text-center font-semibold text-gray-800 mb-4"
        >
          Test Group Budget Allocation
        </Typography>

        {/* Bars */}
        <div className="space-y-4">
          {data.map((item, index) => (
            <Box key={index}>
              <Typography
                variant="body2"
                className="font-medium mb-1"
                style={{ color: colors[index % colors.length].replace("0.6", "1") }} // Full opacity for text
              >
                {item.category}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progress[index] || 0}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: "#f3f4f6", // lighter background
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: colors[index % colors.length],
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
