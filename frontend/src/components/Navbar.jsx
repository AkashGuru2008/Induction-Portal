import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { role, profile, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand">
          <span className="brand-mark">IP</span>
          Induction Portal
        </NavLink>
        <div className="nav-links">
          {!role && (
            <>
              <NavLink to="/apply" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Apply</NavLink>
              <NavLink to="/login" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Inductee Login</NavLink>
              <NavLink to="/admin/login" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Admin</NavLink>
            </>
          )}
          {role === 'inductee' && (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>My Status</NavLink>
              {profile?.assignedDomain && (
                <NavLink to={`/domain/${encodeURIComponent(profile.assignedDomain)}`} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                  {profile.assignedDomain}
                </NavLink>
              )}
              <NavLink to="/interview" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Interview</NavLink>
              <button className="btn btn-sm" onClick={handleLogout}>Log out</button>
            </>
          )}
          {role === 'admin' && (
            <>
              <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Inductees</NavLink>
              <NavLink to="/admin/interviews" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Interviews</NavLink>
              <NavLink to="/admin/rounds" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Rounds</NavLink>
              <button className="btn btn-sm" onClick={handleLogout}>Log out</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
