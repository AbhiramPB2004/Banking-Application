const FD = require("../models/fd.model");
const { calculateFD } = require("../utils/interestCalculator");

// ✅ Import sequelize
const { sequelize } = require("../../../shared/config/db");

// ✅ Get Account model from sequelize registry
const Account = sequelize.models.Account;

exports.createFD = async (user_id, data) => {
  const { account_id, amount, tenure_months, interest_rate } = data;

  if (!account_id) throw new Error("Account ID required");
  if (!amount || amount <= 0) throw new Error("Invalid amount");
  if (!tenure_months || tenure_months <= 0)
    throw new Error("Invalid tenure");
  if (!interest_rate || interest_rate <= 0)
    throw new Error("Invalid interest rate");

  // 🔥 Safety check (important)
  if (!Account) {
    throw new Error("Account model not initialized");
  }

  // 🔒 STEP 1: Check account exists
  const account = await Account.findByPk(account_id);

  if (!account) {
    throw new Error("Account not found");
  }

  // 🔒 STEP 2: Check ownership
  if (account.user_id !== user_id) {
    throw new Error("Unauthorized: Account does not belong to user");
  }

  // 🔒 STEP 3: Check balance
  if (account.balance < amount) {
    throw new Error("Insufficient balance");
  }

  // 💰 Deduct balance
  account.balance -= amount;
  await account.save();

  // 📊 Calculate FD
  const maturity_amount = calculateFD(
    amount,
    interest_rate,
    tenure_months
  );

  const maturity_date = new Date();
  maturity_date.setMonth(
    maturity_date.getMonth() + tenure_months
  );

  const fd = await FD.create({
    user_id,
    account_id,
    principal_amount: amount,
    interest_rate,
    tenure_months,
    maturity_amount,
    maturity_date,
  });

  return fd;
};

exports.getFDs = async (user_id) => {
  return await FD.findAll({ where: { user_id } });
};

exports.getFDById = async (id, user_id) => {
  const fd = await FD.findOne({
    where: { id, user_id },
  });

  if (!fd) throw new Error("FD not found");

  return fd;
};

exports.closeFD = async (id, user_id) => {
  const fd = await FD.findOne({
    where: { id, user_id },
  });

  if (!fd) throw new Error("FD not found");

  if (fd.status === "CLOSED")
    throw new Error("FD already closed");

  fd.status = "CLOSED";
  await fd.save();

  return fd;
};