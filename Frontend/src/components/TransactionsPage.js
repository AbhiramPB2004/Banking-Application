// src/components/TransactionsPage.jsx

import React, { useState, useEffect } from "react";
import { accountAPI, transactionAPI } from "../api/api";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";
import "./TransactionsPage.css";

const TransactionsPage = () => {
  const { showToast } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("transfer");

  const [formData, setFormData] = useState({
    source_account_id: "",
    target_account_number: "",
    amount: "",
    transaction_pin: "",
    transfer_type: "imps",
    description: "",
  });

  /**
   * FETCH ACCOUNTS
   */
  const fetchAccounts = async () => {
    try {
      const res = await accountAPI.getMyAccounts();

      if (res.success) {
        const accountList = res.data || [];
        setAccounts(accountList);

        if (accountList.length > 0 && !formData.source_account_id) {
          setFormData((prev) => ({
            ...prev,
            source_account_id: accountList[0].account_id,
          }));

          setSelectedAccountId(accountList[0].account_id);
        }
      }
    } catch (err) {
      showToast("error", "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  /**
   * INITIAL LOAD
   */
  useEffect(() => {
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * HANDLE INPUT CHANGE
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * HANDLE SUBMIT
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const amount = formData.amount.trim();

    // Amount is required
    if (!amount) {
      showToast("error", "Amount is required");
      return;
    }

    // Allow only valid numbers
    if (isNaN(amount)) {
      showToast("error", "Only valid numbers are allowed");
      return;
    }

    const numericAmount = Number(amount);

    // Amount should be greater than 0
    if (numericAmount <= 0) {
      showToast("error", "Amount should be greater than 0");
      return;
    }

    // Maximum 2 decimal places
    if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
      showToast("error", "Maximum 2 decimal places allowed");
      return;
    }

    // Maximum single transaction ₹1 Crore
    if (numericAmount > 10000000) {
      showToast(
        "error",
        "Maximum single transaction limit is ₹1,00,00,000"
      );
      return;
    }

    setActionLoading(true);

    try {
      let res;

      // Selected account
      const selectedAccount = accounts.find(
        (acc) => acc.account_id === formData.source_account_id
      );

      if (!selectedAccount) {
        throw new Error("Selected account not found");
      }

      /**
       * TRANSFER
       */
      if (activeTab === "transfer") {
        if (!formData.target_account_number.trim()) {
          showToast("error", "Recipient account number is required");
          return;
        }

        res = await transactionAPI.transfer({
          from_account_number: selectedAccount.account_number,
          to_account_number: formData.target_account_number.trim(),
          amount: numericAmount,
          transaction_type: formData.transfer_type,
          transaction_pin: formData.transaction_pin,
          description: formData.description,
        });
      }

      /**
       * DEPOSIT
       */
      else if (activeTab === "deposit") {
        res = await transactionAPI.deposit({
          account_number: selectedAccount.account_number,
          amount: numericAmount,
          transaction_pin: formData.transaction_pin,
        });
      }

      /**
       * WITHDRAW
       */
      else if (activeTab === "withdraw") {
        res = await transactionAPI.withdraw({
          account_number: selectedAccount.account_number,
          amount: numericAmount,
          transaction_pin: formData.transaction_pin,
        });
      }

      /**
       * SUCCESS
       */
      if (res?.success) {
        showToast(
          "success",
          `${
            activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
          } successful!`
        );

        // Reset form (keep selected account and transfer type)
        setFormData((prev) => ({
          ...prev,
          target_account_number: "",
          amount: "",
          transaction_pin: "",
          description: "",
        }));

        // Refresh accounts/balances
        await fetchAccounts();
      }
    } catch (err) {
      console.error(err);

      showToast(
        "error",
        err?.response?.data?.message ||
          err?.response?.data?.errors?.[0] ||
          err?.data?.message ||
          err?.message ||
          "Transaction failed"
      );
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * LOADING STATE
   */
  if (loading) {
    return (
      <LoadingSpinner text="Initializing transactions..." />
    );
  }

  return (
    <div className="transactions-page animate-fade">
      {/* HEADER */}
      <div className="page-header">
        <h1>Transactions</h1>
        <p>Transfer funds, deposit or withdraw money</p>
      </div>

      {/* TABS */}
      <div className="transaction-tabs">
        <button
          type="button"
          className={`tab-btn ${
            activeTab === "transfer" ? "active" : ""
          }`}
          onClick={() => setActiveTab("transfer")}
        >
          <i className="fas fa-exchange-alt" />
          Transfer
        </button>

        <button
          type="button"
          className={`tab-btn ${
            activeTab === "deposit" ? "active" : ""
          }`}
          onClick={() => setActiveTab("deposit")}
        >
          <i className="fas fa-arrow-down" />
          Deposit
        </button>

        <button
          type="button"
          className={`tab-btn ${
            activeTab === "withdraw" ? "active" : ""
          }`}
          onClick={() => setActiveTab("withdraw")}
        >
          <i className="fas fa-arrow-up" />
          Withdraw
        </button>
      </div>

      {/* FULL WIDTH FORM */}
      <div className="transactions-grid">
        <div className="transaction-card">
          <h2>
            <i
              className={`fas ${
                activeTab === "transfer"
                  ? "fa-exchange-alt"
                  : activeTab === "deposit"
                  ? "fa-arrow-down"
                  : "fa-arrow-up"
              }`}
            />
            {activeTab.charAt(0).toUpperCase() +
              activeTab.slice(1)}{" "}
            Funds
          </h2>

          <form onSubmit={handleSubmit}>
            {/* ACCOUNT */}
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
                {accounts.map((acc) => (
                  <option
                    key={acc.account_id}
                    value={acc.account_id}
                  >
                    {acc.account_number} ({acc.account_type}) -
                    ₹
                    {parseFloat(acc.balance).toLocaleString(
                      "en-IN",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </option>
                ))}
              </select>
            </div>

            {/* TRANSFER FIELDS */}
            {activeTab === "transfer" && (
              <>
                <div className="form-group">
                  <label>Recipient Account Number</label>

                  <input
                    type="text"
                    name="target_account_number"
                    className="input-field"
                    placeholder="Enter account number"
                    value={
                      formData.target_account_number
                    }
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
                    <option value="internal">
                      Internal
                    </option>
                    <option value="imps">IMPS</option>
                    <option value="neft">NEFT</option>
                    <option value="rtgs">RTGS</option>
                  </select>
                </div>
              </>
            )}

            {/* AMOUNT */}
            <div className="form-group">
              <label>Amount (₹)</label>

              <input
                type="text"
                name="amount"
                className="input-field"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={(e) => {
                  const value = e.target.value;

                  // Allow empty
                  if (value === "") {
                    handleInputChange(e);
                    return;
                  }

                  // Allow only digits and decimal point
                  if (!/^\d*\.?\d*$/.test(value)) {
                    showToast(
                      "error",
                      "Only valid numbers are allowed"
                    );
                    return;
                  }

                  // Allow max 2 decimal places
                  if (!/^\d*\.?\d{0,2}$/.test(value)) {
                    showToast(
                      "error",
                      "Maximum 2 decimal places allowed"
                    );
                    return;
                  }

                  handleInputChange(e);
                }}
                inputMode="decimal"
                required
              />
            </div>

            {/* DESCRIPTION */}
            {activeTab === "transfer" && (
              <div className="form-group">
                <label>Description</label>

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

            {/* PIN */}
            <div className="form-group">
              <label>Transaction PIN</label>

              <input
                type="password"
                name="transaction_pin"
                className="input-field"
                placeholder="Enter PIN"
                maxLength="6"
                value={formData.transaction_pin}
                onChange={handleInputChange}
                required
              />

              <p className="pin-hint">
                Enter your secure transaction PIN
              </p>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <LoadingSpinner size="sm" text="" />
              ) : (
                `Confirm ${
                  activeTab.charAt(0).toUpperCase() +
                  activeTab.slice(1)
                }`
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;