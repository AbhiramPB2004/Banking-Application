function calculateFD(principal, rate, tenureMonths) {
  let maturityAmount;
  let interestEarned;

  const years = tenureMonths / 12;

  // Less than 12 months → Monthly simple interest
  if (tenureMonths < 12) {
    interestEarned =
      (principal * rate * tenureMonths) / (12 * 100);

    maturityAmount = principal + interestEarned;
  }

  // 1 to 5 years → Simple interest
  else if (years <= 5) {
    interestEarned =
      (principal * rate * years) / 100;

    maturityAmount = principal + interestEarned;
  }

  // More than 5 years → Compound interest
  else {
    const r = rate / 100;
    const n = 4; // quarterly compounding

    maturityAmount =
      principal * Math.pow((1 + r / n), n * years);

    interestEarned = maturityAmount - principal;
  }

  return {
    maturityAmount: parseFloat(maturityAmount.toFixed(2)),
    interestEarned: parseFloat(interestEarned.toFixed(2)),
  };
}

module.exports = { calculateFD };