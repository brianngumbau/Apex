import React, { useEffect, useState } from "react";
import axios from "axios";
import Nav from "../components/Navbar";
import ProminentAppBar from "../components/header";
import AccountSummary from "../components/AccountSummary";
import ContributionStreakTable from "../components/ContributionStreakTable";
import PendingWithdrawals from "../components/PendingWithdrawals";
import GroupAUMChart from "../components/GroupAUMChart";
import QuickActions from "../components/Quickactions"

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
      <main className="p-6 text-center space-y-6">
        <h1 className="text-2xl font-bold text-black-600 mb-4">
          Welcome, {user?.name?.split(" ")[0]}
        </h1>

        {/*  Account Summary */}
        <AccountSummary
        userMonthlyTotal={user?.monthly_total}
        groupName={user?.group_name}
         />


        {/* ContributionStreakTable */}
        <ContributionStreakTable />
        
        {/* Pending withdrawals*/}
        <PendingWithdrawals />
        {/*Pie chart*/}
        <GroupAUMChart />
        
        {/* 
          - Notifications
        */}

      </main>
      <Nav />
    </>
  );
}

export default Dashboard;