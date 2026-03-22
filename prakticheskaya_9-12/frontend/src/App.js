import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import ProductsPage from './pages/ProductsPage';
import AdminUsers from './components/AdminUsers';
import './App.css';

// Приватный маршрут для страниц, требующих авторизации (админка)
function PrivateRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/products" />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Публичные маршруты */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/products" element={<ProductsPage />} />  {/* гости могут смотреть товары */}
      
      {/* Приватные маршруты */}
      <Route path="/users" element={
        <PrivateRoute allowedRoles={['admin']}>
          <AdminUsers />
        </PrivateRoute>
      } />
      <Route path="/" element={<Navigate to="/products" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;