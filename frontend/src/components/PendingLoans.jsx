import React from "react";

const PendingLoans = ({ loans, approvedLoans, onApprove }) => (
  <div className="bg-white rounded-2xl shadow-md p-6">
    <h2 className="text-xl font-semibold mb-4">Pending Loans</h2>
    {loans?.length ? (
      loans.map((loan) => (
        <div
          key={loan.loan_id}
          className="p-4 border rounded flex justify-between items-center mb-2"
        >
          <p>
            {loan.member_name} requested Ksh {loan.amount} on{" "}
            {new Date(loan.date).toLocaleDateString()}
          </p>
          <button
            onClick={() => onApprove(loan.loan_id)}
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
);

export default PendingLoans;