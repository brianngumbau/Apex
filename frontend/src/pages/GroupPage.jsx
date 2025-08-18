import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Avatar from '@mui/material/Avatar';
import Nav from "../components/Navbar";
import ProminentAppBar from "../components/header";
import GroupTableSkeleton from '../components/GroupTableSkeleton';

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
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return null;
    }
  };

  if (loading) {
  return <GroupTableSkeleton />;
    }



  if (error) return <p className="p-4 text-red-500">{error}</p>;

  const maxStreak = contributors.length ? contributors[0].streak : 0;

  return (
    <>

  <ProminentAppBar />

  
  <div className="mt-20 max-w-md mx-auto shadow-lg rounded-lg overflow-hidden">
  
    <div className="bg-gray-100 px-6 py-4 border-b">
      <h2 className="text-lg font-semibold text-center">Leaderboard</h2>
    </div>

    {/* List */}
    <div className="divide-y">
      {contributors.map((contributor, index) => {
        const percentage = maxStreak ? (contributor.streak / maxStreak) * 100 : 0;
        return (
          <div
            key={index}
            className="relative px-6 py-4 overflow-hidden"
          >
            {/* Animated Background Bar with less opacity */}
            <div
              className="absolute top-0 left-0 h-full bg-blue-500 opacity-10 transition-all duration-1000 ease-out"
              style={{ width: `${percentage}%` }}
            ></div>

            {/* Foreground Content */}
            <div className="flex items-center gap-4 relative z-10">
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
          </div>
        );
      })}
    </div>
  </div>

  <Nav />
</>

  );
};

export default ContributionStreakTable;
