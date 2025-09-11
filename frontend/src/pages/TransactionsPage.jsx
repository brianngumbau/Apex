import React, { useEffect, useState } from "react";
import Nav from "../components/Navbar";
import ProminentAppBar from "../components/header";

const BACKEND_URL = "http://maziwa-90gd.onrender.com";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/transactions/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load transactions.");
        }

        setTransactions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [token]);

  return (
    <>
      <ProminentAppBar />
      <div className="max-w-4xl mx-auto mt-10 px-4">
        <h1 className="text-2xl font-bold text-center mb-6">Your Transactions</h1>

        {loading && <p className="text-center text-gray-600">Loading transactions...</p>}

        {error && (
          <p className="text-center text-red-500 bg-red-100 py-2 px-4 rounded">{error}</p>
        )}

        {!loading && !error && transactions.length === 0 && (
          <p className="text-center text-gray-500">You have no transactions yet.</p>
        )}

        {!loading && transactions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow rounded">
              <thead className="bg-gray-100 text-gray-600 text-sm">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-t">
                    <td className="p-3">{new Date(tx.date).toLocaleString()}</td>
                    <td className="p-3">{tx.type}</td>
                    <td className="p-3">KES {tx.amount.toFixed(2)}</td>
                    <td className="p-3">{tx.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Nav />
    </>
  );
}