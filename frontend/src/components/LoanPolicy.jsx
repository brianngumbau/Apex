// frontend/src/components/LoanPolicy.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const LoanPolicy = ({ groupId, token, initialRate = 0, initialFrequency = "monthly" }) => {
  const [interestRate, setInterestRate] = useState(initialRate ?? "");
  const [interestFrequency, setInterestFrequency] = useState(initialFrequency ?? "monthly");
  const [message, setMessage] = useState("");
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    setInterestRate(initialRate ?? "");
    setInterestFrequency(initialFrequency ?? "monthly");
  }, [initialRate, initialFrequency]);

  const updatePolicy = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${API_BASE}/admin/groups/${groupId}/loan_policy`,
        {
          loan_interest_rate: Number(interestRate),
          loan_interest_frequency: interestFrequency, // must match the enum: 'daily'|'monthly'|'yearly'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("✅ Loan policy updated successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("updatePolicy:", err);
      setMessage(err.response?.data?.error || "Failed to update loan policy");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <form onSubmit={updatePolicy} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Interest Rate (decimal, e.g. 0.02 = 2%)</label>
          <input
            type="number"
            step="0.0001"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Interest Frequency</label>
          <select
            value={interestFrequency}
            onChange={(e) => setInterestFrequency(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded shadow">
          Save Policy
        </button>
      </form>

      {message && <p className="mt-4 text-sm text-green-600 font-medium">{message}</p>}

      <div className="mt-6 bg-gray-50 p-4 rounded">
        <h3 className="font-semibold mb-2">Current Policy</h3>
        <p>Interest Rate: <strong>{Number(interestRate)}</strong></p>
        <p>Frequency: <strong>{interestFrequency}</strong></p>
      </div>
    </div>
  );
};

export default LoanPolicy;