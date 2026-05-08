import React, { useState, useEffect } from 'react';
import { userAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import './AdminPanel.css';

const AdminPanel = () => {
  const { showToast } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await userAPI.getAllUsers();
      if (res.success) setUsers(res.data || []);
    } catch (err) {
      showToast('error', err.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []); // eslint-disable-line

  const handleStatusChange = async (userId, status) => {
    setActionLoading(userId);
    try {
      await userAPI.updateUserStatus(userId, status);
      showToast('success', `User ${status} successfully`);
      setConfirmAction(null);
      await fetchUsers();
    } catch (err) {
      showToast('error', err.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search);
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    pending: users.filter(u => u.status === 'pending').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    closed: users.filter(u => u.status === 'closed').length,
  };

  const statusBadge = (s) => {
    const map = { active: 'badge-success', pending: 'badge-warning', suspended: 'badge-danger', closed: 'badge-neutral' };
    return map[s] || 'badge-neutral';
  };

  if (loading) return <LoadingSpinner text="Loading admin data..." />;

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1><i className="fas fa-shield-alt" style={{ color: 'var(--warning)' }} /> Admin Panel</h1>
        <p>Manage all registered users and their account statuses</p>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon primary"><i className="fas fa-users" /></div>
          <div className="stat-info"><p>Total Users</p><h3>{statusCounts.total}</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><i className="fas fa-user-check" /></div>
          <div className="stat-info"><p>Active</p><h3>{statusCounts.active}</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><i className="fas fa-user-clock" /></div>
          <div className="stat-info"><p>Pending</p><h3>{statusCounts.pending}</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
            <i className="fas fa-user-slash" />
          </div>
          <div className="stat-info"><p>Suspended</p><h3>{statusCounts.suspended}</h3></div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="search-box">
          <i className="fas fa-search" />
          <input
            className="input-field"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            style={{ paddingLeft: '36px' }}
          />
        </div>
        <div className="filter-tabs">
          {['all', 'active', 'pending', 'suspended', 'closed'].map((s) => (
            <button
              key={s}
              className={`filter-tab ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== 'all' && <span className="tab-count">{statusCounts[s]}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-container">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-search" />
            <h3>No users found</h3>
            <p>Try adjusting your search or filter</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Phone</th>
                <th>KYC</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.user_id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-cell-avatar">
                        {user.full_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div className="user-cell-name">{user.full_name}</div>
                        <div className="user-cell-email">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{user.phone}</td>
                  <td><span className={`badge ${statusBadge(user.kyc_status)}`}>{user.kyc_status}</span></td>
                  <td><span className={`badge ${user.role === 'admin' ? 'badge-warning' : 'badge-info'}`}>{user.role}</span></td>
                  <td><span className={`badge ${statusBadge(user.status)}`}>{user.status}</span></td>
                  <td className="text-muted">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="action-btns">
                      {user.status !== 'active' && (
                        <button className="btn btn-success btn-sm"
                          onClick={() => setConfirmAction({ id: user.user_id, status: 'active', name: user.full_name })}
                          disabled={actionLoading === user.user_id}>
                          <i className="fas fa-check" />
                        </button>
                      )}
                      {user.status !== 'suspended' && (
                        <button className="btn btn-sm" style={{ background: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.2)' }}
                          onClick={() => setConfirmAction({ id: user.user_id, status: 'suspended', name: user.full_name })}
                          disabled={actionLoading === user.user_id}>
                          <i className="fas fa-ban" />
                        </button>
                      )}
                      {user.status !== 'closed' && (
                        <button className="btn btn-danger btn-sm"
                          onClick={() => setConfirmAction({ id: user.user_id, status: 'closed', name: user.full_name })}
                          disabled={actionLoading === user.user_id}>
                          <i className="fas fa-times" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmAction && (
        <div className="confirm-overlay" onClick={() => setConfirmAction(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: '2.5rem', color: confirmAction.status === 'active' ? 'var(--success)' : confirmAction.status === 'suspended' ? 'var(--warning)' : 'var(--danger)', marginBottom: '12px' }}>
              <i className={`fas ${confirmAction.status === 'active' ? 'fa-user-check' : confirmAction.status === 'suspended' ? 'fa-user-lock' : 'fa-user-times'}`} />
            </div>
            <h3>{confirmAction.status === 'active' ? 'Activate' : confirmAction.status === 'suspended' ? 'Suspend' : 'Close'} User?</h3>
            <p>Change <strong>{confirmAction.name}</strong>'s status to <strong>{confirmAction.status}</strong>?</p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmAction(null)}>Cancel</button>
              <button className={`btn ${confirmAction.status === 'active' ? 'btn-success' : 'btn-danger'}`}
                onClick={() => handleStatusChange(confirmAction.id, confirmAction.status)}
                disabled={actionLoading}>
                {actionLoading ? <div className="loading-spinner sm" /> : `Yes, ${confirmAction.status === 'active' ? 'Activate' : confirmAction.status === 'suspended' ? 'Suspend' : 'Close'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
