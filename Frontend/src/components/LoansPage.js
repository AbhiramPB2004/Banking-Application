import React, { useState, useEffect } from 'react';
import { loanAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import './LoansPage.css';
import LoanApplicationModal from './LoanApplicationModal';
import LoanPaymentModal from './LoanPaymentModal';

const LoansPage = () => {
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null); // { type: 'emi'|'foreclose', loan }
  const [scheduleModalData, setScheduleModalData] = useState(null);
  
  const { showToast } = useAuth();

  const fetchLoans = async () => {
    try {
      setIsLoading(true);
      const res = await loanAPI.getMyLoans();
      if (res.success) {
        setLoans(res.data);
      }
    } catch (error) {
      showToast('error', error.message || 'Failed to fetch loans');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleApplySuccess = () => {
    setShowApplyModal(false);
    fetchLoans();
    showToast('success', 'Loan application submitted successfully!');
  };

  const handlePaymentSuccess = () => {
    setPaymentData(null);
    fetchLoans();
    showToast('success', 'Payment processed successfully!');
  };

  const openSchedule = async (loanId) => {
    try {
      showToast('info', 'Fetching schedule...');
      const res = await loanAPI.getLoanSchedule(loanId);
      if (res.success) {
        setScheduleModalData(res.data);
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to fetch schedule');
    }
  };

  const getLoanIcon = (type) => {
    switch (type) {
      case 'home': return 'fa-home';
      case 'vehicle': return 'fa-car';
      case 'education': return 'fa-user-graduate';
      default: return 'fa-hand-holding-usd';
    }
  };

  if (isLoading) {
    return (
      <div className="loans-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div className="loading-spinner lg" />
      </div>
    );
  }

  return (
    <div className="loans-page">
      <div className="loans-header">
        <h1>My Loans</h1>
        <button className="btn-apply-loan" onClick={() => setShowApplyModal(true)}>
          <i className="fas fa-plus"></i> Apply for Loan
        </button>
      </div>

      {loans.length === 0 ? (
        <div className="empty-loans">
          <i className="fas fa-money-check-alt"></i>
          <h3>No active loans</h3>
          <p>You don't have any loans right now. Apply for one to get started.</p>
          <button className="btn-apply-loan" style={{ margin: '0 auto' }} onClick={() => setShowApplyModal(true)}>
            Apply Now
          </button>
        </div>
      ) : (
        <div className="loans-grid">
          {loans.map(loan => (
            <div key={loan.loan_id} className="loan-card">
              <div className="loan-header">
                <div className="loan-type">
                  <i className={`fas ${getLoanIcon(loan.loan_type)}`}></i>
                  {loan.loan_type} Loan
                </div>
                <div className={`loan-status ${loan.loan_status === 'active' ? loan.approval_status : loan.loan_status}`}>
                  {loan.loan_status === 'active' ? loan.approval_status : loan.loan_status}
                </div>
              </div>

              <div className="loan-details">
                <div className="detail-row">
                  <span className="detail-label">Principal Amount</span>
                  <span className="detail-value">₹{parseFloat(loan.principal_amount).toLocaleString('en-IN')}</span>
                </div>
                {loan.approval_status === 'approved' && loan.loan_status === 'active' && (
                  <>
                    <div className="detail-row">
                      <span className="detail-label">Outstanding Balance</span>
                      <span className="detail-value highlight">₹{parseFloat(loan.outstanding_balance).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">EMI Amount</span>
                      <span className="detail-value">₹{parseFloat(loan.monthly_emi).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Interest Rate</span>
                      <span className="detail-value">{parseFloat(loan.interest_rate)}% p.a.</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Next Due Date</span>
                      <span className="detail-value">
                        {loan.next_due_date ? new Date(loan.next_due_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </>
                )}
                {loan.approval_status === 'rejected' && (
                  <div className="detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span className="detail-label">Rejection Reason</span>
                    <span className="detail-value" style={{ color: '#ef4444', fontSize: '0.8rem', textAlign: 'left' }}>
                      {loan.rejection_reason}
                    </span>
                  </div>
                )}
              </div>

              {loan.approval_status === 'approved' && loan.loan_status === 'active' && (
                <div className="loan-actions">
                  <button 
                    className="btn-loan-action btn-pay-emi"
                    onClick={() => setPaymentData({ type: 'emi', loan })}
                  >
                    <i className="fas fa-credit-card"></i> Pay EMI
                  </button>
                  <button 
                    className="btn-loan-action btn-schedule"
                    onClick={() => openSchedule(loan.loan_id)}
                  >
                    <i className="fas fa-calendar-alt"></i> Schedule
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showApplyModal && (
        <LoanApplicationModal 
          onClose={() => setShowApplyModal(false)}
          onSuccess={handleApplySuccess}
        />
      )}

      {paymentData && (
        <LoanPaymentModal
          type={paymentData.type}
          loan={paymentData.loan}
          onClose={() => setPaymentData(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {scheduleModalData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>Amortization Schedule</h2>
              <button className="btn-close" onClick={() => setScheduleModalData(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="schedule-table-container">
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Due Date</th>
                    <th>EMI</th>
                    <th>Principal</th>
                    <th>Interest</th>
                    <th>Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleModalData.map((item) => (
                    <tr key={item.schedule_id}>
                      <td>{item.installment_number}</td>
                      <td>{new Date(item.due_date).toLocaleDateString()}</td>
                      <td>₹{parseFloat(item.emi_amount).toLocaleString('en-IN')}</td>
                      <td>₹{parseFloat(item.principal_component).toLocaleString('en-IN')}</td>
                      <td>₹{parseFloat(item.interest_component).toLocaleString('en-IN')}</td>
                      <td>₹{parseFloat(item.outstanding_after).toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`status-badge ${item.status}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoansPage;
