const FD = require("../models/fd.model");
const { calculateFD } = require("../utils/interestCalculator");
const auditService = require("../../audit-service/services/auditService");
// ✅ Import sequelize
const { sequelize } = require("../../../shared/config/db");

// ✅ Get Account model from sequelize registry
const Account = sequelize.models.Account;

exports.createFD = async (user_id, data) => {
  try{

  // ❌ Removed interest_rate from request body
  const { account_id, amount, tenure_months } = data;

  // ✅ Interest rate will be calculated automatically
  let interest_rate;

  // Account ID validation
  if (!account_id) {
    throw new Error("Account ID required");
  }

  // Amount validation
  if (amount === null || amount === "") {
    throw new Error("Amount cannot be empty.");
  }

  if (isNaN(amount)) {
    throw new Error("Amount must be numeric.");
  }

  if (Number(amount) <= 0) {
    throw new Error(
      "Amount must be greater than 0."
    );
  }

  if (Number(amount) < 1000) {
    throw new Error(
      "Minimum FD amount is 1000."
    );
  }

  if (Number(amount) > 100000000) {
    throw new Error(
      "Amount exceeds maximum allowed limit."
    );
  }

  // Tenure validation
  if (
    tenure_months === null ||
    tenure_months === ""
  ) {
    throw new Error("Tenure cannot be empty.");
  }

  if (isNaN(tenure_months)) {
    throw new Error("Tenure must be numeric.");
  }

  if (Number(tenure_months) <= 0) {
    throw new Error(
      "Tenure must be greater than 0."
    );
  }

  if (Number(tenure_months) < 3) {
    throw new Error(
      "Minimum FD tenure is 3 months."
    );
  }

  if (Number(tenure_months) > 120) {
    throw new Error(
      "Maximum FD tenure is 120 months."
    );
  }

  // ✅ Auto-calculate interest rate based on tenure

  // ✅ Auto-calculate interest rate based on tenure

if (tenure_months === 3) {
  interest_rate = 4.5;
}

else if (tenure_months === 6) {
  interest_rate = 5.5;
}

else if (tenure_months === 12) {
  interest_rate = 7;
}

else if (
  tenure_months >= 24 &&
  tenure_months <= 60
) {
  interest_rate = 8.5;
}

// ✅ Added missing slab
else if (
  tenure_months >= 61 &&
  tenure_months <= 71
) {
  interest_rate = 9;
}

else if (
  tenure_months >= 72 &&
  tenure_months <= 84
) {
  interest_rate = 10;
}

else if (
  tenure_months > 84 &&
  tenure_months <= 108
) {
  interest_rate = 12;
}

else if (
  tenure_months > 108 &&
  tenure_months <= 120
) {
  interest_rate = 15;
}

else {
  throw new Error(
    "Invalid tenure period."
  );
}
if (
  Number(data.interest_rate) !==
  Number(interest_rate)
) {
  throw new Error(
    `Invalid interest rate for ${tenure_months} months tenure. Expected interest rate is ${interest_rate}%.`
  );
}

  // 🔥 Safety check
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
    throw new Error(
      "Unauthorized: Account does not belong to user"
    );
  }

  // 🔒 STEP 3: Check balance
  if (account.balance < amount) {
    throw new Error("Insufficient balance");
  }

  // 💰 Deduct balance
  account.balance -= amount;
  await account.save();

  // 📊 Calculate FD
  // 📊 Calculate FD

const fdCalculation = calculateFD(
  amount,
  interest_rate,
  tenure_months
);

const maturity_amount =
  fdCalculation.maturityAmount;

  // 📅 Maturity date
  const maturity_date = new Date();

  maturity_date.setMonth(
    maturity_date.getMonth() + tenure_months
  );

  // ✅ Create FD
  const fd = await FD.create({
    user_id,
    account_id,
    principal_amount: amount,
    interest_rate,
    tenure_months,
    maturity_amount,
    maturity_date,
  });
await auditService.createAuditLog({
  user_id,
  action_type: "fd_created",
  entity_type: "fd",
  entity_id: fd.id,
  status: "success",
  metadata: {
    account_id,
    principal_amount: amount,
    interest_rate,
    tenure_months,
    maturity_amount,
  },
});
  return fd;
} catch(error) {

   await auditService.createAuditLog({
      user_id,
      action_type: "fd_created",
      entity_type: "fd",
      entity_id: null,
      status: "failure",
      metadata: {
         error: error.message,
         account_id: data.account_id,
         amount: data.amount,
         tenure_months: data.tenure_months,
      },
   });

   throw error;
}
};

exports.getFDs = async (user_id) => {
  return await FD.findAll({
    where: { user_id },
  });
};

exports.getFDById = async (id, user_id) => {
  const fd = await FD.findOne({
    where: { id, user_id },
  });

  if (!fd) {
    throw new Error("FD not found");
  }

  return fd;
};

exports.closeFD = async (id, user_id) => {
  try{
  const fd = await FD.findOne({
    where: { id, user_id },
  });

  if (!fd) {
    throw new Error("FD not found");
  }

  if (fd.status === "CLOSED") {
    throw new Error("FD already closed");
  }

  fd.status = "CLOSED";

  await fd.save();
  await auditService.createAuditLog({
  user_id,
  action_type: "fd_closed",
  entity_type: "fd",
  entity_id: fd.id,
  status: "success",
  metadata: {
    fd_id: fd.id,
    maturity_amount: fd.maturity_amount,
  },
});

  return fd;
} catch(error) {

   await auditService.createAuditLog({
      user_id,
      action_type: "fd_closed",
      entity_type: "fd",
      entity_id: id,
      status: "failure",
      metadata: {
         error: error.message,
      },
   });

   throw error;
}
};