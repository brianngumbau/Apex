import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import Nav from "../components/Navbar";
import ProminentAppBar from "../components/header";
import AccountSummary from "../components/AccountSummary";
import ContributionStreakTable from "../components/ContributionStreakTable";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const [socket, setSocket] = useState(null);

  // Fetch profile + withdrawals
  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log("🔄 Fetching user profile...");
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/user/profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("✅ User profile fetched:", res.data);
        setUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data));
        localStorage.setItem("is_admin", res.data.is_admin ? "true" : "false");

        console.log("🔄 Fetching withdrawals...");
        const wdRes = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/withdrawal/status`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("✅ Withdrawals fetched:", wdRes.data);

        // add voted flag
        const withdrawalsWithVoteFlag = (wdRes.data || []).map((w) => ({
          ...w,
          voted: false,
        }));

        setWithdrawals(withdrawalsWithVoteFlag);
      } catch (error) {
        console.error("❌ Failed to fetch user profile or withdrawals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  // Setup socket
  useEffect(() => {
    if (!user?.group_id) {
      console.log("⚠️ No group_id found for user, skipping socket connection.");
      return;
    }

    console.log("🔌 Connecting to socket...");
    const newSocket = io(import.meta.env.VITE_API_BASE_URL, {
      transports: ["websocket"],
    });
    setSocket(newSocket);
    newSocket.emit("join_group", { group_id: user.group_id });
    console.log("✅ Joined socket room for group:", user.group_id);

    newSocket.on("withdrawal_created", (data) => {
      console.log("📥 New withdrawal created:", data);
      setWithdrawals((prev) => [
        { ...data, voted: false },
        ...prev,
      ]);
    });

    newSocket.on("withdrawal_updated", (data) => {
      console.log("♻️ Withdrawal updated:", data);
      setWithdrawals((prev) =>
        prev.map((w) => (w.id === data.id ? { ...w, ...data } : w))
      );
    });

    return () => {
      console.log("🔌 Disconnecting socket...");
      newSocket.disconnect();
    };
  }, [user]);

  // Vote handler
  const voteWithdrawal = async (id, type) => {
    try {
      console.log(`🗳️ Voting ${type.toUpperCase()} on withdrawal ID:`, id);
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/withdrawal/${type}/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Mark as voted locally
      setWithdrawals((prev) =>
        prev.map((w) => (w.id === id ? { ...w, voted: true } : w))
      );
      console.log("✅ Vote successful, updated withdrawals state.");
    } catch (err) {
      console.error("❌ Failed to vote withdrawal:", err);
      alert("Failed to vote withdrawal");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-3xl space-y-6 animate-pulse">
          <div className="h-10 bg-gray-300 rounded w-1/2 mx-auto"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-6 border rounded-2xl shadow-md bg-gray-100"
              >
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

  console.log("👤 Final user state:", user);
  console.log("📋 Final withdrawals state:", withdrawals);

  return (
    <div className="flex flex-col min-h-screen">
      <ProminentAppBar />
      <main className="p-6 text-center space-y-6 pb-24">
        <h1 className="text-2xl font-bold text-black-600 mb-4">
          Welcome, {user?.name?.split(" ")[0]}
        </h1>

        {/* Account Summary */}
        <AccountSummary
          userMonthlyTotal={user?.monthly_total}
          groupName={user?.group_name}
        />

        <ContributionStreakTable />

        {/* 🔹 Pending Withdrawals */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Pending Withdrawals</h2>
          {withdrawals.length ? (
            withdrawals.map((w) =>
              w.status === "pending" ? (
                <div
                  key={w.id}
                  className="p-4 border rounded flex justify-between items-center mb-2"
                >
                  <p>
                    {w.requested_by} requested Ksh {w.amount} for {w.reason}
                  </p>

                  {/* Only show vote buttons for non-admins who haven't voted */}
                  {!user.is_admin && !w.voted && (
                    <div className="space-x-2">
                      <button
                        onClick={() => voteWithdrawal(w.id, "approve")}
                        className="bg-green-600 text-white px-3 py-1 rounded"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => voteWithdrawal(w.id, "reject")}
                        className="bg-red-600 text-white px-3 py-1 rounded"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {/* If already voted */}
                  {!user.is_admin && w.voted && (
                    <p className="text-gray-500 italic">You already voted</p>
                  )}
                </div>
              ) : null
            )
          ) : (
            <p>No pending withdrawals</p>
          )}
        </div>
      </main>
      <Nav />
    </div>
  );
}

export default Dashboard;