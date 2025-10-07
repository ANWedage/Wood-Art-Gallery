import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Home from './pages/Home'
import DesignerDashboard from './pages/Designer/Dashboard'
import CustomerDashboard from './pages/Customer/Dashboard'
import AdminDashboard from './pages/Admin/Dashboard'
import FinancialDashboard from './pages/Financial/Dashboard'
import InventoryDashboard from './pages/Inventory/Dashboard'
import DeliveryDashboard from './pages/Delivery/Dashboard'
import StaffDesignerDashboard from './pages/StaffDesigner/Dashboard'
import ProtectedRoute from './components/ProtectedRoute';




function App() {
  const { user } = useAuth();

  // Determine the dashboard path for the current user
  const getDashboardPath = (role) => {
    if (role === 'admin') return '/admin';
    if (role === 'financial') return '/financial';
    if (role === 'inventory') return '/inventory';
    if (role === 'delivery') return '/delivery';
    if (role === 'staffdesigner') return '/staffdesigner';
    if (role === 'designer') return '/designer';
    if (role === 'customer') return '/customer';
    return '/';
  };
      

  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/designer" element={
        <ProtectedRoute allowedRoles={["designer"]}>
          <DesignerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/customer" element={
        <ProtectedRoute allowedRoles={["customer"]}>
          <CustomerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/financial" element={
        <ProtectedRoute allowedRoles={["financial"]}>
          <FinancialDashboard />
        </ProtectedRoute>
      } />
      <Route path="/inventory" element={
        <ProtectedRoute allowedRoles={["inventory"]}>
          <InventoryDashboard />
        </ProtectedRoute>
      } />
      <Route path="/delivery" element={
        <ProtectedRoute allowedRoles={["delivery"]}>
          <DeliveryDashboard />
        </ProtectedRoute>
      } />
      <Route path="/staffdesigner" element={
        <ProtectedRoute allowedRoles={["staffdesigner"]}>
          <StaffDesignerDashboard />
        </ProtectedRoute>
      } />
      {/* Catch all: if logged in and tries to access any other route, redirect to their dashboard */}
      <Route path="*" element={
        user ? <Navigate to={getDashboardPath(user.role)} replace /> : <Navigate to="/" replace />
      } />
    </Routes>
  )
}

export default App
