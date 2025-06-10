import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Nav from "../components/Navbar";


const GroupPage = () => {
  const [groups, setGroups] = useState([]);
  const [joinStatus, setJoinStatus] = useState({}); // Track request statuses

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await axios.get('/api/groups'); // Backend should expose this route
       console.log('Groups:', res.data);
      setGroups(res.data);
    } catch (error) {
      console.error('Failed to fetch groups', error);
    }
  };

  const handleJoinRequest = async (groupId) => {
    try {
      await axios.post(`/api/groups/${groupId}/join`);
      setJoinStatus((prev) => ({ ...prev, [groupId]: 'pending' }));
    } catch (error) {
      console.error('Failed to send join request', error);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Available Groups</h1>
      <div className="space-y-4 max-w-2xl mx-auto">
        {groups.length > 0 ? (
          groups.map((group) => (
            <div key={group.id} className="bg-white shadow rounded-xl p-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">{group.name}</h2>
                <p className="text-sm text-gray-500">Admin: {group.admin_name}</p>
              </div>
              <div>
                {joinStatus[group.id] === 'pending' ? (
                  <span className="text-yellow-600 font-medium">Request Sent</span>
                ) : (
                  <button
                    onClick={() => handleJoinRequest(group.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Join
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No groups available yet.</p>
        )}
      </div>
    </div>
    <Nav />
    </>
  );
};

export default GroupPage;
