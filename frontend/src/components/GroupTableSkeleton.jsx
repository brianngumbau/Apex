import React from "react";

const GroupTableSkeleton = () => {
  return (
    <div className="max-w-xl mx-auto mt-10 bg-white shadow-md rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 py-3 text-center">
        <div className="h-5 w-28 mx-auto bg-gray-300 animate-pulse rounded"></div>
      </div>

      {/* Skeleton rows */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center px-4 py-3 border-b last:border-none animate-pulse"
        >
          {/* Rank */}
          <div className="w-5 text-gray-400">{i + 1}</div>

          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gray-300 ml-4"></div>

          {/* Name + Streak */}
          <div className="ml-4 flex-1">
            <div className="h-4 w-32 bg-gray-300 rounded mb-2"></div>
            <div className="h-3 w-24 bg-gray-200 rounded"></div>
          </div>

          {/* Medal */}
          <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
        </div>
      ))}
    </div>
  );
};

export default GroupTableSkeleton;
