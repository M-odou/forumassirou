
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import PublicForm from './components/PublicForm';
import AdminDashboard from './components/AdminDashboard';
import TicketView from './components/TicketView';
import ScanPage from './components/ScanPage';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<PublicForm />} />
        <Route path="/admin" element={
          <div className="min-h-screen bg-[#0f172a]">
             <AdminDashboard />
          </div>
        } />
        <Route path="/ticket/:ticketId" element={
          <div className="min-h-screen bg-[#0f172a]">
            <TicketView />
          </div>
        } />
        <Route path="/scan" element={<ScanPage />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
