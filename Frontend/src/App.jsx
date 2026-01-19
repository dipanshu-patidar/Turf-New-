import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/auth/Login';
import Placeholder from './components/Common/Placeholder';
import AdminDashboard from './pages/admin/Dashboard/AdminDashboard';
import ManagementUsers from './pages/admin/ManagementUsers/ManagementUsers';
import AdminCourts from './pages/admin/AdminCourts/AdminCourts';
import AdminBooking from './pages/admin/AdminBooking/AdminBooking';
import AdminRecurring from './pages/admin/AdminRecurring/AdminRecurring';
import AdminPayment from './pages/admin/AdminPayment/AdminPayment';
import AdminReports from './pages/admin/AdminReports/AdminReports';
import AdminSetting from './pages/admin/AdminSetting/AdminSetting';
import AdminProfile from './pages/admin/AdminProfile/AdminProfile';
import AdminNewBooking from './pages/admin/AdminNewBooking/AdminNewBooking';
import StaffDashboard from './pages/staff/Staff Dashboard/StaffDashboard';
import StaffBooking from './pages/staff/Staff Booking/StaffBooking';
import StaffNewBooking from './pages/staff/Staff New Booking/StaffNewBooking';
import StaffRecurringBooking from './pages/staff/Staff Recurring Booking/StaffRecurringBooking';
import StaffPayment from './pages/staff/Staff Payment/StaffPayment';
import StaffCheckBooking from './pages/staff/Staff Check Booking/StaffCheckBooking';
import Sidebar from './components/Layout/Sidebar';
import AppNavbar from './components/Layout/Navbar';

// Defined Layout Component inline since file was removed
const DashboardLayout = ({ role }) => {
  // Default open on larger screens, closed on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 992);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 992) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="d-flex bg-light vh-100 overflow-hidden">
      <Sidebar role={role} isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div
        className="d-flex flex-column flex-grow-1 w-100"
        style={{
          marginLeft: isSidebarOpen ? '260px' : window.innerWidth < 992 ? '0' : '80px',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <AppNavbar toggleSidebar={toggleSidebar} isOpen={isSidebarOpen} role={role} />

        <main className="flex-grow-1 p-4 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Simple Dashboard Component to differentiate from Placeholder (Keeping for Management/SuperAdmin specific logic later if needed)
const Dashboard = () => (
  <div className="container-fluid">
    <h2 className="fw-bold mb-4 border-start border-4 border-primary ps-3">Dashboard</h2>
    <div className="alert alert-info border-0 shadow-sm rounded-3">
      <h5 className="alert-heading fw-bold">Welcome!</h5>
      <p className="mb-0">This is a generic dashboard view. Admin features are in the specific Admin Dashboard.</p>
    </div>
  </div>
);

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Super Admin Routes */}
        <Route path="/superadmin" element={<DashboardLayout role="superadmin" />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="admin-management" element={<Placeholder />} />
          <Route path="plans-pricing" element={<Placeholder />} />
          <Route path="request-plan" element={<Placeholder />} />
          <Route path="payments" element={<Placeholder />} />
          <Route path="manage-passwords" element={<Placeholder />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<DashboardLayout role="admin" />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="management-users" element={<ManagementUsers />} />
          <Route path="courts-pricing" element={<AdminCourts />} />
          <Route path="new-booking" element={<AdminNewBooking />} />
          <Route path="booking-calendar" element={<AdminBooking />} />
          <Route path="recurring-bookings" element={<AdminRecurring />} />
          <Route path="payments" element={<AdminPayment />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSetting />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>

        {/* Management Routes */}
        <Route path="/management" element={<DashboardLayout role="management" />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StaffDashboard />} />
          <Route path="booking-calendar" element={<StaffBooking />} />
          <Route path="new-booking" element={<StaffNewBooking />} />
          <Route path="recurring-bookings" element={<StaffRecurringBooking />} />
          <Route path="payments" element={<StaffPayment />} />
          <Route path="bookings" element={<StaffCheckBooking />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
