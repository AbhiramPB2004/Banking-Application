import React, { useState, useEffect } from 'react';
import { creditCardAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import ApplyCreditCardModal from './ApplyCreditCardModal';
import CardActionModal from './CardActionModal';
import './CreditCardsPage.css';

const CreditCardsPage = () => {
  const { showToast } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [actionData, setActionData] = useState(null); // { type: 'purchase' | 'payment', card }

  const fetchCards = async () => {
    try {
      setLoading(true);
      const res = await creditCardAPI.getMyCards();
      if (res.success) {
        setCards(res.data || []);
      }
    } catch (err) {
      showToast('error', 'Failed to load credit cards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []); // eslint-disable-line

  const handleApplySuccess = (newCard) => {
    setShowApplyModal(false);
    showToast('success', 'Credit Card approved and issued!');
    fetchCards();
  };

  const handleActionSuccess = () => {
    setActionData(null);
    showToast('success', 'Transaction completed successfully');
    fetchCards();
  };

  const handleBlockCard = async (cardId) => {
    if (!window.confirm("Are you sure you want to block this card? This action is immediate.")) return;
    try {
      await creditCardAPI.blockCard(cardId);
      showToast('success', 'Card blocked successfully');
      fetchCards();
    } catch (err) {
      showToast('error', err.data?.message || 'Failed to block card');
    }
  };

  if (loading) return <LoadingSpinner text="Loading credit cards..." />;

  return (
    <div className="cc-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Credit Cards</h1>
          <p>Manage your cards, make purchases, and pay your bills</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowApplyModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '12px' }}>
          <i className="fas fa-credit-card"></i> Apply for Card
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-credit-card" />
          <h3>No Credit Cards</h3>
          <p>You don't have any credit cards with us. Apply now to get instant access to premium credit.</p>
        </div>
      ) : (
        <div className="cc-grid">
          {cards.map((card) => (
            <div key={card.card_id} className="cc-card-item">
              {card.status === 'blocked' && <div className="status-badge blocked">BLOCKED</div>}
              
              <div className="cc-top">
                <div className="cc-chip"></div>
                <div className="cc-brand">VISA PREMIUM</div>
              </div>

              <div className="cc-number">{card.card_number}</div>

              <div className="cc-details-row">
                <div className="cc-stat">
                  <label>Available Limit</label>
                  <span className="accent">₹{card.available_limit.toLocaleString('en-IN')}</span>
                </div>
                <div className="cc-stat">
                  <label>Outstanding</label>
                  <span>₹{card.outstanding_balance.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="cc-actions">
                <button 
                  className="cc-btn cc-btn-primary" 
                  disabled={card.status === 'blocked'}
                  onClick={() => setActionData({ type: 'purchase', card })}
                >
                  <i className="fas fa-shopping-cart"></i> Buy
                </button>
                <button 
                  className="cc-btn cc-btn-secondary"
                  disabled={card.outstanding_balance === 0}
                  onClick={() => setActionData({ type: 'payment', card })}
                >
                  <i className="fas fa-rupee-sign"></i> Pay Bill
                </button>
                <button 
                  className="cc-btn cc-btn-danger"
                  disabled={card.status === 'blocked'}
                  onClick={() => handleBlockCard(card.card_id)}
                >
                  <i className="fas fa-lock"></i> Block
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showApplyModal && (
        <ApplyCreditCardModal 
          onClose={() => setShowApplyModal(false)}
          onSuccess={handleApplySuccess}
        />
      )}

      {actionData && (
        <CardActionModal
          type={actionData.type}
          card={actionData.card}
          onClose={() => setActionData(null)}
          onSuccess={handleActionSuccess}
        />
      )}
    </div>
  );
};

export default CreditCardsPage;
