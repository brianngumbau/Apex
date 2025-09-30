import React from "react";

const MemberContributions = ({ members }) => (
  <div className="bg-white rounded-2xl shadow-md p-6">
    <h2 className="text-xl font-semibold mb-4">Member Contributions</h2>
    {members?.length ? (
      <table className="min-w-full border rounded">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border">Name</th>
            <th className="px-4 py-2 border">Contributed</th>
            <th className="px-4 py-2 border">Required</th>
            <th className="px-4 py-2 border">Status</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.member_id}>
              <td className="border px-4 py-2">{m.name}</td>
              <td className="border px-4 py-2">{m.total_contributed}</td>
              <td className="border px-4 py-2">{m.required_so_far}</td>
              <td
                className={`border px-4 py-2 font-semibold ${
                  m.status === "met" ? "text-green-600" : "text-red-600"
                }`}
              >
                {m.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <p>No members yet</p>
    )}
  </div>
);

export default MemberContributions;