import React, { useState, useEffect } from 'react';
import { fdAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import CreateFDModal from './CreateFDModal';
import './FDPage.css';

const FDPage = () => {
  const { showToast } = useAuth();
  const [fds, setFds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFD, setSelectedFD] = useState(null);

  useEffect(() => {
    fetchFDs();
  }, []);

  const fetchFDs = async () => {
    try {
      setLoading(true);
      const response = await fdAPI.getMyFDs();
      console.log('FD API Response:', response); // Debug log
      
      if (response.success && response.data) {
        setFds(response.data);
      } else if (Array.isArray(response)) {
        setFds(response);
      } else {
        setFds([]);
      }
    } catch (error) {
      console.error('Failed to fetch FDs:', error);
      showToast('error', 'Failed to load fixed deposits');
    } finally {
      setLoading(false);
    }
  };

  const handleFDCreated = (newFD) => {
    setFds(prev => [newFD, ...prev]);
    showToast('success', 'Fixed Deposit created successfully!');
    setShowCreateModal(false);
  };

  const calculateMaturityAmount = (principal, rate, tenureMonths) => {
    const ratePerAnnum = rate / 100;
    const maturity = principal * Math.pow(1 + ratePerAnnum, tenureMonths / 12);
    return Math.round(maturity);
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'active': return 'fd-status-active';
      case 'matured': return 'fd-status-matured';
      case 'premature_closed': return 'fd-status-closed';
      default: return 'fd-status-active';
    }
  };

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'active': return 'fa-chart-line';
      case 'matured': return 'fa-check-circle';
      case 'premature_closed': return 'fa-times-circle';
      default: return 'fa-clock';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="fd-page">
      <div className="fd-header">
        <div className="fd-header-content">
          <div className="fd-title-section">
            <h1 className="fd-title">
              <i className="fas fa-certificate"></i> Fixed Deposits
            </h1>
            <p className="fd-subtitle">Grow your savings with guaranteed returns</p>
          </div>
          <button className="fd-create-btn" onClick={() => setShowCreateModal(true)}>
            <i className="fas fa-plus-circle"></i> Create New FD
          </button>
        </div>
      </div>

      {/* Interest Rates Banner */}
      {/* Interest Rates Banner */}
<div className="fd-rates-banner">
  <div className="fd-rates-container">
    <div className="fd-rate-card">
      <i className="fas fa-calendar-week"></i>
      <div className="fd-rate-info">
        <span className="fd-rate-period">3 Months</span>
        <span className="fd-rate-value">4.5%</span>
      </div>
    </div>

    <div className="fd-rate-card">
      <i className="fas fa-calendar-alt"></i>
      <div className="fd-rate-info">
        <span className="fd-rate-period">6 Months</span>
        <span className="fd-rate-value">5.5%</span>
      </div>
    </div>

    <div className="fd-rate-card">
      <i className="fas fa-calendar-month"></i>
      <div className="fd-rate-info">
        <span className="fd-rate-period">12 Months</span>
        <span className="fd-rate-value">7%</span>
      </div>
    </div>

    <div className="fd-rate-card">
      <i className="fas fa-calendar-year"></i>
      <div className="fd-rate-info">
        <span className="fd-rate-period">24 - 60 Months</span>
        <span className="fd-rate-value">8.5%</span>
      </div>
    </div>

    <div className="fd-rate-card">
      <i className="fas fa-gem"></i>
      <div className="fd-rate-info">
        <span className="fd-rate-period">61 - 71 Months</span>
        <span className="fd-rate-value">9%</span>
      </div>
    </div>

    <div className="fd-rate-card">
      <i className="fas fa-star"></i>
      <div className="fd-rate-info">
        <span className="fd-rate-period">72 - 84 Months</span>
        <span className="fd-rate-value">10%</span>
      </div>
    </div>

    <div className="fd-rate-card">
      <i className="fas fa-crown"></i>
      <div className="fd-rate-info">
        <span className="fd-rate-period">85 - 108 Months</span>
        <span className="fd-rate-value">12%</span>
      </div>
    </div>

    <div className="fd-rate-card">
      <i className="fas fa-medal"></i>
      <div className="fd-rate-info">
        <span className="fd-rate-period">109 - 120 Months</span>
        <span className="fd-rate-value">15%</span>
      </div>
    </div>
  </div>
</div>
      {/* Summary Cards */}
      <div className="fd-summary-grid">
        <div className="fd-summary-card">
          <div className="fd-summary-icon">
            <i className="fas fa-chart-pie"></i>
          </div>
          <div className="fd-summary-info">
            <span className="fd-summary-label">Total Investment</span>
            <span className="fd-summary-value">
              {formatCurrency(fds.reduce((sum, fd) => sum + Number(fd.principal_amount || fd.amount || 0), 0))}
            </span>
          </div>
        </div>
        <div className="fd-summary-card">
          <div className="fd-summary-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="fd-summary-info">
            <span className="fd-summary-label">Expected Returns</span>
            <span className="fd-summary-value">
              {formatCurrency(fds.reduce((sum, fd) => {
                const principal = Number(fd.principal_amount || fd.amount || 0);
                const maturity = Number(fd.maturity_amount) || calculateMaturityAmount(
                  principal,
                  Number(fd.interest_rate),
                  Number(fd.tenure_months)
                );
                return sum + (maturity - principal);
              }, 0))}
            </span>
          </div>
        </div>
        <div className="fd-summary-card">
          <div className="fd-summary-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="fd-summary-info">
            <span className="fd-summary-label">Active FDs</span>
            <span className="fd-summary-value">
              {fds.filter(fd => fd.status?.toLowerCase() === 'active').length}
            </span>
          </div>
        </div>
      </div>

      {/* FD List */}
      <div className="fd-list-section">
        <div className="fd-list-header">
          <h3 className="fd-list-title">
            <i className="fas fa-list-ul"></i> Your Fixed Deposits
          </h3>
        </div>

        {loading ? (
          <div className="fd-loading">
            <div className="loading-spinner"></div>
            <p>Loading your fixed deposits...</p>
          </div>
        ) : fds.length === 0 ? (
          <div className="fd-empty-state">
            <i className="fas fa-certificate"></i>
            <h3>No Fixed Deposits Yet</h3>
            <p>Start your investment journey with guaranteed returns</p>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              Create Your First FD
            </button>
          </div>
        ) : (
          <div className="fd-grid">
            {fds.map((fd) => {
              const principal = Number(fd.principal_amount || fd.amount || 0);
              const maturityAmount = Number(fd.maturity_amount) || calculateMaturityAmount(
                principal,
                Number(fd.interest_rate),
                Number(fd.tenure_months)
              );
              const maturityDate = new Date(fd.maturity_date);
              const today = new Date();
              const daysLeft = Math.ceil((maturityDate - today) / (1000 * 60 * 60 * 24));

              return (
                <div key={fd.id || fd.fd_id} className="fd-card" onClick={() => setSelectedFD(fd)}>
                  <div className="fd-card-header">
                    <div className={`fd-status-badge ${getStatusColor(fd.status)}`}>
                      <i className={`fas ${getStatusIcon(fd.status)}`}></i>
                      {fd.status?.toLowerCase() || 'active'}
                    </div>
                    <div className="fd-amount">
                      {formatCurrency(principal)}
                    </div>
                  </div>
                  
                  <div className="fd-card-body">
                    <div className="fd-detail-row">
                      <span className="fd-detail-label">
                        <i className="fas fa-percent"></i> Interest Rate
                      </span>
                      <span className="fd-detail-value highlight">{fd.interest_rate}% p.a.</span>
                    </div>
                    <div className="fd-detail-row">
                      <span className="fd-detail-label">
                        <i className="fas fa-clock"></i> Tenure
                      </span>
                      <span className="fd-detail-value">
                        {fd.tenure_months} months ({Math.floor(fd.tenure_months / 12)}Y {fd.tenure_months % 12}M)
                      </span>
                    </div>
                    <div className="fd-detail-row">
                      <span className="fd-detail-label">
                        <i className="fas fa-calendar-check"></i> Maturity Date
                      </span>
                      <span className="fd-detail-value">
                        {formatDate(fd.maturity_date)}
                      </span>
                    </div>
                    <div className="fd-detail-row">
                      <span className="fd-detail-label">
                        <i className="fas fa-chart-line"></i> Maturity Amount
                      </span>
                      <span className="fd-detail-value success">
                        {formatCurrency(maturityAmount)}
                      </span>
                    </div>
                    {fd.status?.toLowerCase() === 'active' && (
                      <div className="fd-days-left">
                        <i className="fas fa-hourglass-half"></i>
                        {daysLeft > 0 ? `${daysLeft} days remaining` : 'Maturing soon'}
                      </div>
                    )}
                  </div>
                  
                  <div className="fd-card-footer">
                    <button className="fd-view-btn" onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFD(fd);
                    }}>
                      View Details <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FD Details Modal */}
      {selectedFD && (
        <div className="modal-overlay" onClick={() => setSelectedFD(null)}>
          <div className="modal-content fd-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Fixed Deposit Details</h2>
              <button className="btn-close" onClick={() => setSelectedFD(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="fd-details-content">
              <div className="fd-details-hero">
                <div className="fd-details-amount">
                  {formatCurrency(selectedFD.principal_amount || selectedFD.amount)}
                </div>
                <div className="fd-details-status">
                  <span className={`badge ${getStatusColor(selectedFD.status)}`}>
                    {selectedFD.status?.toLowerCase() || 'active'}
                  </span>
                </div>
              </div>

              <div className="fd-details-grid">
                <div className="fd-details-item">
                  <label>FD ID</label>
                  <p>{selectedFD.id || selectedFD.fd_id}</p>
                </div>
                <div className="fd-details-item">
                  <label>Account ID</label>
                  <p>{selectedFD.account_id}</p>
                </div>
                <div className="fd-details-item">
                  <label>Interest Rate</label>
                  <p className="highlight">{selectedFD.interest_rate}% per annum</p>
                </div>
                <div className="fd-details-item">
                  <label>Tenure</label>
                  <p>{selectedFD.tenure_months} months</p>
                </div>
                <div className="fd-details-item">
                  <label>Start Date</label>
                  <p>{formatDate(selectedFD.start_date)}</p>
                </div>
                <div className="fd-details-item">
                  <label>Maturity Date</label>
                  <p>{formatDate(selectedFD.maturity_date)}</p>
                </div>
                <div className="fd-details-item">
                  <label>Maturity Amount</label>
                  <p className="success">
                    {formatCurrency(selectedFD.maturity_amount || calculateMaturityAmount(
                      Number(selectedFD.principal_amount || selectedFD.amount),
                      Number(selectedFD.interest_rate),
                      Number(selectedFD.tenure_months)
                    ))}
                  </p>
                </div>
                <div className="fd-details-item">
                  <label>Interest Earned</label>
                  <p className="success">
                    {formatCurrency(
                      (selectedFD.maturity_amount || calculateMaturityAmount(
                        Number(selectedFD.principal_amount || selectedFD.amount),
                        Number(selectedFD.interest_rate),
                        Number(selectedFD.tenure_months)
                      )) - Number(selectedFD.principal_amount || selectedFD.amount)
                    )}
                  </p>
                </div>
              </div>

              {selectedFD.status?.toLowerCase() === 'active' && (
                <div className="fd-actions">
                  <button className="btn-danger" disabled>
                    <i className="fas fa-exclamation-triangle"></i> Premature Closure (Not Allowed)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create FD Modal */}
      {showCreateModal && (
        <CreateFDModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleFDCreated}
        />
      )}
    </div>
  );
};

export default FDPage;