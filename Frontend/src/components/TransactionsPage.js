import React, { useState, useEffect, useCallback } from 'react';
import { accountAPI, transactionAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import './TransactionsPage.css';

const TransactionsPage = () => {
  const { showToast } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('transfer');

  // Form states
  const [formData, setFormData] = useState({
    source_account_id: '',
    target_account_number: '',
    amount: '',
    transaction_pin: '',
    transfer_type: 'imps',
    description: ''
  });

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await accountAPI.getMyAccounts();
      if (res.success) {
        setAccounts(res.data || []);
        if (res.data?.length > 0) {
          setFormData(prev => ({
            ...prev,
            source_account_id: res.data[0].account_id
          }));
          setSelectedAccountId(res.data[0].account_id);
        }
      }
    } catch (err) {
      showToast('error', 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchHistory = useCallback(async (id) => {
    if (!id) return;
    // Removed setHistoryLoading since it was unused
    try {
      const res = await transactionAPI.getHistory(id);
      if (res.success) {
        // Removed setHistory since it was unused
        console.log('Transaction history fetched:', res.data);
      }
    } catch (err) {
      showToast('error', 'Failed to load transaction history');
    } finally {
      // Removed setHistoryLoading since it was unused
    }
  }, [showToast]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (selectedAccountId) {
      fetchHistory(selectedAccountId);
    }
  }, [selectedAccountId, fetchHistory]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {

      let res;

      // ✅ Find selected account
      const selectedAccount = accounts.find(
        acc => acc.account_id === formData.source_account_id
      );

      if (!selectedAccount) {
        throw new Error('Selected account not found');
      }

      // 🔁 TRANSFER
      if (activeTab === 'transfer') {

        res = await transactionAPI.transfer({
          from_account_number: selectedAccount.account_number,
          to_account_number: formData.target_account_number,
          amount: parseFloat(formData.amount),
          transaction_type: formData.transfer_type,
          transaction_pin: formData.transaction_pin,
          description: formData.description
        });

      }

      // 💰 DEPOSIT
      else if (activeTab === 'deposit') {

        res = await transactionAPI.deposit({
          account_number: selectedAccount.account_number,
          amount: parseFloat(formData.amount),
          transaction_pin: formData.transaction_pin
        });

      }

      // 💸 WITHDRAW
      else if (activeTab === 'withdraw') {

        res = await transactionAPI.withdraw({
          account_number: selectedAccount.account_number,
          amount: parseFloat(formData.amount),
          transaction_pin: formData.transaction_pin
        });

      }

      // ✅ SUCCESS
      if (res?.success) {

        showToast(
          'success',
          `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} successful!`
        );

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

      console.error('TRANSACTION ERROR:', err);

      showToast(
        'error',
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message ||
        'Transaction failed'
      );

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

      <div className="transactions-grid">
        <div className="transaction-card">
          <div className="transaction-tabs-header">
            <div className="tab-glider" style={{
              transform: `translateX(${activeTab === 'transfer' ? '0' : activeTab === 'deposit' ? '100%' : '200%'})`
            }} />
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

          <div className="card-content-header">
            <h2>
              <i className={`fas ${activeTab === 'transfer'
                  ? 'fa-exchange-alt'
                  : activeTab === 'deposit'
                    ? 'fa-arrow-down'
                    : 'fa-arrow-up'
                }`} />
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Funds
            </h2>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="form-row">
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
                      {acc.account_number} ({acc.account_type}) - ₹
                      {parseFloat(acc.balance).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {activeTab === 'transfer' ? (
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
              ) : (
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
              )}
            </div>

            {activeTab === 'transfer' && (
              <div className="form-row">
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

                <div className="form-group">
                  <label>Transfer Type</label>
                  <select
                    name="transfer_type"
                    className="input-field"
                    value={formData.transfer_type}
                    onChange={handleInputChange}
                  >
                    <option value="internal">Internal</option>
                    <option value="imps">IMPS (Instant)</option>
                    <option value="neft">NEFT (Same day)</option>
                    <option value="rtgs">RTGS (High value)</option>
                  </select>
                </div>
              </div>
            )}

            <div className="form-row">
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
                  placeholder="Enter 4 or 6-digit PIN"
                  maxLength="6"
                  value={formData.transaction_pin}
                  onChange={handleInputChange}
                  required
                />
                <p className="pin-hint">
                  Secure authorization required
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={actionLoading}
              style={{ marginTop: '1rem' }}
            >
              {actionLoading
                ? <LoadingSpinner size="sm" text="" />
                : `Confirm ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;