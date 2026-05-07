// src/api/api.js
// Central API service — all backend calls go through here

const BASE_URL = '';  // CRA proxy handles forwarding to port 5000

/**
 * Silent token refresh
 * Calls POST /auth/refresh which reads the httpOnly refresh_token cookie.
 * Returns true if successful, false if session is fully expired.
 */
async function silentRefresh() {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Core fetch wrapper with automatic 401 → refresh → retry logic.
 *
 * Flow:
 *  1. Make the API call.
 *  2. If 401 and not already retrying → call /auth/refresh silently.
 *  3. If refresh succeeds → retry the original request once.
 *  4. If refresh fails (expired session) → dispatch 'auth:logout' event
 *     so AuthContext can force the user to the login screen.
 */
async function request(endpoint, options = {}, _retry = false) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Send cookies (access_token, refresh_token)
    ...options,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  // Silent token refresh on 401
  if (response.status === 401 && !_retry) {
    const refreshed = await silentRefresh();

    if (refreshed) {
      // Retry the original request with fresh cookies
      return request(endpoint, options, true);
    } else {
      // Refresh token is also expired — force logout
      window.dispatchEvent(new Event('auth:logout'));
      const error = new Error('Session expired. Please log in again.');
      error.status = 401;
      throw error;
    }
  }

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ─── Auth API ─────────────────────────────────────

export const authAPI = {
  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  verifyEmail: (email, otp) =>
    request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  resendVerificationOtp: (email) =>
    request('/auth/resend-verification-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  forgotPassword: (email) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (email, otp, new_password) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, new_password }),
    }),

  /**
   * Manually trigger a token refresh (not usually needed — api.js does it automatically)
   */
  refresh: () =>
    fetch('/auth/refresh', { method: 'POST', credentials: 'include' }),

  /**
   * Server-side logout — clears cookies in the Set-Cookie header and revokes DB session
   */
  logout: () =>
    fetch('/auth/logout', { method: 'POST', credentials: 'include' }),
};

// ─── User API ─────────────────────────────────────

export const userAPI = {
  getProfile: () =>
    request('/user/me'),

  updateProfile: (data) =>
    request('/user/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateKYC: (data) =>
    request('/user/kyc', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getAllUsers: () =>
    request('/user/all'),

  updateUserStatus: (target_user_id, status) =>
    request('/user/status', {
      method: 'PATCH',
      body: JSON.stringify({ target_user_id, status }),
    }),
};

// ─── Account API ──────────────────────────────────

export const accountAPI = {
  createAccount: (data) =>
    request('/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMyAccounts: () =>
    request('/accounts/user/me'),

  getAccountById: (id) =>
    request(`/accounts/${id}`),

  updateAccount: (id, data) =>
    request(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  closeAccount: (id) =>
    request(`/accounts/${id}`, {
      method: 'DELETE',
    }),
};

// ─── Loan API ─────────────────────────────────────

export const loanAPI = {
  getMyLoans: () =>
    request('/loans/user/me'),

  applyForLoan: (data) =>
    request('/loans/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  makePayment: (data) =>
    request('/loans/payment', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getLoanById: (id) =>
    request(`/loans/${id}`),

  getLoanSchedule: (id) =>
    request(`/loans/schedule/${id}`),

  forecloseLoan: (id, data) =>
    request(`/loans/foreclose/${id}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ─── Credit Card API ─────────────────────────────────

export const creditCardAPI = {

  getMyCards: () =>
    request('/credit-cards/user/me'),

  applyForCard: (data) =>
    request('/credit-cards/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  processPurchase: (data) =>
    request('/credit-cards/purchase', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  makePayment: (data) =>
    request('/credit-cards/payment', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  blockCard: (id) =>
    request(`/credit-cards/block/${id}`, {
      method: 'PATCH',
    }),

  /* NEW */
  unblockCard: (id) =>
    request(`/credit-cards/unblock/${id}`, {
      method: 'PATCH',
    }),

  getStatement: (id) =>
    request(`/credit-cards/statement/${id}`),

  closeCard: (id) =>
    request(`/credit-cards/close/${id}`, {
      method: 'PATCH',
    }),

  deleteCard: (id) =>
    request(`/credit-cards/${id}`, {
      method: 'DELETE',
    }),
};
// Investment API

export const investmentAPI = {
  getMarketOverview: () =>
    request('/investments/market'),

  getProducts: () =>
    request('/investments/products'),

  getProductNavHistory: (id) =>
    request(`/investments/products/${id}/nav-history`),

  getPortfolio: () =>
    request('/investments/portfolio/me'),

  getStatement: () =>
    request('/investments/statement/me'),

  buyInvestment: (data) =>
    request('/investments/buy', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  sellInvestment: (data) =>
    request('/investments/sell', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Add to your existing api.js file

export const fdAPI = {
  // Get all FDs for current user
  getMyFDs: () =>
    request('/fd/'),

  // Create a new FD
  createFD: (data) =>
    request('/fd/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get FD details by ID
  getFDDetails: (fdId) =>
    request(`/fd/${fdId}`),

  // Get FD transaction history
  getFDHistory: (fdId) =>
    request(`/fd/${fdId}/transactions`),

  // Premature closure (if allowed)
  closeFDPremature: (fdId) =>
    request(`/fd/${fdId}/close`, {
      method: 'POST',
    }),

  // Get FD interest rates
  getInterestRates: () =>
    request('/fd/interest-rates'),
};

export const transactionAPI = {
  transfer: (data) =>
    request('/transactions/transfer', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deposit: (data) =>
    request('/transactions/deposit', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  withdraw: (data) =>
    request('/transactions/withdraw', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getHistory: (account_id) =>
    request(`/transactions/history/${account_id}`),
};