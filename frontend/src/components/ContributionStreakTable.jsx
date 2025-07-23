import React, { useEffect, useState } from 'react';
import axios from 'axios';

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

      console.log("Fetched streaks:", response.data);
      const sorted = response.data.sort((a, b) => b.streak - a.streak);
      setContributors(sorted);
    } catch (err) {
      console.error("Error fetching streaks:", err.response?.data || err.message);
      setError("Failed to fetch streaks.");
    } finally {
      setLoading(false);
    }
  };

  fetchStreaks();
}, []);


  if (loading) return <p className="p-4">Loading...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="bg-white shadow rounded p-4 mb-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
      <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="py-2 px-4 border-b">Rank</th>
            <th className="py-2 px-4 border-b">Name</th>
            <th className="py-2 px-4 border-b">Streak (Days)</th>
          </tr>
        </thead>
        <tbody>
          {contributors.map((contributor, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="py-2 px-4 border-b">{index + 1}</td>
              <td className="py-2 px-4 border-b">{contributor.name}</td>
              <td className="py-2 px-4 border-b">{contributor.streak}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ContributionStreakTable;
