import React, { useState, useEffect } from 'react';
import { creditCardAPI, accountAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import ApplyCreditCardModal from './ApplyCreditCardModal';
import CardActionModal from './CardActionModal';
import CreditCardStatementModal from './CreditCardStatementModal';
import './CreditCardsPage.css';

const CreditCardsPage = () => {

  const { showToast } = useAuth();

  const [cards, setCards] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flippedCardId, setFlippedCardId] = useState(null);
  const [lastActionId, setLastActionId] = useState(null);

  const [showApplyModal, setShowApplyModal] =
    useState(false);

  const [actionData, setActionData] =
    useState(null);

  const [statementData, setStatementData] =
    useState(null);

  const [showStatement, setShowStatement] =
    useState(false);

  // Confirm dialog state for close/delete
  const [confirmAction, setConfirmAction] = useState(null);

  /**
   * LOAD CARDS
   */
  const fetchCards = async (overrideId = null) => {
    try {
      if (cards.length === 0) setLoading(true);
      const res = await creditCardAPI.getMyCards();
      if (res.success) {
        // Use the passed ID if available, otherwise fallback to state
        const activeId = overrideId || lastActionId;

        const sortedCards = (res.data || []).sort((a, b) => {
          // Rule 1: Status Grouping (Active > Blocked > Closed)
          const statusOrder = { active: 0, blocked: 1, closed: 2 };
          const statusDiff = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
          if (statusDiff !== 0) return statusDiff;

          // Rule 2: Session Priority (Whichever card was just acted on)
          // We return -1 if 'a' is the target to move it to the top-left of its group
          if (a.card_id === activeId) return -1;
          if (b.card_id === activeId) return 1;

          // Rule 3: Database Recency
          return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
        });
        setCards(sortedCards);
      }
    } catch {
      showToast('error', 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  /**
   * LOAD ACCOUNTS
   */
  const fetchAccounts = async () => {
    try {
      const res = await accountAPI.getMyAccounts();
      if (res.success) {
        setAccounts(res.data || []);
      }
    } catch {
      showToast('error', 'Failed to load accounts');
    }
  };

  useEffect(() => {
    fetchCards();
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFlip = (id, e) => {
    // If clicking a button on the back, don't flip back immediately 
    // unless it's the specific flip-back button or the background
    if (e.target.closest('.cc-btn')) return;

    setFlippedCardId(flippedCardId === id ? null : id);
  };

  /**
   * VIEW STATEMENT
   */
  const handleViewStatement = async (cardId) => {
    try {
      const res = await creditCardAPI.getStatement(cardId);
      if (res.success) {
        setStatementData(res.data);
        setShowStatement(true);
      }
    } catch {
      showToast('error', 'Failed to load statement');
    }
  };

  /**
   * BLOCK CARD
   */
  const handleBlockCard = async (cardId) => {
    if (!window.confirm('Block this card?')) return;
    try {
      await creditCardAPI.blockCard(cardId);
      showToast('success', 'Card blocked');
      setLastActionId(cardId);
      fetchCards(cardId);
    } catch (err) {
      showToast('error', err.data?.message || 'Failed');
    }
  };

  /**
   * UNBLOCK CARD
   */
  const handleUnblockCard = async (cardId) => {
    if (!window.confirm('Unblock this card?')) return;
    try {
      await creditCardAPI.unblockCard(cardId);
      showToast('success', 'Card unblocked');
      setLastActionId(cardId);
      fetchCards(cardId);
    } catch (err) {
      showToast('error', err.data?.message || 'Failed');
    }
  };

  /**
   * CLOSE CARD
   */
  const handleCloseCard = async (cardId) => {
    try {
      const res = await creditCardAPI.closeCard(cardId);
      showToast('success', res.data?.message || 'Card closed permanently');
      setLastActionId(cardId);
      setConfirmAction(null);
      fetchCards(cardId);
    } catch (err) {
      showToast('error', err.data?.message || err.message || 'Failed to close card');
      setConfirmAction(null);
    }
  };

  /**
   * DELETE CARD
   */
  const handleDeleteCard = async (cardId) => {
    try {
      await creditCardAPI.deleteCard(cardId);
      showToast('success', 'Card record permanently deleted');
      setConfirmAction(null);
      fetchCards();
    } catch (err) {
      showToast('error', err.data?.message || err.message || 'Failed to delete card');
      setConfirmAction(null);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading cards..." />;
  }

  return (
    <div className="cc-page">

      {/* HEADER */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h1>Credit Cards</h1>
          <p>Manage your cards</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowApplyModal(true)}>
          Apply Card
        </button>
      </div>

      {/* EMPTY */}
      {cards.length === 0 ? (
        <div className="empty-state">
          <h3>No Cards</h3>
        </div>
      ) : (
        <div className="cc-grid">
          {cards.map((card) => {
            const isPremium = card.card_type?.toLowerCase().includes('premium');
            const cardTierClass = isPremium ? 'premium-tier' : 'classic-tier';
            const formattedType = card.card_type?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'VISA Card';
            const isFlipped = flippedCardId === card.card_id;

            return (
              <div
                key={card.card_id}
                className={`cc-card-container ${cardTierClass} ${isFlipped ? 'is-flipped' : ''}`}
                onClick={(e) => handleFlip(card.card_id, e)}
              >
                <div className="cc-card-inner">

                  {/* FRONT SIDE */}
                  <div className="cc-card-front">
                    <div className="cc-top">
                      <div className="cc-chip">
                        <div className="chip-line"></div>
                        <div className="chip-line"></div>
                        <div className="chip-line"></div>
                        <div className="chip-line"></div>
                      </div>
                      <div className="cc-header-right">
                        <div className="cc-brand">{formattedType}</div>
                        <div className={`status-badge-new ${card.status}`}>
                          <span className="status-dot"></span>
                          {card.status?.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div className="cc-number">{card.card_number}</div>

                    <div className="cc-details-row">
                      <div className="cc-stat">
                        <label>Available Balance</label>
                        <span className="accent">₹{Number(card.available_limit).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="cc-stat">
                        <label>Total Limit</label>
                        <span>₹{Number(card.credit_limit).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* BACK SIDE */}
                  <div className="cc-card-back">
                    <div className="cc-actions-back">
                      <button
                        className="cc-btn cc-btn-primary"
                        disabled={card.status === 'blocked'}
                        onClick={() => setActionData({ type: 'purchase', card })}
                      >
                        <i className="fas fa-shopping-bag"></i> Make Purchase
                      </button>

                      <button
                        className="cc-btn cc-btn-secondary"
                        onClick={() => setActionData({ type: 'payment', card })}
                      >
                        <i className="fas fa-credit-card"></i> Pay Balance
                      </button>

                      <button
                        className="cc-btn cc-btn-secondary"
                        onClick={() => handleViewStatement(card.card_id)}
                      >
                        <i className="fas fa-file-invoice"></i> View Statement
                      </button>

                      <button
                        className={card.status === 'blocked' ? 'cc-btn cc-btn-success-new' : 'cc-btn cc-btn-danger'}
                        onClick={() => card.status === 'blocked' ? handleUnblockCard(card.card_id) : handleBlockCard(card.card_id)}
                      >
                        {card.status === 'blocked' ? (
                          <><i className="fas fa-unlock"></i> Unblock Card</>
                        ) : (
                          <><i className="fas fa-ban"></i> Block Card</>
                        )}
                      </button>

                      {card.status !== 'closed' && (
                        <button
                          className="cc-btn cc-btn-close full-width"
                          onClick={() => setConfirmAction({
                            type: 'close',
                            cardId: card.card_id,
                            cardNumber: card.card_number,
                            outstandingBalance: Number(card.outstanding_balance)
                          })}
                        >
                          <i className="fas fa-times-circle"></i> Close Card
                        </button>
                      )}

                      {card.status === 'closed' && (
                        <button
                          className="cc-btn cc-btn-danger full-width"
                          onClick={() => setConfirmAction({
                            type: 'delete',
                            cardId: card.card_id,
                            cardNumber: card.card_number,
                            outstandingBalance: Number(card.outstanding_balance)
                          })}
                        >
                          <i className="fas fa-trash-alt"></i> Delete Card
                        </button>
                      )}
                    </div>

                    <button className="cc-flip-back" onClick={(e) => {
                      e.stopPropagation();
                      setFlippedCardId(null);
                    }}>
                      <i className="fas fa-undo"></i> Back to Details
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODALS */}
      {showApplyModal && (
        <ApplyCreditCardModal
          accounts={accounts}
          onClose={() => setShowApplyModal(false)}
          onSuccess={(newCard) => {
            const newId = newCard?.card_id;
            if (newId) setLastActionId(newId);
            setShowApplyModal(false);
            fetchCards(newId);
          }}
        />
      )}

      {actionData && (
        <CardActionModal
          type={actionData.type}
          card={actionData.card}
          onClose={() => setActionData(null)}
          onSuccess={(cardId) => {
            if (cardId) setLastActionId(cardId);
            fetchCards(cardId);
          }}
        />
      )}

      {showStatement && (
        <CreditCardStatementModal
          data={statementData}
          onClose={() => setShowStatement(false)}
        />
      )}

      {confirmAction && (
        <div className="modal-overlay">
          <div className="modal-content premium-confirm-modal" style={{ maxWidth: '480px', padding: '0' }}>
            <div className="confirm-modal-header">
              <div className={`confirm-icon-circle ${confirmAction.type}`}>
                <i className={confirmAction.type === 'delete' ? 'fas fa-trash-alt' : 'fas fa-times-circle'}></i>
              </div>
              <h2>{confirmAction.type === 'delete' ? 'Delete Card Record?' : 'Close Credit Card?'}</h2>
            </div>

            <div className="confirm-modal-body" style={{ padding: '0 2rem 2rem' }}>
              <p className="confirm-description">
                {confirmAction.type === 'close' ? (
                  <>
                    You are about to permanently close card ending in <strong>****{confirmAction.cardNumber?.slice(-4)}</strong>.
                    <br /><br />
                    {confirmAction.outstandingBalance > 0 ? (
                      <div className="confirm-alert-box warning">
                        <i className="fas fa-exclamation-triangle"></i>
                        <span>
                          Outstanding balance: <strong>₹{confirmAction.outstandingBalance.toLocaleString('en-IN')}</strong>.
                          Please clear all dues before closing.
                        </span>
                      </div>
                    ) : (
                      <div className="confirm-alert-box info">
                        <i className="fas fa-info-circle"></i>
                        <span>This action is irreversible. No further transactions will be allowed.</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    You are about to permanently delete the record for <strong>****{confirmAction.cardNumber?.slice(-4)}</strong>.
                    <br /><br />
                    <div className="confirm-alert-box danger">
                      <i className="fas fa-trash-alt"></i>
                      <span>This will permanently remove all history for this card from your dashboard.</span>
                    </div>
                  </>
                )}
              </p>

              <div className="confirm-modal-actions">
                <button className="btn btn-secondary" onClick={() => setConfirmAction(null)}>Cancel</button>
                <button
                  className={`btn ${confirmAction.type === 'delete' ? 'btn-danger' : 'btn-warning'}`}
                  onClick={() => confirmAction.type === 'delete' ? handleDeleteCard(confirmAction.cardId) : handleCloseCard(confirmAction.cardId)}
                >
                  {confirmAction.type === 'delete' ? 'Confirm Delete' : 'Confirm Closure'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditCardsPage;