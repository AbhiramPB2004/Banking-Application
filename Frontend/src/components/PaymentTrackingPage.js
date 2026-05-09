// Frontend/src/components/PaymentTrackingPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { paymentTrackingAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import './PaymentTrackingPage.css';

const PaymentTrackingPage = () => {
  const { showToast } = useAuth();
  const [payments, setPayments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    payment_type: '',
    search: '',
    start_date: '',
    end_date: '',
    page: 1,
    limit: 10,
  });
  const [totalPages, setTotalPages] = useState(1);

  const fetchPayments = useCallback(async () => {
    try {
      const res = await paymentTrackingAPI.getPayments(filters);
      if (res.success) {
        setPayments(res.data.payments);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      showToast('error', 'Failed to load payments');
    }
  }, [filters, showToast]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await paymentTrackingAPI.getAnalytics();
      if (res.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      showToast('error', 'Failed to load analytics');
    }
  }, [showToast]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPayments(), fetchAnalytics()]);
      setLoading(false);
    };
    loadData();
  }, [filters.page, filters.status, filters.payment_type, fetchAnalytics, fetchPayments]); // Only trigger on key filter changes or page

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPayments();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS': return 'badge-success';
      case 'FAILED': return 'badge-danger';
      case 'PENDING': return 'badge-warning';
      default: return 'badge-secondary';
    }
  };

  if (loading && filters.page === 1) return <LoadingSpinner text="Loading payment tracking..." />;

  return (
    <div className="payment-tracking-page">
      <div className="page-header">
        <h1>Payment Tracking System</h1>
        <p>Monitor and analyze all your payment activities</p>
      </div>

      {/* Analytics Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="card-icon blue"><i className="fas fa-list-ul"></i></div>
          <div className="card-info">
            <span className="card-label">Total Payments</span>
            <span className="card-value">{analytics?.totalPayments || 0}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon green"><i className="fas fa-check-circle"></i></div>
          <div className="card-info">
            <span className="card-label">Successful</span>
            <span className="card-value">{analytics?.successfulPayments || 0}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon red"><i className="fas fa-times-circle"></i></div>
          <div className="card-info">
            <span className="card-label">Failed</span>
            <span className="card-value">{analytics?.failedPayments || 0}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon gold"><i className="fas fa-wallet"></i></div>
          <div className="card-info">
            <span className="card-label">Total Spent</span>
            <span className="card-value">₹{analytics?.totalAmountPaid?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <form className="search-box" onSubmit={handleSearch}>
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            name="search"
            placeholder="Search Reference ID..." 
            value={filters.search}
            onChange={handleFilterChange}
          />
        </form>
        
        <div className="filter-group">
          <select name="payment_type" value={filters.payment_type} onChange={handleFilterChange}>
            <option value="">All Types</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="LOAN">Loan</option>
            <option value="TRANSFER">Transfer</option>
            <option value="BILL">Bill</option>
            <option value="EMI">EMI</option>
          </select>

          <select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="">All Status</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
          </select>

          <div className="date-filters">
            <input 
              type="date" 
              name="start_date" 
              value={filters.start_date} 
              onChange={handleFilterChange} 
              placeholder="Start Date"
            />
            <span>to</span>
            <input 
              type="date" 
              name="end_date" 
              value={filters.end_date} 
              onChange={handleFilterChange}
              placeholder="End Date"
            />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="table-container shadow-sm">
        <table className="payments-table">
          <thead>
            <tr>
              <th>Reference ID</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Method</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-5">
                  <div className="empty-table">
                    <i className="fas fa-receipt"></i>
                    <p>No payment records found matching filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.payment_tracking_id}>
                  <td className="mono font-sm">{p.reference_id}</td>
                  <td><span className="type-tag">{p.payment_type}</span></td>
                  <td className="font-bold">₹{parseFloat(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td><span className={`badge ${getStatusBadge(p.status)}`}>{p.status}</span></td>
                  <td>{p.payment_method.replace('_', ' ')}</td>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            disabled={filters.page === 1} 
            onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
          >
            <i className="fas fa-chevron-left"></i> Previous
          </button>
          <span className="page-info">Page {filters.page} of {totalPages}</span>
          <button 
            disabled={filters.page === totalPages} 
            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
          >
            Next <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentTrackingPage;
