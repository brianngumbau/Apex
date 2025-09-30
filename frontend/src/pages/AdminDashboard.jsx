// frontend/src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import debounce from "../utils/debounce";

import DashboardHeader from "../components/DashboardHeader";
import WithdrawalForm from "../components/withdrawalForm";
import AnnouncementForm from "../components/AnnouncementForm";
import AnnouncementList from "../components/AnnouncementList";
import MemberContributions from "../components/MemberContributions";
import PendingLoans from "../components/PendingLoans";
import PendingWithdrawalsList from "../components/PendingWithdrawalsList";
import PendingJoinRequests from "../components/PendingJoinRequests";
import ToastNotification from "../components/ToastNotification";
import DailyContributionForm from "../components/DailyContributionForm";
import LoanPolicy from "../components/LoanPolicy"; // ✅

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [approvedLoans, setApprovedLoans] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [toastMessage, setToastMessage] = useState("");
  const [dailyAmount, setDailyAmount] = useState("");
  const [socket, setSocket] = useState(null);

  const token = localStorage.getItem("token");
  const API_BASE = import.meta.env.VITE_API_BASE_URL;
  const user = JSON.parse(localStorage.getItem("user"));

  // --- Fetch dashboard data ---
  const fetchDashboard = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/admin/groups/${user.group_id}/admin_dashboard`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDashboard(res.data);
      setAnnouncements(res.data.announcements || []);
      setWithdrawals(res.data.pending_withdrawals || []);
      setJoinRequests(res.data.pending_join_requests || []);
      setDailyAmount(res.data.daily_contribution_amount || "");
    } catch (err) {
      console.error("Failed to load admin dashboard", err);
      setToastMessage("Failed to load admin dashboard");
    }
  };

  const debouncedFetchDashboard = debounce(fetchDashboard, 500);

  useEffect(() => {
    fetchDashboard();

    const newSocket = io(API_BASE, {
      auth: { token },
    });
    setSocket(newSocket);

    newSocket.on("contribution_made", debouncedFetchDashboard);
    newSocket.on("join_request_updated", debouncedFetchDashboard);
    newSocket.on("loan_updated", debouncedFetchDashboard);
    newSocket.on("withdrawal_updated", debouncedFetchDashboard);
    newSocket.on("announcement_updated", debouncedFetchDashboard);

    return () => newSocket.close();
  }, []);

  // --- API Actions ---
  const submitWithdrawal = async (amount, reason) => {
    try {
      await axios.post(
        `${API_BASE}/admin/groups/${user.group_id}/withdrawals`,
        { amount, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToastMessage("Withdrawal request submitted");
      fetchDashboard();
    } catch (err) {
      console.error(err);
      setToastMessage("Failed to submit withdrawal");
    }
  };

  const postAnnouncement = async (title, message) => {
    try {
      await axios.post(
        `${API_BASE}/admin/groups/${user.group_id}/announcements`,
        { title, message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToastMessage("Announcement posted");
      fetchDashboard();
    } catch (err) {
      console.error(err);
      setToastMessage("Failed to post announcement");
    }
  };

  const deleteAnnouncement = async (id) => {
    try {
      await axios.delete(
        `${API_BASE}/admin/groups/${user.group_id}/announcements/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToastMessage("Announcement deleted");
      fetchDashboard();
    } catch (err) {
      console.error(err);
      setToastMessage("Failed to delete announcement");
    }
  };

  const approveLoan = async (loanId) => {
    try {
      await axios.post(
        `${API_BASE}/admin/groups/${user.group_id}/loans/${loanId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApprovedLoans((prev) => [...prev, loanId]);
      setToastMessage("Loan approved");
      fetchDashboard();
    } catch (err) {
      console.error(err);
      setToastMessage("Failed to approve loan");
    }
  };

  const cancelWithdrawal = async (id) => {
    try {
      await axios.post(
        `${API_BASE}/admin/groups/${user.group_id}/withdrawals/${id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToastMessage("Withdrawal cancelled");
      fetchDashboard();
    } catch (err) {
      console.error(err);
      setToastMessage("Failed to cancel withdrawal");
    }
  };

  const approveJoinRequest = async (id) => {
    try {
      await axios.post(
        `${API_BASE}/admin/groups/${user.group_id}/join_requests/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToastMessage("Join request approved");
      fetchDashboard();
    } catch (err) {
      console.error(err);
      setToastMessage("Failed to approve join request");
    }
  };

  const rejectJoinRequest = async (id) => {
    try {
      await axios.post(
        `${API_BASE}/admin/groups/${user.group_id}/join_requests/${id}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToastMessage("Join request rejected");
      fetchDashboard();
    } catch (err) {
      console.error(err);
      setToastMessage("Failed to reject join request");
    }
  };

  const updateDailyAmount = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_BASE}/admin/groups/${user.group_id}/daily_contribution`,
        { daily_amount: dailyAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToastMessage("Daily contribution updated");
      fetchDashboard();
    } catch (err) {
      console.error(err);
      setToastMessage("Failed to update daily contribution");
    }
  };

  if (!dashboard) return <p>Loading...</p>;

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader dashboard={dashboard} />

      {/* ✅ Daily Contribution Form */}
      <DailyContributionForm
        dailyAmount={dailyAmount}
        setDailyAmount={setDailyAmount}
        onUpdate={updateDailyAmount}
      />

      {/* ✅ Loan Policy Form */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Loan Policy</h2>
        <LoanPolicy groupId={dashboard.group_id} token={token} />
      </div>

      {/* ✅ Withdrawal & Announcements */}
      <WithdrawalForm onSubmit={submitWithdrawal} />
      <AnnouncementForm onSubmit={postAnnouncement} />
      <AnnouncementList
        announcements={announcements}
        onDelete={deleteAnnouncement}
      />

      {/* ✅ Members, Loans, Withdrawals, Join Requests */}
      <MemberContributions members={dashboard.member_contributions} />
      <PendingLoans
        loans={dashboard.pending_loans}
        approvedLoans={approvedLoans}
        onApprove={approveLoan}
      />
      <PendingWithdrawalsList
        withdrawals={withdrawals}
        onCancel={cancelWithdrawal}
      />
      <PendingJoinRequests
        requests={joinRequests}
        onApprove={approveJoinRequest}
        onReject={rejectJoinRequest}
      />

      <ToastNotification message={toastMessage} />
    </div>
  );
};

export default AdminDashboard;