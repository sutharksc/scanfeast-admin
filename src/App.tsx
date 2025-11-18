import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import { useAuth } from './hooks/useAuth';
import Layout from './components/common/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tables from './pages/Tables';
import QRCodes from './pages/QRCodes';
import MenuCategories from './pages/MenuCategories';
import MenuItems from './pages/MenuItems';
import OrdersList from './pages/Orders/OrdersList';
import OrderDetails from './pages/Orders/OrderDetails';
import CreateOrder from './pages/Orders/CreateOrder';
import Reports from './pages/Reports';
import Expenses from './pages/Expenses';
import ProfitLoss from './pages/ProfitLoss';
import LoyaltyManagement from './pages/LoyaltyManagement';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Restaurant from './pages/Restaurant';
import POSTroubleshooting from './pages/POSTroubleshooting';
import CouponList from './pages/Coupons/CouponList';
import CreateCoupon from './pages/Coupons/CreateCoupon';
import CouponDetails from './pages/Coupons/CouponDetails';
import EditCoupon from './pages/Coupons/EditCoupon';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/common/ProtectedRoute';
import AnalyticsNav from './components/common/AnalyticsNav';
import './index.css';

// Analytics pages
const ItemWiseAnalytics = React.lazy(() => import('./pages/Analytics/ItemWiseAnalytics'));
const CustomerWiseAnalytics = React.lazy(() => import('./pages/Analytics/CustomerWiseAnalytics'));

const AppContent: React.FC = () => {
  const { isAuthenticated, loading, checkAuth } = useAuth();
  React.useEffect(() => {
    // Check auth on mount
    checkAuth();
  }, []);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={
            <ProtectedRoute page="dashboard">
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/tables" element={
            <ProtectedRoute page="tables">
              <Tables />
            </ProtectedRoute>
          } />
          <Route path="/qr-codes" element={
            <ProtectedRoute page="qr-codes">
              <QRCodes />
            </ProtectedRoute>
          } />
          <Route path="/menu-categories" element={
            <ProtectedRoute page="menu-categories">
              <MenuCategories />
            </ProtectedRoute>
          } />
          <Route path="/menu-items" element={
            <ProtectedRoute page="menu-items">
              <MenuItems />
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute page="orders">
              <OrdersList />
            </ProtectedRoute>
          } />
          <Route path="/orders/:id" element={
            <ProtectedRoute page="orders">
              <OrderDetails />
            </ProtectedRoute>
          } />
          <Route path="/create-order" element={
            <ProtectedRoute page="orders" action="create">
              <CreateOrder />
            </ProtectedRoute>
          } />
          <Route path="/expenses" element={
            <ProtectedRoute page="expenses">
              <Expenses />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute page="reports">
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="/reports/profit-loss" element={
            <ProtectedRoute page="reports">
              <ProfitLoss />
            </ProtectedRoute>
          } />
          <Route path="/loyalty" element={
            <ProtectedRoute page="loyalty">
              <LoyaltyManagement />
            </ProtectedRoute>
          } />
          <Route path="/analytics/item-wise" element={
            <ProtectedRoute page="reports">
              <React.Suspense fallback={<div>Loading...</div>}>
                <AnalyticsNav />
                <ItemWiseAnalytics />
              </React.Suspense>
            </ProtectedRoute>
          } />
          <Route path="/analytics/customer-wise" element={
            <ProtectedRoute page="reports">
              <React.Suspense fallback={<div>Loading...</div>}>
                <AnalyticsNav />
                <CustomerWiseAnalytics />
              </React.Suspense>
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute page="users">
              <Users />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute page="dashboard">
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/restaurant" element={
            <ProtectedRoute page="restaurant">
              <Restaurant />
            </ProtectedRoute>
          } />
          <Route path="/pos-troubleshooting" element={
            <ProtectedRoute page="orders">
              <POSTroubleshooting />
            </ProtectedRoute>
          } />
          <Route path="/coupons" element={
            <ProtectedRoute page="reports">
              <CouponList />
            </ProtectedRoute>
          } />
          <Route path="/coupons/create" element={
            <ProtectedRoute page="reports" action="create">
              <CreateCoupon />
            </ProtectedRoute>
          } />
          <Route path="/coupons/:id" element={
            <ProtectedRoute page="reports">
              <CouponDetails />
            </ProtectedRoute>
          } />
          <Route path="/coupons/:id/edit" element={
            <ProtectedRoute page="reports" action="edit">
              <EditCoupon />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppContent />
      </PersistGate>
    </Provider>
  );
};

export default App;