# Credit Card Service

A comprehensive credit card management microservice for the Banking Application, built with Node.js, Express, and PostgreSQL. This service handles credit card applications, transactions, payments, and automated billing operations.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Business Logic](#business-logic)
- [Scheduled Jobs](#scheduled-jobs)
- [Validators](#validators)
- [Testing](#testing)
- [Error Handling](#error-handling)
- [Security](#security)

## 🎯 Overview

The Credit Card Service is a standalone microservice that manages all credit card-related operations including:
- Credit card applications with eligibility checks
- Real-time transaction processing
- Payment management and balance tracking
- Card lifecycle management (active, blocked, closed)
- Automated billing cycles and statement generation
- Integration with the User Service for KYC and income verification

**Default Port:** `5005`

## ✨ Features

### Core Functionality
- **Credit Card Issuance:** Apply for new credit cards with automated eligibility verification
- **Transaction Processing:** Process purchases and deduct from available credit limits
- **Payment Processing:** Make payments towards outstanding balances
- **Card Lifecycle Management:** Block, unblock, and close credit card accounts
- **Statement Generation:** Automated monthly statement generation
- **Billing Cycle Management:** Scheduled billing cycle execution

### Security & Compliance
- Token-based authentication for all endpoints
- KYC (Know Your Customer) verification integration
- Identity trust enforcement
- Credit score calculation
- User ownership validation on all operations
- Unique card number constraints

## 🏗️ Architecture

```
credit-card-service/
├── controllers/          # Request handlers
│   └── creditcard.controller.js
├── models/              # Database models
│   └── creditcard.model.js
├── routes/              # API route definitions
│   └── creditcard.routes.js
├── services/            # Business logic layer
│   └── creditcard.service.js
├── validators/          # Input validation
│   └── creditCardValidator.js
├── jobs/                # Scheduled tasks
│   ├── billingCycle.js
│   ├── paymentReminder.js
│   └── statementGenerator.js
├── tests/               # Unit and integration tests
│   └── creditCard.test.js
└── index.js             # Service entry point
```

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Setup Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the service root with:
   ```
   PORT=5005
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=banking_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret
   ```

3. **Start the Service**
   ```bash
   npm start
   ```

   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

## ⚙️ Configuration

The service uses PostgreSQL through Sequelize ORM and connects via the shared database configuration:

```javascript
// Connection established from shared/config/db.js
const { connectDB, sequelize } = require('../../shared/config/db');
```

**Database Synchronization:** Models auto-sync with the database on startup (`alter: true` mode).

**Logging:** Uses the shared logger utility from `shared/utils/logger.js`.

## 🔌 API Endpoints

All endpoints require authentication via JWT token in the `Authorization` header.

### Credit Card Application

**POST** `/api/credit-cards/apply`

Apply for a new credit card with automatic eligibility verification.

**Request Body:**
```json
{
  "requested_limit": 500000,
  "existing_liabilities": 0,
  "employment_type": "salaried"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "card_id": "550e8400-e29b-41d4-a716-446655440000",
    "card_number": "1234567890123456",
    "card_type": "VISA_PREMIUM",
    "credit_limit": 500000,
    "available_limit": 500000,
    "status": "active"
  },
  "message": "Credit card application successful"
}
```

**Error Responses:**
- `400`: Invalid input or eligibility failed
- `409`: Duplicate card constraint violation

---

### Get Card Details

**GET** `/api/credit-cards/:id`

Retrieve detailed information for a specific credit card.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "card_id": "550e8400-e29b-41d4-a716-446655440000",
    "card_number": "1234567890123456",
    "card_type": "VISA_PREMIUM",
    "credit_limit": 500000,
    "available_limit": 450000,
    "outstanding_balance": 50000,
    "minimum_due": 5000,
    "billing_cycle_date": 1,
    "status": "active"
  }
}
```

**Error Responses:**
- `404`: Card not found or unauthorized access

---

### Process Purchase

**POST** `/api/credit-cards/purchase`

Process a transaction and deduct from available credit limit.

**Request Body:**
```json
{
  "card_id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 25000,
  "merchant": "Amazon",
  "description": "Electronics purchase"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "card_id": "550e8400-e29b-41d4-a716-446655440000",
    "transaction_amount": 25000,
    "remaining_limit": 425000,
    "outstanding_balance": 75000
  },
  "message": "Transaction approved"
}
```

**Error Responses:**
- `400`: Card not active, insufficient credit limit, or card not found
- `404`: Unauthorized access

---

### Make Payment

**POST** `/api/credit-cards/payment`

Pay towards outstanding card balance.

**Request Body:**
```json
{
  "card_id": "550e8400-e29b-41d4-a716-446655440000",
  "payment_amount": 50000,
  "source_account_id": "460e8400-e29b-41d4-a716-446655440001"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "card_id": "550e8400-e29b-41d4-a716-446655440000",
    "previous_balance": 75000,
    "payment_amount": 50000,
    "new_balance": 25000,
    "available_limit": 475000
  },
  "message": "Payment successful"
}
```

**Error Responses:**
- `400`: Invalid payment amount or card not found

---

### Block Card

**PATCH** `/api/credit-cards/block/:id`

Block/freeze a credit card (security measure).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "card_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "blocked"
  },
  "message": "Card blocked successfully"
}
```

---

### Close Card

**PATCH** `/api/credit-cards/close/:id`

Permanently close a credit card account.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "card_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "closed"
  },
  "message": "Card closed successfully"
}
```

---

### Generate Statement

**GET** `/api/credit-cards/statement/:id`

Retrieve the monthly billing statement for a credit card.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "card_id": "550e8400-e29b-41d4-a716-446655440000",
    "billing_cycle_date": 1,
    "statement_date": "2026-04-30",
    "transactions": [...],
    "outstanding_balance": 25000,
    "minimum_due": 2500,
    "payment_due_date": "2026-05-20"
  }
}
```

## 📊 Database Schema

### CreditCard Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `card_id` | UUID | PRIMARY KEY | Unique card identifier (auto-generated) |
| `user_id` | UUID | NOT NULL, INDEXED | Reference to cardholder |
| `linked_account_id` | UUID | NOT NULL | Associated bank account for payments |
| `card_number` | STRING | UNIQUE, NOT NULL | 16-digit card number |
| `card_type` | STRING | NOT NULL | Card variant (e.g., VISA_PREMIUM) |
| `credit_limit` | DECIMAL(15,2) | NOT NULL | Maximum available credit |
| `available_limit` | DECIMAL(15,2) | NOT NULL | Current available balance |
| `outstanding_balance` | DECIMAL(15,2) | DEFAULT 0 | Current owed amount |
| `minimum_due` | DECIMAL(15,2) | DEFAULT 0 | Minimum payment required |
| `billing_cycle_date` | INTEGER | NOT NULL | Day of month for billing cycle (1-28) |
| `status` | ENUM | DEFAULT 'active' | Card status: `active`, `blocked`, or `closed` |
| `createdAt` | TIMESTAMP | Auto-managed | Record creation timestamp |
| `updatedAt` | TIMESTAMP | Auto-managed | Last update timestamp |

## 💼 Business Logic

### Credit Card Application Workflow

1. **User Submits Application**
   - Endpoint: `POST /api/credit-cards/apply`
   - User identity derived from JWT token (not request body)

2. **Eligibility Verification**
   - Fetches real user profile from User Service
   - Retrieves KYC status, annual income, and occupation
   - Runs credit score calculation using `creditScoreCalculator`

3. **Credit Limit Assignment**
   - Based on eligibility score and requested limit
   - Creates card with initial status: `active`

4. **Card Issuance**
   - Generates unique 16-digit card number
   - Sets billing cycle date to day 1
   - Returns card details to applicant

### Transaction Processing

1. **Purchase Request Validation**
   - Verifies card ownership (user_id match)
   - Checks if card status is `active`
   - Validates amount <= available_limit

2. **Balance Updates**
   - Deducts transaction amount from `available_limit`
   - Adds transaction amount to `outstanding_balance`
   - Persists changes to PostgreSQL

3. **Response**
   - Returns updated limits and balance information

### Payment Processing

1. **Payment Amount Validation**
   - Ensures payment_amount > 0
   - Verifies source account exists

2. **Balance Reconciliation**
   - Deducts payment from `outstanding_balance`
   - Adds payment to `available_limit`
   - Updates `minimum_due` if applicable

3. **Transaction Recording**
   - Logs payment in audit trail
   - Updates card status timestamp

### Card Lifecycle Management

| Status | Description | Allowed Operations |
|--------|-------------|------------------|
| `active` | Card in use | Transactions, payments, block, close |
| `blocked` | Card frozen | Payments only (to reduce balance), unblock |
| `closed` | Account terminated | View only |

## ⏱️ Scheduled Jobs

The service runs automated tasks using `node-cron`:

### 1. Billing Cycle Job
- **Schedule:** Monthly on 1st at 00:00 UTC (`0 0 1 * *`)
- **File:** `jobs/billingCycle.js`
- **Operations:**
  - Calculates minimum due amount
  - Generates payment due dates
  - Marks overdue payments
  - Initiates late payment notifications

### 2. Payment Reminder Job
- **File:** `jobs/paymentReminder.js`
- **Operations:**
  - Identifies cards with outstanding balance
  - Sends payment reminders to cardholders
  - Tracks reminder attempt history

### 3. Statement Generator Job
- **File:** `jobs/statementGenerator.js`
- **Operations:**
  - Aggregates monthly transactions
  - Calculates interest/fees (if applicable)
  - Generates PDF statements
  - Archives statements for compliance

## ✔️ Validators

The service includes comprehensive input validation through `creditCardValidator.js`:

### Application Validation

```javascript
validateCreditCardInput(data, 'application')
```

**Validates:**
- `requested_limit` > 0
- `annual_income` >= 300000
- `employment_type` is valid string

### Payment Validation

```javascript
validateCreditCardInput(data, 'payment')
```

**Validates:**
- `card_id` is provided
- `payment_amount` > 0
- `source_account_id` is provided

**Returns:**
```json
{
  "valid": true/false,
  "errors": ["error message 1", "error message 2"]
}
```

## 🧪 Testing

Unit and integration tests are located in `tests/creditCard.test.js`.

**Run Tests:**
```bash
npm test
```

**Test Coverage:**
- Credit card application scenarios
- Transaction processing edge cases
- Payment validations
- Error handling
- Authentication/authorization

## ⚠️ Error Handling

The service returns standardized error responses using `responseFormatter`:

**400 Bad Request**
```json
{
  "success": false,
  "error": "Requested limit must be a positive number."
}
```

**404 Not Found**
```json
{
  "success": false,
  "error": "Credit card not found or unauthorized access."
}
```

**409 Conflict**
```json
{
  "success": false,
  "error": "Card number already exists."
}
```

All errors are logged using the shared logger with error codes for tracking and debugging.

## 🔐 Security

### Authentication & Authorization
- **Token Verification:** JWT tokens verified on every request via `authMiddleware`
- **User Identity:** Derived from token claims, not request body
- **Ownership Validation:** All operations verify `user_id` matches token claims

### Data Protection
- **Card Numbers:** Stored in database (should be masked in responses in production)
- **Sensitive Data:** Only authorized users can access their own card details
- **Transaction Isolation:** Each user can only see/modify their own cards

### Input Sanitization
- All inputs validated before processing
- SQL injection prevention through Sequelize ORM
- Amount validation prevents negative values

### Best Practices
- Avoid exposing full card numbers in API responses (implement masking like `**** **** **** 1234`)
- Use HTTPS for all communications
- Implement rate limiting on sensitive endpoints
- Log all financial transactions for audit trails
- Implement PCI DSS compliance measures for production

## 📞 Support & Troubleshooting

### Common Issues

**"Credit eligibility failed"**
- User's credit score is insufficient
- Check annual income meets threshold (₹300,000 minimum)
- Verify KYC status with User Service

**"Transaction declined: Insufficient available credit limit"**
- Available credit balance is lower than transaction amount
- Make a payment to increase available limit
- Request credit limit increase

**"Card is not active"**
- Card status is blocked or closed
- Unblock the card if it's frozen
- Cannot reopen a closed card; apply for a new one

**Database Connection Error**
- Verify PostgreSQL is running
- Check DB credentials in `.env` file
- Ensure database exists and is accessible

## 📝 License

This service is part of the Banking Application. See the main repository for license information.
