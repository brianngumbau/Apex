import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/Landingpage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import ProtectedRoute from "./routes/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import GroupPage from './pages/GroupPage';
import NotificationsPage from './pages/Notifications';
import ContributePage from "./pages/ContributePage";

console.log("App.jsx is running!");

function App() {
  
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
         <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        // Move to protected routes
        <Route path="/group" element={<GroupPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/contribute" element={<ContributePage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
