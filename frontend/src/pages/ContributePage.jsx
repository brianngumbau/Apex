import React, { useState } from "react";
import Nav from "../components/Navbar";
import ProminentAppBar from "../components/header";



const BACKEND_URL = "https://maziwa-90gd.onrender.com";

export default function ContributePage() {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const handleContribute = async () => {
    setMessage("");
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setMessage("Please enter a valid positive amount.");
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/contribute`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ amount: Number(amount) }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Contribution failed");
      }

      setMessage(data.message || "Contribution successful!");
      setAmount("");
    } catch (err) {
      setMessage(err.message || "Error processing contribution");
    }
  };

  return (

    <>
    <ProminentAppBar />
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded space-y-4">
      <h1 className="text-2xl font-bold text-center text-gray-800">Contribute Funds</h1>

      {message && (
        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded">{message}</div>
      )}

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full p-2 border rounded"
        placeholder="Enter amount to contribute"
      />

      <button
        onClick={handleContribute}
        className="w-full bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
      >
        Submit Contribution
      </button>
    </div>
    <Nav />
    </>
  );
}
