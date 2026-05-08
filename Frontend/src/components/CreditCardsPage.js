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
  // confirmAction shape: { type: 'close'|'delete', cardId, cardNumber, outstandingBalance }

  /**
   * LOAD CARDS
   */
  const fetchCards = async () => {

    try {

      setLoading(true);

      const res =
        await creditCardAPI.getMyCards();

      if (res.success) {
        setCards(res.data || []);
      }

    } catch {

      showToast(
        'error',
        'Failed to load cards'
      );

    } finally {

      setLoading(false);

    }
  };

  /**
   * LOAD ACCOUNTS
   */
  const fetchAccounts = async () => {

    try {

      const res =
        await accountAPI.getMyAccounts();

      if (res.success) {
        setAccounts(res.data || []);
      }

    } catch {

      showToast(
        'error',
        'Failed to load accounts'
      );

    }
  };

  useEffect(() => {

    fetchCards();
    fetchAccounts();

  }, []);

  /**
   * VIEW STATEMENT
   */
  const handleViewStatement = async (
    cardId
  ) => {

    try {

      const res =
        await creditCardAPI.getStatement(
          cardId
        );

      if (res.success) {

        setStatementData(res.data);
        setShowStatement(true);

      }

    } catch {

      showToast(
        'error',
        'Failed to load statement'
      );

    }
  };

  /**
   * BLOCK CARD
   */
  const handleBlockCard = async (
    cardId
  ) => {

    if (
      !window.confirm(
        'Block this card?'
      )
    ) return;

    try {

      await creditCardAPI.blockCard(
        cardId
      );

      showToast(
        'success',
        'Card blocked'
      );

      fetchCards();

    } catch (err) {

      showToast(
        'error',
        err.data?.message || 'Failed'
      );

    }
  };

  /**
   * UNBLOCK CARD
   */
  const handleUnblockCard = async (
    cardId
  ) => {

    if (
      !window.confirm(
        'Unblock this card?'
      )
    ) return;

    try {

      await creditCardAPI.unblockCard(
        cardId
      );

      showToast(
        'success',
        'Card unblocked'
      );

      fetchCards();

    } catch (err) {

      showToast(
        'error',
        err.data?.message || 'Failed'
      );

    }
  };

  /**
   * CLOSE CARD
   * Soft-closes the card (status → 'closed').
   * Backend blocks this if any outstanding balance exists.
   */
  const handleCloseCard = async (cardId) => {
    try {
      const res = await creditCardAPI.closeCard(cardId);
      showToast('success', res.data?.message || 'Card closed permanently');
      setConfirmAction(null);
      fetchCards();
    } catch (err) {
      showToast('error', err.data?.message || err.message || 'Failed to close card');
      setConfirmAction(null);
    }
  };

  /**
   * DELETE CARD
   * Hard-deletes the record. Backend requires card to be 'closed' + zero balance.
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

    return (
      <LoadingSpinner
        text="Loading cards..."
      />
    );
  }

  return (
    <div className="cc-page">

      {/* HEADER */}
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >

        <div>
          <h1>Credit Cards</h1>
          <p>Manage your cards</p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() =>
            setShowApplyModal(true)
          }
        >
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

            return (
              <div
                key={card.card_id}
                className={`cc-card-item ${cardTierClass}`}
              >
                {/* TOP */}
                <div className="cc-top">
                  <div className="cc-chip">
                    <div className="chip-line"></div>
                    <div className="chip-line"></div>
                    <div className="chip-line"></div>
                    <div className="chip-line"></div>
                  </div>

                  <div className="cc-header-right">
                    <div className="cc-brand">
                      {formattedType}
                    </div>

                    {/* STATUS BADGE */}
                    <div className={`status-badge-new ${card.status}`}>
                      <span className="status-dot"></span>
                      {card.status?.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* NUMBER */}
                <div className="cc-number">
                  {card.card_number}
                </div>

                {/* LIMITS */}
                <div className="cc-details-row">
                  <div className="cc-stat">
                    <label>Available Limit</label>
                    <span className="accent">
                      ₹{Number(card.available_limit).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="cc-stat">
                    <label>Total Limit</label>
                    <span>
                      ₹{Number(card.credit_limit).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="cc-actions">
                  {/* BUY */}
                  <button
                    className="cc-btn cc-btn-primary"
                    disabled={card.status === 'blocked'}
                    onClick={() =>
                      setActionData({
                        type: 'purchase',
                        card
                      })
                    }
                  >
                    <i className="fas fa-shopping-bag"></i> Buy
                  </button>

                  {/* PAYMENT */}
                  <button
                    className="cc-btn cc-btn-secondary"
                    onClick={() =>
                      setActionData({
                        type: 'payment',
                        card
                      })
                    }
                  >
                    <i className="fas fa-credit-card"></i> Pay
                  </button>

                  {/* STATEMENT */}
                  <button
                    className="cc-btn cc-btn-secondary"
                    onClick={() =>
                      handleViewStatement(card.card_id)
                    }
                  >
                    <i className="fas fa-file-invoice"></i> Statement
                  </button>

                  {/* BLOCK/UNBLOCK */}
                  <button
                    className={
                      card.status === 'blocked'
                        ? 'cc-btn cc-btn-success-new'
                        : 'cc-btn cc-btn-danger'
                    }
                    onClick={() =>
                      card.status === 'blocked'
                        ? handleUnblockCard(card.card_id)
                        : handleBlockCard(card.card_id)
                    }
                  >
                    {card.status === 'blocked' ? (
                      <><i className="fas fa-unlock"></i> Unblock</>
                    ) : (
                      <><i className="fas fa-ban"></i> Block</>
                    )}
                  </button>

                  {/* CLOSE CARD — only on active/blocked */}
                  {card.status !== 'closed' && (
                    <button
                      className="cc-btn cc-btn-close"
                      onClick={() =>
                        setConfirmAction({
                          type: 'close',
                          cardId: card.card_id,
                          cardNumber: card.card_number,
                          outstandingBalance: Number(card.outstanding_balance)
                        })
                      }
                    >
                      <i className="fas fa-times-circle"></i> Close Card
                    </button>
                  )}
                </div>

                {/* DELETE — only on closed cards */}
                {card.status === 'closed' && (
                  <button
                    className="cc-btn cc-btn-delete-full"
                    onClick={() =>
                      setConfirmAction({
                        type: 'delete',
                        cardId: card.card_id,
                        cardNumber: card.card_number,
                        outstandingBalance: Number(card.outstanding_balance)
                      })
                    }
                  >
                    <i className="fas fa-trash-alt"></i> Delete Card Record
                  </button>
                )}
              </div>
            );
          })}

        </div>
      )}

      {/* APPLY MODAL */}
      {showApplyModal && (
        <ApplyCreditCardModal
          accounts={accounts}
          onClose={() => setShowApplyModal(false)}
          onSuccess={() => {
            setShowApplyModal(false);
            fetchCards();
          }}
        />
      )}

      {/* ACTION MODAL */}
      {actionData && (
        <CardActionModal
          type={actionData.type}
          card={actionData.card}
          onClose={() => setActionData(null)}
          onSuccess={fetchCards}
        />
      )}

      {/* STATEMENT MODAL */}
      {showStatement && (
        <CreditCardStatementModal
          data={statementData}
          onClose={() => setShowStatement(false)}
        />
      )}

      {/* CONFIRM DIALOG — Close / Delete */}
      {confirmAction && (
        <div className="modal-overlay">
          <div className="modal-content confirm-dialog" style={{ maxWidth: '440px' }}>

            <div className="confirm-icon">
              <i className={confirmAction.type === 'delete' ? 'fas fa-trash-alt' : 'fas fa-times-circle'}></i>
            </div>

            <h2 className="confirm-title">
              {confirmAction.type === 'delete' ? 'Delete Card Record?' : 'Close Credit Card?'}
            </h2>

            <p className="confirm-body">
              {confirmAction.type === 'close' ? (
                <>
                  You are about to <strong>permanently close</strong> card ending in
                  {' '}<strong>****{confirmAction.cardNumber?.slice(-4)}</strong>.
                  <br /><br />
                  {confirmAction.outstandingBalance > 0 ? (
                    <span className="confirm-warning">
                      <i className="fas fa-exclamation-triangle"></i>&nbsp;
                      You have an outstanding balance of <strong>₹{confirmAction.outstandingBalance.toLocaleString('en-IN')}</strong>.
                      Clear all dues before closing.
                    </span>
                  ) : (
                    'This action is irreversible. No further transactions will be allowed on this card.'
                  )}
                </>
              ) : (
                <>
                  You are about to <strong>permanently delete</strong> the record for
                  {' '}<strong>****{confirmAction.cardNumber?.slice(-4)}</strong>.
                  <br /><br />
                  The card must already be <strong>closed</strong> with zero balance for this to succeed.
                  This cannot be undone.
                </>
              )}
            </p>

            <div className="confirm-actions">
              <button
                className="btn-cancel"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
              <button
                className={confirmAction.type === 'delete' ? 'btn-submit btn-submit-danger' : 'btn-submit btn-submit-warning'}
                onClick={() =>
                  confirmAction.type === 'delete'
                    ? handleDeleteCard(confirmAction.cardId)
                    : handleCloseCard(confirmAction.cardId)
                }
              >
                {confirmAction.type === 'delete' ? (
                  <><i className="fas fa-trash-alt"></i> Yes, Delete</>
                ) : (
                  <><i className="fas fa-times-circle"></i> Yes, Close Card</>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default CreditCardsPage;