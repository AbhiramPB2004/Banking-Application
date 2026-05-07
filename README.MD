# 🏦 Account Service

## 📌 Overview

The **Account Service** is a core microservice responsible for managing user bank accounts. It handles account creation, retrieval, updates, and closure while enforcing business rules such as KYC validation and balance constraints.

This service is built using **Node.js, Express, Sequelize, and PostgreSQL**, following a scalable microservices architecture.

---

## 🚀 Features

* ✅ Create new bank accounts (Savings, Current, Salary)
* ✅ Retrieve all user accounts (with optional filtering)
* ✅ Get account details by ID
* ✅ Update account details (restricted fields only)
* ✅ Close account (only when balance = 0)
* ✅ Enforce KYC verification before account creation
* ✅ Prevent operations on closed accounts
* ✅ Secure account number generation (shared utility)
* ✅ Strong input validation and error handling

---

## 🧠 Business Rules

* 🔒 User must have **KYC = verified** to create an account
* 💰 Minimum initial deposit: **₹1000**
* 🚫 Account cannot be closed unless **balance = 0**
* ❌ Closed accounts cannot be updated or used
* 🔁 Account numbers are **unique and securely generated**

---

## 📂 Project Structure

```text id="a1p0zk"
account-service/
│
├── controllers/
│   └── accountController.js
│
├── services/
│   └── accountService.js
│
├── models/
│   └── account.model.js
│
├── routes/
│   └── account.routes.js
│
├── validators/
│   └── accountValidator.js
│
├── tests/ (future use)
│
└── index.js
```

---

## 🔗 Tech Stack

* Node.js
* Express.js
* Sequelize ORM
* PostgreSQL
* dotenv
* JSON Web Token (JWT via shared middleware)

---

## 🔐 Authentication

This service uses **JWT-based authentication via HTTP-only cookies**.

* Token is extracted from cookies
* Middleware attaches user context to `req.user`

```js id="tq9g3l"
req.user = {
  user_id,
  email,
  role
}
```

---

## 🧾 API Endpoints

### 🔹 Create Account

```http id="p7v4qe"
POST /accounts
```

**Body:**

```json id="0qgq8t"
{
  "account_type": "savings",
  "initial_deposit": 5000
}
```

---

### 🔹 Get All Accounts

```http id="2c8gcn"
GET /accounts/user/me
```

**Optional Query Filter:**

```http id="vbrd3m"
GET /accounts/user/me?type=current
```

---

### 🔹 Get Single Account

```http id="8b9mkl"
GET /accounts/:id
```

---

### 🔹 Update Account

```http id="x4s6pb"
PUT /accounts/:id
```

---

### 🔹 Close Account

```http id="q1d8zn"
DELETE /accounts/:id
```

---

## 📊 Database Schema (Simplified)

| Field             | Type            |
| ----------------- | --------------- |
| account_id        | UUID            |
| user_id           | UUID            |
| account_number    | VARCHAR         |
| account_type      | STRING          |
| balance           | DECIMAL         |
| available_balance | DECIMAL         |
| min_balance       | DECIMAL         |
| status            | active / closed |
| created_at        | TIMESTAMP       |

---

## ⚙️ Environment Variables

```env id="e6f2sk"
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=
JWT_SECRET=
```

---

## 🧪 Testing Flow

1. Register user
2. Login (cookie-based JWT)
3. Create account
4. Fetch accounts
5. Close account (after setting balance = 0)

---

## ⚠️ Common Issues

| Issue                 | Cause                           |
| --------------------- | ------------------------------- |
| Cannot POST /accounts | Route not registered            |
| 401 Unauthorized      | Missing or invalid cookie token |
| Invalid account type  | Validator rejecting input       |
| Account not closing   | Balance not zero                |
| Module not found      | Incorrect import path           |

---

## 🔄 Future Enhancements

* 🔹 Transaction module integration
* 🔹 Beneficiary management
* 🔹 Audit logging
* 🔹 Pagination & filtering
* 🔹 Fraud detection & rate limiting

---

## 🤝 Contribution Guidelines

* Follow layered architecture (Controller → Service → Model)
* Keep validation in validators + service layer
* Maintain consistent error handling
* Avoid business logic in controllers

---

## 🏁 Summary

The Account Service ensures structured and secure account lifecycle management, forming a foundational part of the overall banking system.

---
