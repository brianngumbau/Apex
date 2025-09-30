// LoanPolicy.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const LoanPolicy = ({ groupId, token }) => {
  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState(null);
  const [interestRate, setInterestRate] = useState("");
  const [method, setMethod] = useState("flat");
  const [message, setMessage] = useState("");

  // Fetch loan policy
  const fetchPolicy = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/admin/groups/${groupId}/loan_policy`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPolicy(res.data);
      setInterestRate(res.data.interest_rate);
      setMethod(res.data.method);
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch loan policy");
    } finally {
      setLoading(false);
    }
  };

  // Update policy
  const updatePolicy = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/groups/${groupId}/loan_policy`,
        { interest_rate: Number(interestRate), method },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPolicy(res.data);
      setMessage("✅ Loan policy updated successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Failed to update loan policy");
    }
  };

  useEffect(() => {
    if (groupId) fetchPolicy();
  }, [groupId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6 text-gray-500">
        Loading loan policy...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Loan Policy</h2>

      <form onSubmit={updatePolicy} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Interest Rate (%)</label>
          <input
            type="number"
            step="0.1"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Interest Method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="flat">Flat</option>
            <option value="reducing">Reducing Balance</option>
          </select>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded shadow"
        >
          Save Policy
        </button>
      </form>

      {message && (
        <p className="mt-4 text-sm text-green-600 font-medium">{message}</p>
      )}

      {policy && (
        <div className="mt-6 bg-gray-50 p-4 rounded">
          <h3 className="font-semibold mb-2">Current Policy</h3>
          <p>
            Interest Rate: <strong>{policy.interest_rate}%</strong>
          </p>
          <p>
            Method:{" "}
            <strong>
              {policy.method === "flat" ? "Flat" : "Reducing Balance"}
            </strong>
          </p>
        </div>
      )}
    </div>
  );
};

export default LoanPolicy;