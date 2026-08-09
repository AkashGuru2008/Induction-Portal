import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ role, children }) {
  const { role: currentRole } = useAuth();

  if (!currentRole) {
    return <Navigate to={role === 'admin' ? '/admin/login' : '/login'} replace />;
  }
  if (role && currentRole !== role) {
    return <Navigate to="/" replace />;
  }
  return children;
}
