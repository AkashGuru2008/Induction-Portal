import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import HomePage from './pages/HomePage.jsx';
import ApplyPage from './pages/ApplyPage.jsx';
import ConfirmationPage from './pages/ConfirmationPage.jsx';
import InducteeLogin from './pages/InducteeLogin.jsx';
import InducteeDashboard from './pages/InducteeDashboard.jsx';
import DomainPage from './pages/DomainPage.jsx';
import InterviewBooking from './pages/InterviewBooking.jsx';

import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminInducteeDetail from './pages/AdminInducteeDetail.jsx';
import AdminDomainBoard from './pages/AdminDomainBoard.jsx';
import AdminInterviews from './pages/AdminInterviews.jsx';
import AdminRounds from './pages/AdminRounds.jsx';

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="page">
        <div className="container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/apply" element={<ApplyPage />} />
            <Route path="/confirmation" element={<ConfirmationPage />} />
            <Route path="/login" element={<InducteeLogin />} />

            <Route path="/dashboard" element={<ProtectedRoute role="inductee"><InducteeDashboard /></ProtectedRoute>} />
            <Route path="/domain/:domain" element={<ProtectedRoute role="inductee"><DomainPage /></ProtectedRoute>} />
            <Route path="/interview" element={<ProtectedRoute role="inductee"><InterviewBooking /></ProtectedRoute>} />

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/inductees/:id" element={<ProtectedRoute role="admin"><AdminInducteeDetail /></ProtectedRoute>} />
            <Route path="/admin/domain/:domain" element={<ProtectedRoute role="admin"><AdminDomainBoard /></ProtectedRoute>} />
            <Route path="/admin/interviews" element={<ProtectedRoute role="admin"><AdminInterviews /></ProtectedRoute>} />
            <Route path="/admin/rounds" element={<ProtectedRoute role="admin"><AdminRounds /></ProtectedRoute>} />

            <Route path="*" element={<HomePage />} />
          </Routes>
        </div>
      </main>
      <div className="footer-note">INDUCTION PORTAL · MODULES A–F</div>
    </div>
  );
}
