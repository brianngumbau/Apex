import React from "react";

const ProfileLoading = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-start py-12 px-6 animate-pulse">
      {/* Profile Picture */}
      <div className="w-28 h-28 rounded-full bg-gray-300 mb-6"></div>

      {/* Name Placeholder */}
      <div className="h-6 bg-gray-300 rounded w-40 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-24 mb-8"></div>

      {/* Stats Section */}
      <div className="flex gap-6 mb-10">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-24 h-16 bg-gray-200 rounded-lg shadow-sm"
          ></div>
        ))}
      </div>

      {/* Info Cards */}
      <div className="w-full max-w-xl space-y-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-6 border border-gray-200 rounded-xl shadow-md bg-gray-100"
          >
            <div className="h-5 bg-gray-300 rounded w-1/3 mb-3"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileLoading;
