import React from "react";
import Nav from "../components/Navbar";

function Dashboard() {
    console.log("Dashboard Rendered!");  // Debugging in Console
    return (
      <>
      <div>
            <h1 className="text-3xl font-bold text-black-500">Welcome to the Dashboard</h1>
            <p>If you see this, the Dashboard page is rendering correctly.</p>
      </div>
       <Nav /> 
      </>
    );
  }
  
  export default Dashboard;  