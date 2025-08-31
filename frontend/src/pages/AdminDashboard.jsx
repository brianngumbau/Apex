import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dailyAmount, setDailyAmount] = useState("");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

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

  const approveLoan = async (loanId) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/groups/${user.group_id}/loans/${loanId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDashboard();
    } catch (err) {
      console.error(err);
      alert("Failed to approve loan");
    }
  };

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
      alert("Failed to update daily amount");
    }
  };

  useEffect(() => {
    if (user?.group_id) fetchDashboard();
  }, [user]);

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
        <span className="font-semibold">Ksh {dashboard.daily_contribution_amount}</span>
      </p>

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
                className="bg-green-600 text-white px-4 py-2 rounded shadow"
              >
                Approve
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
        {dashboard.pending_withdrawals?.length ? (
          dashboard.pending_withdrawals.map((w) => (
            <div
              key={w.withdrawal_id}
              className="p-4 border rounded mb-2 bg-gray-50"
            >
              <p>
                Request of Ksh {w.amount} by {w.requested_by || "Admin"} on{" "}
                {new Date(w.date).toLocaleDateString()}
              </p>
              <p>
                Approvals: {w.approvals} | Rejections: {w.rejections}
              </p>
            </div>
          ))
        ) : (
          <p>No pending withdrawals</p>
        )}
      </div>
    </main>
  );
};

export default AdminDashboard;