/**
 * /shared/utils/creditScoreCalculator.js
 * Simulated engine for creditworthiness assessment.
 */

const calculateCreditScore = (userData) => {
    const { annual_income, existing_liabilities, kyc_status, occupation } = userData;

    // 1. Fundamental Block: KYC must be verified for any credit product [cite: 799, 2147, 2431]
    if (kyc_status !== 'verified') {
        return { score: 0, eligible: false, reason: "KYC verification required" };
    }

    // 2. Debt-to-Income (DTI) Ratio Logic [cite: 2432, 2433]
    // A high ratio indicates high risk.
    const monthlyIncome = annual_income / 12;
    const dtiRatio = existing_liabilities / monthlyIncome;

    let baseScore = 300; // Starting simulated score

    // 3. Income-based Scoring [cite: 864, 2462]
    if (annual_income > 1200000) baseScore += 400;
    else if (annual_income > 600000) baseScore += 250;
    else if (annual_income > 300000) baseScore += 100;

    // 4. Liability Penalty [cite: 2432]
    if (dtiRatio > 0.5) baseScore -= 200; // High debt penalty
    else if (dtiRatio > 0.3) baseScore -= 100;

    // 5. Occupation Stability Factor [cite: 797, 861]
    const stableJobs = ['salaried', 'professional'];
    // if (stableJobs.includes(occupation?.toLowerCase())) {
    //     baseScore += 50;
    // }

    // Determine Risk Category 
    let category = 'HIGH_RISK';
    if (baseScore >= 750) category = 'EXCELLENT';
    else if (baseScore >= 650) category = 'GOOD';
    else if (baseScore >= 500) category = 'AVERAGE';

    return {
        score: Math.min(900, Math.max(300, baseScore)),
        category: category,
        eligible: baseScore >= 500
    };
};

module.exports = { calculateCreditScore };