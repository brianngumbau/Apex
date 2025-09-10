import React, { useState } from "react";
import Nav from "../components/Navbar";
import ProminentAppBar from "../components/header";
import axios from "axios";
import { CreditCard, Wallet, TrendingUp } from "lucide-react";

export default function FinanceUtilities() {
  const [contributionAmount, setContributionAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [repayAmount, setRepayAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  console.log("Token in FinanceUtilities:", token);

  // Handle Contributions
  const handleContribute = async () => {
    if (!contributionAmount) return alert("Please enter an amount.");
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/mpesa/stkpush",
        { amount: parseFloat(contributionAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message || "STK Push initiated");
      setContributionAmount("");
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.error ||
          "Failed to initiate STK Push. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Borrow Loan
  const handleBorrow = async () => {
    if (!borrowAmount) return alert("Please enter an amount.");
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/loans/request",
        { amount: parseFloat(borrowAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message || "Loan request submitted");
      setBorrowAmount("");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "Failed to request loan.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Repay Loan
  const handleRepay = async () => {
    if (!repayAmount) return alert("Please enter an amount.");
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/loans/repay",
        { amount: parseFloat(repayAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message || "Repayment initiated");
      setRepayAmount("");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "Failed to repay loan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ProminentAppBar />
      <div className="bg-white min-h-screen py-12 px-6 md:px-20">
        <h1 className="text-4xl font-bold text-gray-900 mb-12 text-center">
          Finance Utilities
        </h1>

        {/* Responsive grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Contribute Funds */}
          <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-8 hover:shadow-xl transition">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-black" />
              <h2 className="text-2xl font-semibold text-gray-900">
                Contribute Funds
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              Contribute to various investment opportunities and grow your
              wealth.
            </p>
            <input
              type="number"
              placeholder="Enter amount"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              className="w-full px-4 py-3 mb-5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
            />
            <button
              onClick={handleContribute}
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-70"
            >
              {loading ? "Processing..." : "Contribute Now"}
            </button>
          </div>

          {/* Borrow Loan */}
          <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-8 hover:shadow-xl transition">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-6 h-6 text-black" />
              <h2 className="text-2xl font-semibold text-gray-900">
                Borrow Loan
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              Borrow funds with flexible repayment options tailored to your
              financial needs.
            </p>
            <input
              type="number"
              placeholder="Enter amount"
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(e.target.value)}
              className="w-full px-4 py-3 mb-5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
            />
            <button
              onClick={handleBorrow}
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-70"
            >
              {loading ? "Processing..." : "Borrow Now"}
            </button>
          </div>

          {/* Repay Loan (full width on desktop) */}
          <div className="md:col-span-2 bg-white border border-gray-200 shadow-lg rounded-2xl p-8 hover:shadow-xl transition">
            <div className="flex items-center gap-3 mb-4">
              <Wallet className="w-6 h-6 text-black" />
              <h2 className="text-2xl font-semibold text-gray-900">
                Repay Loan
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              Manage and repay your existing loans efficiently with our
              user-friendly tools.
            </p>
            <input
              type="number"
              placeholder="Enter repayment amount"
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
              className="w-full px-4 py-3 mb-5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
            />
            <button
              onClick={handleRepay}
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-70"
            >
              {loading ? "Processing..." : "Repay Now"}
            </button>
          </div>
        </div>
      </div>
      <Nav />
    </>
  );
}