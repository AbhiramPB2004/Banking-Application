import React, { useState, useEffect } from 'react';
import { accountAPI, transactionAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import './TransactionsPage.css';

const TransactionsPage = () => {
  const { showToast } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('transfer');

  // Form states
  const [formData, setFormData] = useState({
    source_account_id: '',
    target_account_number: '',
    amount: '',
    transaction_pin: '',
    transfer_type: 'imps', // IMPS, NEFT, RTGS
    description: ''
  });

  const fetchAccounts = async () => {
    try {
      const res = await accountAPI.getMyAccounts();
      if (res.success) {
        setAccounts(res.data || []);
        if (res.data?.length > 0) {
          setFormData(prev => ({ ...prev, source_account_id: res.data[0].account_id }));
          setSelectedAccountId(res.data[0].account_id);
        }
      }
    } catch (err) {
      showToast('error', 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (id) => {
    if (!id) return;
    setHistoryLoading(true);
    try {
      const res = await transactionAPI.getHistory(id);
      if (res.success) {
        setHistory(res.data || []);
      }
    } catch (err) {
      showToast('error', 'Failed to load transaction history');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []); // eslint-disable-line

  useEffect(() => {
    if (selectedAccountId) {
      fetchHistory(selectedAccountId);
    }
  }, [selectedAccountId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      let res;
      if (activeTab === 'transfer') {
        res = await transactionAPI.transfer({
          source_account_id: formData.source_account_id,
          target_account_number: formData.target_account_number,
          amount: parseFloat(formData.amount),
          transfer_type: formData.transfer_type,
          transaction_pin: formData.transaction_pin,
          description: formData.description
        });
      } else if (activeTab === 'deposit') {
        res = await transactionAPI.deposit({
          account_id: formData.source_account_id,
          amount: parseFloat(formData.amount),
          transaction_pin: formData.transaction_pin
        });
      } else if (activeTab === 'withdraw') {
        res = await transactionAPI.withdraw({
          account_id: formData.source_account_id,
          amount: parseFloat(formData.amount),
          transaction_pin: formData.transaction_pin
        });
      }

      if (res?.success) {
        showToast('success', `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} successful!`);
        // Reset non-account fields
        setFormData(prev => ({
          ...prev,
          target_account_number: '',
          amount: '',
          transaction_pin: '',
          description: ''
        }));
        // Refresh data
        fetchAccounts();
        fetchHistory(formData.source_account_id);
      }
    } catch (err) {
      showToast('error', err.data?.message || 'Transaction failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Initializing transactions..." />;

  return (
    <div className="transactions-page animate-fade">
      <div className="page-header">
        <h1>Transactions</h1>
        <p>Transfer funds, deposit or withdraw money from your accounts</p>
      </div>

      <div className="transaction-tabs">
        <button 
          className={`tab-btn ${activeTab === 'transfer' ? 'active' : ''}`}
          onClick={() => setActiveTab('transfer')}
        >
          <i className="fas fa-exchange-alt" /> Transfer
        </button>
        <button 
          className={`tab-btn ${activeTab === 'deposit' ? 'active' : ''}`}
          onClick={() => setActiveTab('deposit')}
        >
          <i className="fas fa-arrow-down" /> Deposit
        </button>
        <button 
          className={`tab-btn ${activeTab === 'withdraw' ? 'active' : ''}`}
          onClick={() => setActiveTab('withdraw')}
        >
          <i className="fas fa-arrow-up" /> Withdraw
        </button>
      </div>

      <div className="transactions-grid">
        <div className="transaction-card">
          <h2>
            <i className={`fas ${activeTab === 'transfer' ? 'fa-exchange-alt' : activeTab === 'deposit' ? 'fa-arrow-down' : 'fa-arrow-up'}`} />
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Funds
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Select Account</label>
              <select 
                name="source_account_id"
                className="account-selector"
                value={formData.source_account_id}
                onChange={(e) => {
                  handleInputChange(e);
                  setSelectedAccountId(e.target.value);
                }}
                required
              >
                {accounts.map(acc => (
                  <option key={acc.account_id} value={acc.account_id}>
                    {acc.account_number} ({acc.account_type}) - ₹{parseFloat(acc.balance).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {activeTab === 'transfer' && (
              <>
                <div className="form-group">
                  <label>Recipient Account Number</label>
                  <input 
                    type="text"
                    name="target_account_number"
                    className="input-field"
                    placeholder="Enter account number"
                    value={formData.target_account_number}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Transfer Type</label>
                  <select 
                    name="transfer_type"
                    className="input-field"
                    value={formData.transfer_type}
                    onChange={handleInputChange}
                  >
                    <option value="imps">IMPS (Instant)</option>
                    <option value="neft">NEFT (Same day)</option>
                    <option value="rtgs">RTGS (High value)</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label>Amount (₹)</label>
              <input 
                type="number"
                name="amount"
                className="input-field"
                placeholder="0.00"
                min="1"
                step="0.01"
                value={formData.amount}
                onChange={handleInputChange}
                required
              />
            </div>

            {activeTab === 'transfer' && (
              <div className="form-group">
                <label>Description (Optional)</label>
                <input 
                  type="text"
                  name="description"
                  className="input-field"
                  placeholder="Rent, Food, etc."
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
            )}

            <div className="form-group">
              <label>Transaction PIN</label>
              <input 
                type="password"
                name="transaction_pin"
                className="input-field"
                placeholder="Enter 4 or 6 -digit PIN"
                maxLength="6"
                value={formData.transaction_pin}
                onChange={handleInputChange}
                required
              />
              <p className="pin-hint">Enter your secure transaction PIN to authorize</p>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={actionLoading}
              style={{ marginTop: '1rem' }}
            >
              {actionLoading ? <LoadingSpinner size="sm" text="" /> : `Confirm ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
            </button>
          </form>
        </div>

        <div className="history-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2><i className="fas fa-history" /> Recent Activity</h2>
            <select 
              className="account-selector" 
              style={{ width: 'auto' }}
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            >
              {accounts.map(acc => (
                <option key={acc.account_id} value={acc.account_id}>
                  {acc.account_number}
                </option>
              ))}
            </select>
          </div>

          <div className="history-table-container">
            {historyLoading ? (
              <LoadingSpinner text="Fetching history..." />
            ) : history.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-receipt" style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-muted)' }} />
                <p>No transactions found for this account</p>
              </div>
            ) : (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((tx) => {
                    const isDebit = tx.transaction_type === 'DEBIT' || tx.type === 'transfer_out' || tx.type === 'withdrawal';
                    return (
                      <tr key={tx.transaction_id}>
                        <td>{new Date(tx.created_at).toLocaleDateString()}</td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{tx.description || tx.type.replace('_', ' ').toUpperCase()}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ref: {tx.transaction_id.slice(0, 8)}</div>
                        </td>
                        <td>
                          <span className={`transaction-status ${tx.status === 'COMPLETED' ? 'status-completed' : tx.status === 'FAILED' ? 'status-failed' : 'status-pending'}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className={isDebit ? 'amount-debit' : 'amount-credit'}>
                          {isDebit ? '-' : '+'}₹{parseFloat(tx.amount).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
