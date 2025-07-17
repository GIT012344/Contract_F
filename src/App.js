import './App.css';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ContractListPage from './pages/ContractListPage';
import ContractDetailPage from './pages/ContractDetailPage';

function RequireAuth({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/contracts" element={
          <RequireAuth>
            <ContractListPage />
          </RequireAuth>
        } />
        <Route path="/contracts/:id" element={
          <RequireAuth>
            <ContractDetailPage />
          </RequireAuth>
        } />
        <Route path="*" element={<Navigate to="/contracts" />} />
      </Routes>
    </BrowserRouter>
  );
}

