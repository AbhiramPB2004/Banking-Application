function calculateFD(principal, rate, tenureMonths) {
  const t = tenureMonths / 12;
  const r = rate / 100;
  const n = 1;

  const maturityAmount = principal * Math.pow((1 + r / n), n * t);

  return parseFloat(maturityAmount.toFixed(2));
}

module.exports = { calculateFD };