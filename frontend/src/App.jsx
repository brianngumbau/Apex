// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/Landingpage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import GroupPage from "./pages/GroupPage";
import NotificationsPage from "./pages/Notifications";
import ContributePage from "./pages/ContributePage";
import BorrowPage from "./pages/BorrowPage";
import RepayPage from "./pages/RepayPage";
import CreateGroupPage from "./pages/CreateGroupPage";
import TransactionsPage from "./pages/TransactionsPage";
import FinanceUtilities from "./pages/FinanceUtilites";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRoute from "./routes/AdminRoute";
import Settings from "./pages/Settings";
import ProtectedRoute from "./routes/ProtectedRoute";

// Import Theme Context Provider
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

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
          <Route
            path="/group"
            element={
              <ProtectedRoute>
                <GroupPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contribute"
            element={
              <ProtectedRoute>
                <ContributePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/borrow"
            element={
              <ProtectedRoute>
                <BorrowPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/repay"
            element={
              <ProtectedRoute>
                <RepayPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-group"
            element={
              <ProtectedRoute>
                <CreateGroupPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <TransactionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/FinanceUtilities"
            element={
              <ProtectedRoute>
                <FinanceUtilities />
              </ProtectedRoute>
            }
          />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route
            path="/admin-dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
            />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;