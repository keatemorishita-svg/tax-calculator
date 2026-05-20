function calcMonthlySalaryTax(salaries, housingFundRate, specialMonthly, medicalAnnual) {
  if (!salaries || salaries.length !== 12) {
    salaries = new Array(12).fill(0);
  }
  const siRates = SOCIAL_INSURANCE_RATES;
  let cumSalary = 0, cumBase = 0, cumSocial = 0, cumHousing = 0, cumSpecial = 0, prevTax = 0;
  const months = [];

  for (let i = 0; i < 12; i++) {
    const s = salaries[i] || 0;
    const si = s * siRates.pension;
    const sm = s * siRates.medical;
    const su = s * siRates.unemployment;
    const hf = s * housingFundRate;
    const socialTotal = si + sm + su;

    cumSalary += s;
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
      month: i + 1, salary: s, socialInsurance: socialTotal, housingFund: hf,
      specialDeduction: specialMonthly, taxableIncome: cumTaxable,
      taxThisMonth: Math.round(taxMonth), taxCumulative: Math.round(taxCum),
    });
  }

  const totalSalary = salaries.reduce((a, b) => a + b, 0);
  const totalTax = Math.round(prevTax);
  const totalSocial = months.reduce((a, m) => a + m.socialInsurance, 0);
  const totalHousing = months.reduce((a, m) => a + m.housingFund, 0);
  const totalSpecial = specialMonthly * 12;

  return {
    months,
    summary: {
      totalSalary: Math.round(totalSalary), totalSocial: Math.round(totalSocial),
      totalHousing: Math.round(totalHousing), totalSpecial: Math.round(totalSpecial),
      totalTax, afterTax: Math.round(totalSalary - totalSocial - totalHousing - totalTax),
      averageRate: totalSalary > 0 ? totalTax / totalSalary : 0,
    },
  };
}

function calcYearEndBonusOptimization(bonus, salarySummary, specialMonthly) {
  if (bonus <= 0) return null;
  const { totalSalary, totalSocial, totalHousing, totalTax: salaryTax } = salarySummary;

  const avg = bonus / 12;
  const mBr = getMonthlyBracket(avg);
  const taxA = Math.round(Math.max(0, bonus * mBr.rate - mBr.quickDeduction));

  const combined = totalSalary + bonus;
  const deduct = START_POINT_MONTHLY * 12 + totalSocial + totalHousing + specialMonthly * 12;
  const combTaxable = Math.max(0, combined - deduct);
  let taxB = 0;
  if (combTaxable > 0) {
    const aBr = getAnnualBracket(combTaxable);
    taxB = Math.max(0, Math.round(combTaxable * aBr.rate - aBr.quickDeduction) - salaryTax);
  }

  const saving = Math.abs(taxA - taxB);
  const recommended = taxA <= taxB ? '\u5355\u72ec\u8BA1\u7A0E' : '\u5408\u5E76\u8BA1\u7A0E';

  return {
    bonus, methodA: taxA, methodB: taxB, saving,
    recommended, afterTaxA: bonus - taxA, afterTaxB: bonus - taxB,
  };
}

function calcLaborIncome(income) {
  if (income <= 0) return { taxableIncome: 0, tax: 0 };
  const base = income <= LABOR_DEDUCTION_THRESHOLD ? income - LABOR_DEDUCTION_FIXED : income * LABOR_DEDUCTION_BELOW;
  const taxableIncome = Math.max(0, base);
  if (taxableIncome <= 0) return { taxableIncome: 0, tax: 0 };
  const br = LABOR_TAX_BRACKETS.find(b => taxableIncome > b.min && taxableIncome <= b.max) || LABOR_TAX_BRACKETS[2];
  return { taxableIncome: Math.round(taxableIncome), tax: Math.round(taxableIncome * br.rate - br.quickDeduction) };
}

function calcAuthorIncome(income) {
  if (income <= 0) return { taxableIncome: 0, tax: 0 };
  const taxableIncome = Math.max(0, income * ROYALTY_FIRST * ROYALTY_SECOND);
  return { taxableIncome: Math.round(taxableIncome), tax: Math.round(taxableIncome * 0.2) };
}

function getSpecialDeductionMonthly(d) {
  let total = 0;
  if (d.childrenCount) total += d.childrenCount * SPECIAL_DEDUCTION_STANDARDS.childrenEducation;
  if (d.educationAcademic) total += SPECIAL_DEDUCTION_STANDARDS.continuingEducationAcademic;
  if (d.housingLoan) total += SPECIAL_DEDUCTION_STANDARDS.housingLoanInterest;
  if (d.housingRent === 1) total += SPECIAL_DEDUCTION_STANDARDS.housingRentTier1;
  else if (d.housingRent === 2) total += SPECIAL_DEDUCTION_STANDARDS.housingRentTier2;
  else if (d.housingRent === 3) total += SPECIAL_DEDUCTION_STANDARDS.housingRentTier3;
  if (d.elderlyOnly) total += SPECIAL_DEDUCTION_STANDARDS.elderlyCareOnlyChild;
  if (d.elderlyShare) total += SPECIAL_DEDUCTION_STANDARDS.elderlyCareNonOnlyChild;
  if (d.infantCount) total += d.infantCount * SPECIAL_DEDUCTION_STANDARDS.infantCare;
  return total;
}
