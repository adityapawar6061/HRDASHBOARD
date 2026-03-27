import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: '📊 Dashboard' },
  { to: '/companies', label: '🏢 Companies' },
  { to: '/employees', label: '👥 Employees' },
  { to: '/attendance', label: '🕐 Attendance' },
  { to: '/campaigns', label: '📋 Campaigns' },
  { to: '/salary', label: '💰 Salary' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>HR Dashboard</h2>
        <p>{user?.name}</p>
      </div>
      <nav>
        {links.map(l => (
          <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <button className="logout-btn" onClick={logout}>🚪 Logout</button>
    </aside>
  );
};

export default Sidebar;
