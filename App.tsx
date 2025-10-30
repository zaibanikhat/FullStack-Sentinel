

import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import CustomerDetail from './pages/CustomerDetail';
import Evals from './pages/Evals';
import Customers from './pages/Customers';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="flex h-screen bg-gray-900 text-gray-100">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/case/:id" element={<CaseDetail />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customer/:id" element={<CustomerDetail />} />
            <Route path="/evals" element={<Evals />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;