import React from "react";

const DailyContributionForm = ({ dailyAmount, setDailyAmount, onUpdate }) => {
  return (
    <form
      onSubmit={onUpdate}
      className="bg-white p-4 rounded-lg shadow space-y-3"
    >
      <h2 className="text-lg font-semibold">Daily Contribution</h2>
      <div className="flex items-center space-x-3">
        <input
          type="number"
          value={dailyAmount}
          onChange={(e) => setDailyAmount(e.target.value)}
          className="flex-1 p-2 border rounded"
          placeholder="Enter daily amount"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Update
        </button>
      </div>
    </form>
  );
};

export default DailyContributionForm;