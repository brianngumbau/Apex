import React from "react";
import Nav from "../components/Navbar";
import Profile from "../components/Card";

function Dashboard() {
    console.log("Dashboard Rendered!");  // Debugging in Console
    return (
      <div>
               

        <h1 className="text-3xl font-bold text-blue-500">Welcome to the Dashboard</h1>
        <p>If you see this, the Dashboard page is rendering correctly.</p>

        <Profile />
      </div>
    );
  }
  
  export default Dashboard;  