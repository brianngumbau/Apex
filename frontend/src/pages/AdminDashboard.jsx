// frontend/src/pages/AdminDashboard.jsx
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import debounce from "../utils/debounce";

import DashboardHeader from "../components/DashboardHeader";
import WithdrawalForm from "../components/WithdrawalForm";
import AnnouncementForm from "../components/AnnouncementForm";
import AnnouncementList from "../components/AnnouncementList";
import MemberContributions from "../components/MemberContributions";
import PendingWithdrawalsList from "../components/PendingWithdrawalsList";
import PendingJoinRequests from "../components/PendingJoinRequests";
import ToastNotification from "../components/ToastNotification";
import DailyContributionForm from "../components/DailyContributionForm";
import LoanPolicy from "../components/LoanPolicy";

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [toastMessage, setToastMessage] = useState("");
  const [dailyAmount, setDailyAmount] = useState("");
  const [socket, setSocket] = useState(null);

  const token = localStorage.getItem("token");
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch (e) {
    user = null;
  }
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // --- Fetch announcements (separate group endpoint) ---
  const fetchAnnouncements = useCallback(async () => {
    if (!user?.group_id) return;
    try {
      const res = await axios.get(`${API_BASE}/group/${user.group_id}/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnnouncements(res.data || []);
    } catch (err) {
      console.error("Failed to fetch announcements", err);
      // keep silent / show toast if you want
    }
  }, [API_BASE, token, user]);

  // --- Fetch dashboard data ---
  const fetchDashboard = useCallback(async () => {
    if (!user?.group_id) return;
    try {
      const res = await axios.get(
        `${API_BASE}/admin/groups/${user.group_id}/admin_dashboard`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = res.data || {};
      setDashboard(data);

      // Admin dashboard returns pending_withdrawals (named fields may differ)
      const mappedWithdrawals = (data.pending_withdrawals || []).map((w) => ({
        id: w.withdrawal_id ?? w.id,
        transaction_id: w.transaction_id,
        amount: w.amount,
        requested_by: w.requested_by ?? (w.transaction_user_name || null),
        approvals: w.approvals ?? 0,
        rejections: w.rejections ?? 0,
        date: w.date ?? (w.transaction_date ?? null),
        status: "pending", // admin_dashboard only returns pending ones
        reason: w.reason ?? null, // may be undefined depending on backend
      }));
      setWithdrawals(mappedWithdrawals);

      setJoinRequests(data.pending_join_requests || []);
      // announcements are fetched separately
      setDailyAmount(data.daily_contribution_amount ?? "");
    } catch (err) {
      console.error("Failed to load admin dashboard", err);
      setToastMessage("Failed to load admin dashboard");
    }
  }, [API_BASE, token, user]);

  const debouncedFetchDashboard = useCallback(debounce(fetchDashboard, 500), [fetchDashboard]);

  useEffect(() => {
    if (!user?.group_id) return;

    // initial data
    fetchDashboard();
    fetchAnnouncements();

    // socket: force websocket transport (like your original big file)
    const newSocket = io(API_BASE, {
      transports: ["websocket"],
      auth: { token },
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("✅ Connected to socket server");
      // join the room for this group on the server
      newSocket.emit("join_group", { group_id: user.group_id });
    });

    // Real-time events (listen to the same events you used in the big dashboard)
    newSocket.on("withdrawal_created", () => {
      fetchDashboard();
    });
    newSocket.on("withdrawal_updated", debouncedFetchDashboard);
    newSocket.on("announcement_created", () => fetchAnnouncements());
    newSocket.on("announcement_deleted", (announcementId) => {
      setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));
    });
    newSocket.on("loan_approved", debouncedFetchDashboard);
    newSocket.on("join_request_updated", debouncedFetchDashboard);
    newSocket.on("contribution_made", debouncedFetchDashboard);

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE, token, fetchDashboard, fetchAnnouncements, debouncedFetchDashboard, user?.group_id]);

    // Keep dailyAmount synced when dashboard updates
  useEffect(() => {
    if (dashboard?.daily_contribution_amount !== undefined) {
      setDailyAmount(dashboard.daily_contribution_amount);
    }
  }, [dashboard?.daily_contribution_amount]);


  // --- API Actions ---
  const submitWithdrawal = async (amount, reason) => {
    if (!user?.group_id) return setToastMessage("Missing group info");
    try {
      await axios.post(
        `${API_BASE}/withdrawal/request`,
        { amount: Number(amount), reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToastMessage("Withdrawal request submitted");
      fetchDashboard();
    } catch (err) {
      console.error("submitWithdrawal:", err);
      setToastMessage("Failed to submit withdrawal");
    }
  };

  const postAnnouncement = async (title, message) => {
    if (!user?.group_id) return setToastMessage("Missing group info");
    try {
      await axios.post(
        `${API_BASE}/group/${user.group_id}/announcements`,
        { title, message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToastMessage("Announcement posted");
      fetchAnnouncements();
    } catch (err) {
      console.error("postAnnouncement:", err);
      setToastMessage("Failed to post announcement");
    }
  };

  const deleteAnnouncement = async (id) => {
    if (!user?.group_id) return setToastMessage("Missing group info");
    try {
      await axios.delete(`${API_BASE}/group/${user.group_id}/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setToastMessage("Announcement deleted");
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("deleteAnnouncement:", err);
      setToastMessage("Failed to delete announcement");
    }
  };

  const cancelWithdrawal = async (id) => {
    try {
      await axios.post(`${API_BASE}/withdrawals/${id}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setToastMessage("Withdrawal cancelled");
      fetchDashboard();
    } catch (err) {
      console.error("cancelWithdrawal:", err);
      setToastMessage("Failed to cancel withdrawal");
    }
  };

  const approveJoinRequest = async (id) => {
    try {
      await axios.post(`${API_BASE}/group/join/approve/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setToastMessage("Join request approved");
      fetchDashboard();
    } catch (err) {
      console.error("approveJoinRequest:", err);
      setToastMessage("Failed to approve join request");
    }
  };

  const rejectJoinRequest = async (id) => {
    try {
      await axios.post(`${API_BASE}/group/join/reject/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setToastMessage("Join request rejected");
      fetchDashboard();
    } catch (err) {
      console.error("rejectJoinRequest:", err);
      setToastMessage("Failed to reject join request");
    }
  };

  const updateDailyAmount = async (e) => {
    e.preventDefault();
    if (!user?.group_id) return setToastMessage("Missing group info");
    try {
      await axios.post(
        `${API_BASE}/admin/groups/${user.group_id}/set_daily_amount`,
        { amount: Number(dailyAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToastMessage("Daily contribution updated");
      fetchDashboard();
    } catch (err) {
      console.error("updateDailyAmount:", err);
      setToastMessage("Failed to update daily contribution");
    }
  };

  if (!dashboard) return <p>Loading...</p>;

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader dashboard={dashboard} />

      <DailyContributionForm
        dailyAmount={dailyAmount}
        setDailyAmount={setDailyAmount}
        onUpdate={updateDailyAmount}
      />

      {/* Loan Policy - uses admin PUT endpoint for updates */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Loan Policy</h2>
        <LoanPolicy
          groupId={dashboard.group_id}
          token={token}
          initialRate={dashboard.loan_interest_rate}
          initialFrequency={dashboard.loan_interest_frequency}
        />
      </div>

      {/* Withdrawal & Announcements */}
      <WithdrawalForm onSubmit={submitWithdrawal} />
      <AnnouncementForm onSubmit={postAnnouncement} />
      <AnnouncementList announcements={announcements} onDelete={deleteAnnouncement} />

      {/* Members, Withdrawals, Join Requests */}
      <MemberContributions members={dashboard.members} />
      <PendingWithdrawalsList withdrawals={withdrawals} onCancel={cancelWithdrawal} />
      <PendingJoinRequests requests={joinRequests} onApprove={approveJoinRequest} onReject={rejectJoinRequest} />

      <ToastNotification message={toastMessage} />
    </div>
  );
};

export default AdminDashboard;