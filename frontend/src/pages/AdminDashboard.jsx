// AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dailyAmount, setDailyAmount] = useState("");

  //  Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");

  //  Approved loans & toast notification
  const [approvedLoans, setApprovedLoans] = useState([]);
  const [toastMessage, setToastMessage] = useState("");

  //  Withdrawals
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalReason, setWithdrawalReason] = useState("");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  //  Socket setup
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user?.group_id) return;

    // Force WebSocket transport to avoid endless polling
    const newSocket = io(import.meta.env.VITE_API_BASE_URL, {
      transports: ["websocket"],
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("✅ Connected to socket server");
      newSocket.emit("join_group", { group_id: user.group_id });
    });

    // Real-time listeners
    newSocket.on("withdrawal_created", (data) => {
      setWithdrawals((prev) => [data, ...prev]);
    });

    newSocket.on("withdrawal_updated", (data) => {
      setWithdrawals((prev) =>
        prev.map((w) => (w.id === data.id ? { ...w, ...data } : w))
      );
    });

    newSocket.on("announcement_created", (data) => {
      setAnnouncements((prev) => [data, ...prev]);
    });

    newSocket.on("announcement_deleted", (id) => {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    });

    newSocket.on("loan_approved", (loanId) => {
      setApprovedLoans((prev) => [...prev, loanId]);
      setToastMessage(`Loan ${loanId} approved (real-time)!`);
      setTimeout(() => setToastMessage(""), 3000);
    });

    newSocket.on("join_request_updated", () => {
      fetchDashboard(); // refresh join requests
    });

    newSocket.on("contribution_made", () => {
      fetchDashboard(); // refresh contributions
    });

    return () => newSocket.disconnect();
  }, [user]);

  //  Fetch dashboard data
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/admin/groups/${user.group_id}/admin_dashboard`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDashboard(res.data);
      setDailyAmount(res.data.daily_contribution_amount || "");
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  //  Fetch announcements
  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/group/${user.group_id}/announcements`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnnouncements(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  //  Fetch withdrawals
  const fetchWithdrawals = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/withdrawals/group`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWithdrawals(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  //  Delete announcement
  const deleteAnnouncement = async (id) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/group/${user.group_id}/announcements/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete announcement");
    }
  };

  //  Approve loan
  const approveLoan = async (loanId) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/groups/${user.group_id}/loans/${loanId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setApprovedLoans((prev) => [...prev, loanId]);
      setToastMessage(`Loan ${loanId} approved successfully!`);
      setTimeout(() => setToastMessage(""), 3000);

      fetchDashboard();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to approve loan");
    }
  };

  //  Approve join request
  const approveJoin = async (requestId) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/group/join/approve/${requestId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDashboard();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to approve join request");
    }
  };

  //  Reject join request
  const rejectJoin = async (requestId) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/group/join/reject/${requestId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDashboard();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to reject join request");
    }
  };

  //  Update daily contribution amount
  const updateDailyAmount = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/groups/${user.group_id}/set_daily_amount`,
        { amount: dailyAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDashboard();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to update daily amount");
    }
  };

  //  Post announcement
  const postAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/group/${user.group_id}/announcements`,
        { title: announcementTitle, message: announcementMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnnouncementTitle("");
      setAnnouncementMessage("");
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to post announcement");
    }
  };

  //  Submit withdrawal request
  const submitWithdrawal = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/withdrawal/request`,
        { amount: Number(withdrawalAmount), reason: withdrawalReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWithdrawalAmount("");
      setWithdrawalReason("");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to submit withdrawal request");
    }
  };


//  Cancel withdrawal
const cancelWithdrawal = async (id) => {
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/withdrawals/${id}/cancel`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const { message, amount, requested_by } = res.data;

    // Remove it from state
    setWithdrawals((prev) => prev.filter((w) => w.id !== id));

    // Show a friendly toast with amount and requester
    setToastMessage(
      `Withdrawal of Ksh ${amount} by ${requested_by} cancelled successfully!`
    );
    setTimeout(() => setToastMessage(""), 4000);
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.error || "Failed to cancel withdrawal");
  }
};

  // Initial load
  useEffect(() => {
    if (user?.group_id) {
      fetchDashboard();
      fetchAnnouncements();
      fetchWithdrawals();
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading admin dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <main className="p-6 space-y-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-center">
        Admin Dashboard – {dashboard.group_name}
      </h1>
      <p className="text-center text-gray-600">
        {dashboard.month} | Daily contribution:{" "}
        <span className="font-semibold">
          Ksh {dashboard.daily_contribution_amount}
        </span>
      </p>

      {/* 🔹 Withdrawal Request Form */}
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-4">Request Withdrawal</h2>
        <form className="space-y-3" onSubmit={submitWithdrawal}>
          <input
            type="number"
            placeholder="Amount"
            value={withdrawalAmount}
            onChange={(e) => setWithdrawalAmount(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
          <input
            type="text"
            placeholder="Reason"
            value={withdrawalReason}
            onChange={(e) => setWithdrawalReason(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded shadow"
          >
            Submit
          </button>
        </form>
      </div>

      {/* Set Daily Contribution */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Set Daily Contribution</h2>
        <form onSubmit={updateDailyAmount} className="flex space-x-4">
          <input
            type="number"
            value={dailyAmount}
            onChange={(e) => setDailyAmount(e.target.value)}
            className="border px-3 py-2 rounded w-40"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded shadow"
          >
            Update
          </button>
        </form>
      </div>

      {/* Admin Announcements */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Make Announcement</h2>
        <form onSubmit={postAnnouncement} className="space-y-4">
          <input
            type="text"
            value={announcementTitle}
            onChange={(e) => setAnnouncementTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full border px-3 py-2 rounded"
          />
          <textarea
            value={announcementMessage}
            onChange={(e) => setAnnouncementMessage(e.target.value)}
            rows="3"
            placeholder="Write an announcement..."
            className="w-full border px-3 py-2 rounded"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded shadow"
          >
            Post Announcement
          </button>
        </form>

        {/* Show announcements */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Recent Announcements</h3>
          {announcements.length ? (
            <ul className="space-y-3">
              {announcements.map((a) => (
                <li
                  key={a.id}
                  className="p-4 border rounded bg-gray-50 shadow-sm flex justify-between items-start"
                >
                  <div>
                    <h4 className="font-semibold">{a.title || "No Title"}</h4>
                    <p className="text-gray-700">{a.message}</p>
                    <span className="text-xs text-gray-500">
                      {new Date(a.created_at).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteAnnouncement(a.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded shadow ml-4"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No announcements yet.</p>
          )}
        </div>
      </div>

      {/* Member Contributions */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Member Contributions</h2>
        {dashboard.members?.length ? (
          <table className="min-w-full border rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">Contributed</th>
                <th className="px-4 py-2 border">Required</th>
                <th className="px-4 py-2 border">Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.members.map((m) => (
                <tr key={m.member_id}>
                  <td className="border px-4 py-2">{m.name}</td>
                  <td className="border px-4 py-2">{m.total_contributed}</td>
                  <td className="border px-4 py-2">{m.required_so_far}</td>
                  <td
                    className={`border px-4 py-2 font-semibold ${
                      m.status === "met" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {m.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No members yet</p>
        )}
      </div>

      {/* Pending Loans */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Pending Loans</h2>
        {dashboard.pending_loans?.length ? (
          dashboard.pending_loans.map((loan) => (
            <div
              key={loan.loan_id}
              className="p-4 border rounded flex justify-between items-center mb-2"
            >
              <p>
                {loan.member_name} requested Ksh {loan.amount} on{" "}
                {new Date(loan.date).toLocaleDateString()}
              </p>
              <button
                onClick={() => approveLoan(loan.loan_id)}
                disabled={approvedLoans.includes(loan.loan_id)}
                className={`px-4 py-2 rounded shadow text-white ${
                  approvedLoans.includes(loan.loan_id)
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600"
                }`}
              >
                {approvedLoans.includes(loan.loan_id) ? "Approved" : "Approve"}
              </button>
            </div>
          ))
        ) : (
          <p>No pending loans</p>
        )}
      </div>

    {/* Pending Withdrawals */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Pending Withdrawals</h2>
        {withdrawals.length ? (
          withdrawals.map((w) => (
            <div
              key={w.id}
              className="p-4 border rounded mb-2 bg-gray-50 flex justify-between items-center"
            >
              <div>
                <p>
                  Request of Ksh {w.amount} by {w.requested_by || "Admin"} for{" "}
                  {w.reason} on {new Date(w.date).toLocaleDateString()}
                </p>
                <p>
                  Status: {w.status} | Approvals: {w.approvals} | Rejections:{" "}
                  {w.rejections}
                </p>
              </div>

              {w.status === "pending" && (
                <button
                  onClick={() => cancelWithdrawal(w.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded shadow ml-4"
                >
                  Cancel
                </button>
              )}
            </div>
          ))
        ) : (
          <p>No pending withdrawals</p>
        )}
      </div>


      {/* Pending Join Requests */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Pending Join Requests</h2>
        {dashboard.pending_join_requests?.length ? (
          dashboard.pending_join_requests.map((req) => (
            <div
              key={req.id}
              className="p-4 border rounded flex justify-between items-center mb-2"
            >
              <p>
                {req.user_name} requested to join on{" "}
                {new Date(req.date).toLocaleDateString()}
              </p>
              <div className="space-x-2">
                <button
                  onClick={() => approveJoin(req.id)}
                  className="bg-green-600 text-white px-4 py-2 rounded shadow"
                >
                  Approve
                </button>
                <button
                  onClick={() => rejectJoin(req.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded shadow"
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No join requests</p>
        )}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow">
          {toastMessage}
        </div>
      )}
    </main>
  );
};

export default AdminDashboard;