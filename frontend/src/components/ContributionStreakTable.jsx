import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Avatar, Button, Card, Typography } from '@mui/material';
import { Leaderboard, GroupAdd, EmojiEvents } from '@mui/icons-material';
import GroupTableSkeleton from '../components/GroupTableSkeleton';

const ContributionStreakTable = () => {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userNotInGroup, setUserNotInGroup] = useState(false);

  useEffect(() => {
    const fetchStreaks = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Authentication error. Please log in again.");
          setLoading(false);
          return;
        }

        const response = await axios.get('http://localhost:5000/contributions/streaks', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Specific check for when the user is not in a group
        if (response.data.message === "User is not in a group") {
          setUserNotInGroup(true);
        } else {
          const sorted = response.data.sort((a, b) => b.streak - a.streak);
          setContributors(sorted);
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
            setUserNotInGroup(true);
        } else {
            setError("Failed to fetch contribution streaks. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStreaks();
  }, []);

  // Updated getMedal function to use a black and white theme
  const getMedal = (index) => {
    if (index === 0) return <EmojiEvents className="text-gray-900" />; // 1st Place
    if (index === 1) return <EmojiEvents className="text-gray-600" />; // 2nd Place
    if (index === 2) return <EmojiEvents className="text-gray-400" />; // 3rd Place
    return null;
  };

  if (loading) {
    return <GroupTableSkeleton />;
  }

  if (error) {
    return (
      <Card className="max-w-md mx-auto shadow-lg rounded-lg p-6 text-center border-t-4 border-red-500">
        <Typography variant="h6" className="text-red-600">Error</Typography>
        <Typography color="textSecondary">{error}</Typography>
      </Card>
    );
  }

  if (userNotInGroup) {
    return (
      <Card className="max-w-md mx-auto shadow-lg rounded-lg p-8 text-center">
        <GroupAdd style={{ fontSize: 60 }} className="text-gray-400 mx-auto" />
        <Typography variant="h5" component="h2" className="mt-4 font-semibold">
          Join a Group to See the Leaderboard
        </Typography>
        <Typography color="textSecondary" className="my-4">
          It looks like you're not part of any group yet. Join one to start competing!
        </Typography>
        <Button
          variant="contained"
          href="/groups"
          sx={{
            backgroundColor: 'black',
            color: 'white',
            '&:hover': { backgroundColor: '#333' },
          }}
        >
          Find a Group
        </Button>
      </Card>
    );
  }

  if (contributors.length === 0) {
    return (
      <Card className="max-w-md mx-auto shadow-lg rounded-lg p-8 text-center">
        <Leaderboard style={{ fontSize: 60 }} className="text-gray-400 mx-auto" />
        <Typography variant="h5" component="h2" className="mt-4 font-semibold">
          Leaderboard is Empty
        </Typography>
        <Typography color="textSecondary" className="my-4">
          No contributions have been recorded yet. Be the first to start a streak!
        </Typography>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto shadow-xl rounded-2xl overflow-hidden">
      {/* Header changed to black and white */}
      <div className="p-5 bg-gray-500 text-white">
        <h2 className="text-2xl font-bold text-center flex items-center justify-center">
          <Leaderboard className="mr-2" />
          Contribution Leaderboard
        </h2>
      </div>
      <ul className="divide-y divide-gray-200">
        {contributors.map((contributor, index) => (
          <li
            key={contributor.id || index}
            className="flex items-center p-4 transition hover:bg-gray-100"
          >
            <div className="w-8 text-center text-lg font-bold text-gray-500">
              {index + 1}
            </div>
            {/* Avatar updated to show initials */}
            <Avatar
              alt={contributor.name}
              sx={{ bgcolor: '#e0e0e0', color: '#333', marginX: '1rem' }}
            >
              {contributor.name?.charAt(0).toUpperCase()}
            </Avatar>
            <div className="flex-grow">
              <p className="text-md text-gray-900 flex items-center">
                {contributor.name}
                <span className="ml-2">{getMedal(index)}</span>
              </p>
            </div>
            <div className="text-md text-gray-800 font-medium text-right">
              {contributor.streak} days
              <p className="text-sm text-gray-500">Streak</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default ContributionStreakTable;