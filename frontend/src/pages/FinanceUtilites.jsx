import React from 'react';
import Nav from "../components/Navbar";
import ProminentAppBar from "../components/header"; 

export default function FinanceUtilities() {
  return (
    <>
        <ProminentAppBar />
    <div className="bg-white min-h-screen py-12 px-6 md:px-20">
      <h1 className="text-3xl font-bold text-gray-900 mb-10">Finance Utilities</h1>

      {/* Borrow Loan */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Borrow Loan</h2>
        <p className="text-gray-700 mb-4">
          Borrow funds with flexible repayment options tailored to your financial needs.
        </p>
        <input
          type="text"
          placeholder="Enter amount to borrow"
          className="w-full md:w-1/2 px-4 py-2 mb-4 border border-gray-300 rounded bg-white placeholder-gray-500"
        />
        <br />
        <button className="bg-green-500 text-white px-6 py-2 rounded font-medium hover:bg-green-600 transition">
          Borrow Now
        </button>
      </div>

      {/* Repay Loan */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Repay Loan</h2>
        <p className="text-gray-700 mb-4">
          Manage and repay your existing loans efficiently with our user-friendly tools.
        </p>
        <button className="bg-green-500 text-white px-6 py-2 rounded font-medium hover:bg-green-600 transition">
          Repay Now
        </button>
      </div>

      {/* Contribute Funds */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Contribute Funds</h2>
        <p className="text-gray-700 mb-4">
          Contribute funds to various investment opportunities and grow your wealth.
        </p>
        <input
          type="text"
          placeholder="Enter amount to contribute"
          className="w-full md:w-1/2 px-4 py-2 mb-4 border border-gray-300 rounded bg-white placeholder-gray-500"
        />
        <br />
        <button className="bg-green-500 text-white px-6 py-2 rounded font-medium hover:bg-green-600 transition">
          Contribute Now
        </button>
      </div>
    </div>
    <Nav />
    </>
  );
}
