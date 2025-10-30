import * as React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import CaseDetail from './pages/CaseDetail';
import Alerts from './pages/Alerts';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Cases from './pages/Cases';
import Evals from './pages/Evals';

const App: React.FC = () => {
  return (
    <Router>
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
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
