import {
  SOCIAL_INSURANCE_RATES, START_POINT_MONTHLY,
  SPECIAL_DEDUCTION_STANDARDS,
  LABOR_DEDUCTION_THRESHOLD, LABOR_DEDUCTION_BELOW, LABOR_DEDUCTION_FIXED,
  ROYALTY_FIRST, ROYALTY_SECOND, LABOR_TAX_BRACKETS,
  getAnnualBracket, getMonthlyBracket,
} from './tax-tables.js';

/**
 * 计算工资薪金月度预扣个税
 * @param {number[]} salaries - 12 个月应发工资数组
 * @param {number} housingFundRate - 公积金比例 (0.05~0.12)
 * @param {number} specialMonthly - 月度专项附加扣除总额
 * @param {number} medicalAnnual - 大病医疗年度实际发生额（年度汇算用）
 * @param {number} siBaseCap - 社保基数上限（0 = 不限）
 * @param {number} siBaseFloor - 社保基数下限（0 = 不限）
 */
export function calcMonthlySalaryTax(
  salaries, housingFundRate, specialMonthly, medicalAnnual = 0,
  siBaseCap = 0, siBaseFloor = 0
) {
  if (!salaries || salaries.length !== 12) {
    salaries = new Array(12).fill(0);
  }
  const siRates = SOCIAL_INSURANCE_RATES;
  let cumSalary = 0, cumBase = 0, cumSocial = 0, cumHousing = 0, cumSpecial = 0, prevTax = 0;
  const months = [];

  for (let i = 0; i < 12; i++) {
    const rawSalary = salaries[i] || 0;

    // 社保/公积金基数 = 应发工资，受上下限约束
    let siBase = rawSalary;
    if (siBaseFloor > 0 && siBase < siBaseFloor) siBase = siBaseFloor;
    if (siBaseCap > 0 && siBase > siBaseCap) siBase = siBaseCap;

    const socialTotal = siBase * (siRates.pension + siRates.medical + siRates.unemployment);
    const hf = siBase * housingFundRate;

    cumSalary += rawSalary;
    cumBase += START_POINT_MONTHLY;
    cumSocial += socialTotal;
    cumHousing += hf;
    cumSpecial += specialMonthly;

    const deductible = cumBase + cumSocial + cumHousing + cumSpecial;
    const cumTaxable = Math.max(0, cumSalary - deductible);
    let taxCum = 0, taxMonth = 0;

    if (cumTaxable > 0) {
      const br = getAnnualBracket(cumTaxable);
      taxCum = Math.max(0, cumTaxable * br.rate - br.quickDeduction);
      taxMonth = Math.max(0, taxCum - prevTax);
    }
    prevTax = taxCum;

    months.push({
      month: i + 1,
      salary: rawSalary,
      socialInsurance: socialTotal,
      housingFund: hf,
      specialDeduction: specialMonthly,
      taxableIncome: cumTaxable,
      taxThisMonth: Math.round(taxMonth),
      taxCumulative: Math.round(taxCum),
    });
  }

  const totalSalary = salaries.reduce((a, b) => a + b, 0);
  const totalTax = Math.round(prevTax);
  const totalSocial = months.reduce((a, m) => a + m.socialInsurance, 0);
  const totalHousing = months.reduce((a, m) => a + m.housingFund, 0);
  const totalSpecial = specialMonthly * 12;

  // 大病医疗专项附加扣除（年度汇算清缴）
  const medicalDeductible = calcMedicalDeduction(medicalAnnual);

  return {
    months,
    summary: {
      totalSalary: Math.round(totalSalary),
      totalSocial: Math.round(totalSocial),
      totalHousing: Math.round(totalHousing),
      totalSpecial: Math.round(totalSpecial),
      totalTax,
      afterTax: Math.round(totalSalary - totalSocial - totalHousing - totalTax),
      averageRate: totalSalary > 0 ? totalTax / totalSalary : 0,
      medicalDeductible,  // 大病医疗年度可扣除额（汇算清缴时使用）
    },
  };
}

/**
 * 年终奖优化方案对比
 * 方案A：单独计税（年终奖÷12 查月度税率表）
 * 方案B：合并计税（并入全年综合所得）
 */
export function calcYearEndBonusOptimization(bonus, salarySummary, specialMonthly) {
  if (bonus <= 0) return null;
  const { totalSalary, totalSocial, totalHousing, totalTax: salaryTax } = salarySummary;

  // 方案A：单独计税
  const avg = bonus / 12;
  const mBr = getMonthlyBracket(avg);
  const taxA = Math.round(Math.max(0, bonus * mBr.rate - mBr.quickDeduction));

  // 方案B：合并计税
  const combined = totalSalary + bonus;
  const deduct = START_POINT_MONTHLY * 12 + totalSocial + totalHousing + specialMonthly * 12;
  const combTaxable = Math.max(0, combined - deduct);
  let taxB = 0;
  if (combTaxable > 0) {
    const aBr = getAnnualBracket(combTaxable);
    taxB = Math.max(0, Math.round(combTaxable * aBr.rate - aBr.quickDeduction) - salaryTax);
  }

  const saving = Math.abs(taxA - taxB);
  const recommended = taxA <= taxB ? '单独计税' : '合并计税';

  return {
    bonus,
    methodA: taxA,
    methodB: taxB,
    saving,
    recommended,
    afterTaxA: bonus - taxA,
    afterTaxB: bonus - taxB,
  };
}

/**
 * 劳务报酬个税计算
 */
export function calcLaborIncome(income) {
  if (income <= 0) return { taxableIncome: 0, tax: 0 };
  const base = income <= LABOR_DEDUCTION_THRESHOLD
    ? income - LABOR_DEDUCTION_FIXED
    : income * LABOR_DEDUCTION_BELOW;
  const taxableIncome = Math.max(0, base);
  if (taxableIncome <= 0) return { taxableIncome: 0, tax: 0 };
  const br = LABOR_TAX_BRACKETS.find(b => taxableIncome > b.min && taxableIncome <= b.max)
    || LABOR_TAX_BRACKETS[2];
  return {
    taxableIncome: Math.round(taxableIncome),
    tax: Math.round(taxableIncome * br.rate - br.quickDeduction),
  };
}

/**
 * 稿酬所得个税计算
 */
export function calcAuthorIncome(income) {
  if (income <= 0) return { taxableIncome: 0, tax: 0 };
  const taxableIncome = Math.max(0, income * ROYALTY_FIRST * ROYALTY_SECOND);
  return {
    taxableIncome: Math.round(taxableIncome),
    tax: Math.round(taxableIncome * 0.2),
  };
}

/**
 * 计算月度专项附加扣除总额
 * 注意：大病医疗（medicalAnnual）在年度汇算时计算，不在此处按月扣除
 *       职业资格继续教育按年 3600 元折算为月 300 元
 */
export function getSpecialDeductionMonthly(deductions) {
  const std = SPECIAL_DEDUCTION_STANDARDS;
  let total = 0;

  if (deductions.childrenCount) total += deductions.childrenCount * std.childrenEducation;
  if (deductions.educationAcademic) total += std.continuingEducationAcademic;
  if (deductions.educationVocational) total += Math.round(std.continuingEducationVocational / 12); // 3600/12=300
  if (deductions.housingLoan) total += std.housingLoanInterest;
  if (deductions.housingRent === 1) total += std.housingRentTier1;
  else if (deductions.housingRent === 2) total += std.housingRentTier2;
  else if (deductions.housingRent === 3) total += std.housingRentTier3;
  if (deductions.elderlyOnly) total += std.elderlyCareOnlyChild;
  if (deductions.elderlyShare) total += std.elderlyCareNonOnlyChild;
  if (deductions.infantCount) total += deductions.infantCount * std.infantCare;

  return total;
}

/**
 * 计算大病医疗年度可扣除额
 * 实际发生额超过 15,000 元的部分，上限 80,000 元
 */
export function calcMedicalDeduction(actualAnnual) {
  if (!actualAnnual || actualAnnual <= SPECIAL_DEDUCTION_STANDARDS.medicalThreshold) return 0;
  return Math.min(
    actualAnnual - SPECIAL_DEDUCTION_STANDARDS.medicalThreshold,
    SPECIAL_DEDUCTION_STANDARDS.medicalLimit
  );
}
