import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Avatar from '@mui/material/Avatar';

const ContributionStreakTable = () => {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStreaks = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Missing token");
          setLoading(false);
          return;
        }

        const response = await axios.get('http://localhost:5000/contributions/streaks', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const sorted = response.data.sort((a, b) => b.streak - a.streak);
        setContributors(sorted);
      } catch (err) {
        setError("Failed to fetch streaks.");
      } finally {
        setLoading(false);
      }
    };

    fetchStreaks();
  }, []);

  const getMedalEmoji = (index) => {
    switch (index) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return null;
    }
  };

  if (loading) return <p className="p-4">Loading...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="bg-white max-w-md mx-auto shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 px-6 py-4 border-b">
        <h2 className="text-lg font-semibold text-center">Leaderboard</h2>
      </div>

      {/* List */}
      <div className="divide-y">
        {contributors.map((contributor, index) => (
          <div
            key={index}
            className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition"
          >
            {/* Rank number */}
            <div className="text-lg font-bold w-6 text-gray-700">{index + 1}</div>

            {/* Avatar */}
            <Avatar
              src={contributor.avatar || "https://via.placeholder.com/150"}
              alt={contributor.name}
              sx={{ width: 48, height: 48 }}
            />

            {/* Name + Medal + Streak */}
            <div>
              <p className="font-medium text-gray-800 flex items-center gap-1">
                {contributor.name}
                {getMedalEmoji(index) && (
                  <span className="text-xl">{getMedalEmoji(index)}</span>
                )}
              </p>
              <p className="text-sm text-gray-500">
                Streak: {contributor.streak} days
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContributionStreakTable;
