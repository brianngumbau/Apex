import React from "react";

const DailyContributionForm = ({ dailyAmount, setDailyAmount, onUpdate }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Daily Contribution Amount</h2>
      <form onSubmit={onUpdate} className="flex space-x-2">
        <input
          type="number"
          value={dailyAmount}
          onChange={(e) => setDailyAmount(e.target.value)}
          className="p-2 border rounded flex-1"
          placeholder="Enter amount"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Update
        </button>
      </form>
    </div>
  );
};

export default DailyContributionForm;