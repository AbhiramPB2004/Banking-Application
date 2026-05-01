import React, { useState, useEffect } from 'react';
import { accountAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import CreateAccountModal from './CreateAccountModal';
import './AccountsPage.css';

const AccountsPage = () => {
  const { showToast } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [confirmClose, setConfirmClose] = useState(null);
  const [editType, setEditType] = useState(null);
  const [newType, setNewType] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchAccounts = async () => {
    try {
      const res = await accountAPI.getMyAccounts();
      if (res.success) setAccounts(res.data || []);
    } catch (err) {
      showToast('error', 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []); // eslint-disable-line

  const handleViewDetail = async (id) => {
    if (selectedAccount?.account_id === id) {
      setSelectedAccount(null);
      return;
    }
    try {
      const res = await accountAPI.getAccountById(id);
      if (res.success) setSelectedAccount(res.data);
    } catch (err) {
      showToast('error', err.data?.message || 'Failed to load account details');
    }
  };

  const handleUpdateType = async (id) => {
    if (!newType) return;
    setActionLoading(true);
    try {
      await accountAPI.updateAccount(id, { account_type: newType });
      showToast('success', 'Account type updated');
      setEditType(null);
      setNewType('');
      await fetchAccounts();
      setSelectedAccount(null);
    } catch (err) {
      showToast('error', err.data?.message || 'Update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async (id) => {
    setActionLoading(true);
    try {
      await accountAPI.closeAccount(id);
      showToast('success', 'Account closed successfully');
      setConfirmClose(null);
      setSelectedAccount(null);
      await fetchAccounts();
    } catch (err) {
      showToast('error', err.data?.message || 'Cannot close account');
      setConfirmClose(null);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading accounts..." />;

  return (
    <div className="accounts-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>My Accounts</h1>
          <p>View, manage, and control your bank accounts</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '12px' }}>
          <i className="fas fa-plus"></i> Open New Account
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-university" />
          <h3>No Active Accounts</h3>
          <p>Accounts created during registration will appear here</p>
        </div>
      ) : (
        <div className="acc-list">
          {accounts.map((acc) => (
            <div key={acc.account_id} className={`acc-item ${selectedAccount?.account_id === acc.account_id ? 'expanded' : ''}`}>
              <div className="acc-item-main" onClick={() => handleViewDetail(acc.account_id)}>
                <div className="acc-item-left">
                  <div className="acc-icon-box">
                    <i className={`fas ${acc.account_type === 'savings' ? 'fa-coins' : acc.account_type === 'current' ? 'fa-chart-line' : 'fa-wallet'}`} />
                  </div>
                  <div className="acc-item-info">
                    <span className="acc-item-type capitalize">{acc.account_type} Account</span>
                    <span className="acc-item-number">{acc.account_number}</span>
                  </div>
                </div>
                <div className="acc-item-right">
                  <span className="acc-item-balance">₹{parseFloat(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  <span className={`badge ${acc.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{acc.status}</span>
                </div>
                <i className={`fas fa-chevron-${selectedAccount?.account_id === acc.account_id ? 'up' : 'down'} acc-chevron`} />
              </div>

              {selectedAccount?.account_id === acc.account_id && (
                <div className="acc-detail animate-slide-up">
                  <div className="detail-grid">
                    <div><span className="detail-label">Account ID</span><span className="detail-value mono">{acc.account_id}</span></div>
                    <div><span className="detail-label">Branch Code</span><span className="detail-value">{acc.branch_code}</span></div>
                    <div><span className="detail-label">IFSC Code</span><span className="detail-value mono">{acc.ifsc_code}</span></div>
                    <div><span className="detail-label">Min Balance</span><span className="detail-value">₹{parseFloat(acc.min_balance).toLocaleString()}</span></div>
                    <div><span className="detail-label">Initial Deposit</span><span className="detail-value">₹{parseFloat(acc.initial_deposit).toLocaleString()}</span></div>
                    <div><span className="detail-label">Available Balance</span><span className="detail-value">₹{parseFloat(acc.available_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                    <div><span className="detail-label">Opened On</span><span className="detail-value">{new Date(acc.created_at).toLocaleDateString()}</span></div>
                  </div>

                  <div className="detail-actions">
                    {editType === acc.account_id ? (
                      <div className="edit-type-row">
                        <select className="input-field" value={newType} onChange={(e) => setNewType(e.target.value)}>
                          <option value="">Select type</option>
                          <option value="savings">Savings</option>
                          <option value="current">Current</option>
                          <option value="salary">Salary</option>
                        </select>
                        <button className="btn btn-primary btn-sm" onClick={() => handleUpdateType(acc.account_id)} disabled={actionLoading}>
                          Save
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditType(null)}>Cancel</button>
                      </div>
                    ) : (
                      <>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditType(acc.account_id); setNewType(acc.account_type); }}>
                          <i className="fas fa-pen" /> Change Type
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirmClose(acc.account_id)}>
                          <i className="fas fa-times-circle" /> Close Account
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirm Close Modal */}
      {confirmClose && (
        <div className="confirm-overlay" onClick={() => setConfirmClose(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: '2.5rem', color: 'var(--danger)', marginBottom: '12px' }}>
              <i className="fas fa-exclamation-triangle" />
            </div>
            <h3>Close Account?</h3>
            <p>This action cannot be undone. Account balance must be zero to proceed.</p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmClose(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleClose(confirmClose)} disabled={actionLoading}>
                {actionLoading ? <div className="loading-spinner sm" /> : 'Yes, Close Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {showCreateModal && (
        <CreateAccountModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newAcc) => {
            setShowCreateModal(false);
            showToast('success', 'Account created successfully!');
            fetchAccounts();
          }}
        />
      )}
    </div>
  );
};

export default AccountsPage;
