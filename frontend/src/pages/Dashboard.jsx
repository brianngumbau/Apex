import React, { useEffect, useState } from "react";
import axios from "axios";
import Nav from "../components/Navbar";
import ProminentAppBar from "../components/header";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:5000/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data);
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return (
    <>
      <ProminentAppBar />
      <main className="p-6 text-center">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">Welcome, {user?.name}</h1>
        <div className="bg-white p-4 rounded shadow max-w-md mx-auto space-y-2">
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Phone:</strong> {user?.phone}</p>
          <p><strong>Monthly Total:</strong> KES {user?.monthly_total?.toFixed(2)}</p>
          <p><strong>Group:</strong> {user?.group_id ? `Group ID ${user.group_id}` : "Not in a group"}</p>
        </div>
      </main>
      <Nav />
    </>
  );
}

export default Dashboard;