import React, { useEffect, useState } from "react";
import axios from "axios";
import Nav from "../components/Navbar";
import ProminentAppBar from "../components/header";
import AccountSummary from "../components/AccountSummary";
import BudgetAllocation from "../components/BudgetAllocation";


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
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-3xl space-y-6 animate-pulse">
        {/* Header placeholder */}
        <div className="h-10 bg-gray-300 rounded w-1/2 mx-auto"></div>

        {/* Card placeholders */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 border rounded-2xl shadow-md bg-gray-100">
              <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}




  return (
    <>
      <ProminentAppBar />
      <main className="p-6 text-center space-y-6">
        <h1 className="text-2xl font-bold text-black-600 mb-4">
          Welcome, {user?.name?.split(" ")[0]}
        </h1>

        {/*  Account Summary */}
        <AccountSummary
        userMonthlyTotal={user?.monthly_total}
        groupName={user?.group_name}
         />

         <BudgetAllocation />

        
        
        
        

      </main>
      <Nav />
    </>
  );
}

export default Dashboard;