// src/api/api.js
// Central API service — all backend calls go through here

const BASE_URL = '';  // CRA proxy handles forwarding to port 5000

/**
 * Core fetch wrapper with error handling
 */
async function request(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Send cookies (access_token, refresh_token)
    ...options,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
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
