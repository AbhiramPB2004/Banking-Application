import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { isAdmin, currentUser } = useAuth();

  const navItems = [
    { path: '/dashboard', icon: 'fa-th-large', label: 'Dashboard' },
    { path: '/accounts', icon: 'fa-university', label: 'Accounts' },
    { path: '/transactions', icon: 'fa-exchange-alt', label: 'Transactions' },
    { path: '/credit-cards', icon: 'fa-credit-card', label: 'Credit Cards' },
    { path: '/loans', icon: 'fa-hand-holding-usd', label: 'Loans' },
    { path: '/investments', icon: 'fa-chart-line', label: 'Investments' },
    { path: '/profile', icon: 'fa-user-circle', label: 'Profile' },
  ];

  if (isAdmin) {
    navItems.push({ path: '/admin', icon: 'fa-shield-alt', label: 'Admin Panel' });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-user">
        <div className="sidebar-avatar">
          <i className="fas fa-user" />
        </div>
        <div className="sidebar-user-info">
          <span className="sidebar-name">{currentUser?.full_name || 'User'}</span>
          <span className="sidebar-role">
            <span className={`badge ${isAdmin ? 'badge-warning' : 'badge-info'}`}>
              {currentUser?.role || 'customer'}
            </span>
          </span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-nav-label">Navigation</div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <i className={`fas ${item.icon}`} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-version">
          <i className="fas fa-code-branch" />
          <span>v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
