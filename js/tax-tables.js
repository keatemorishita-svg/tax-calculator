const TAX_BRACKETS_ANNUAL = [
  { min: 0, max: 36000, rate: 0.03, quickDeduction: 0 },
  { min: 36000, max: 144000, rate: 0.10, quickDeduction: 2520 },
  { min: 144000, max: 300000, rate: 0.20, quickDeduction: 16920 },
  { min: 300000, max: 420000, rate: 0.25, quickDeduction: 31920 },
  { min: 420000, max: 660000, rate: 0.30, quickDeduction: 52920 },
  { min: 660000, max: 960000, rate: 0.35, quickDeduction: 85920 },
  { min: 960000, max: Infinity, rate: 0.45, quickDeduction: 181920 },
];

const TAX_BRACKETS_MONTHLY = [
  { min: 0, max: 3000, rate: 0.03, quickDeduction: 0 },
  { min: 3000, max: 12000, rate: 0.10, quickDeduction: 210 },
  { min: 12000, max: 25000, rate: 0.20, quickDeduction: 1410 },
  { min: 25000, max: 35000, rate: 0.25, quickDeduction: 2660 },
  { min: 35000, max: 55000, rate: 0.30, quickDeduction: 4410 },
  { min: 55000, max: 80000, rate: 0.35, quickDeduction: 7160 },
  { min: 80000, max: Infinity, rate: 0.45, quickDeduction: 15160 },
];

const LABOR_TAX_BRACKETS = [
  { min: 0, max: 20000, rate: 0.20, quickDeduction: 0 },
  { min: 20000, max: 50000, rate: 0.30, quickDeduction: 2000 },
  { min: 50000, max: Infinity, rate: 0.40, quickDeduction: 7000 },
];

const START_POINT_MONTHLY = 5000;

const SOCIAL_INSURANCE_RATES = {
  pension: 0.08,
  medical: 0.02,
  unemployment: 0.005,
};

const HOUSING_FUND_RATE_DEFAULT = 0.05;
const HOUSING_FUND_RATE_MIN = 0.05;
const HOUSING_FUND_RATE_MAX = 0.12;

const SPECIAL_DEDUCTION_STANDARDS = {
  childrenEducation: 2000,
  continuingEducationAcademic: 400,
  continuingEducationVocational: 3600,
  medicalThreshold: 15000,
  medicalLimit: 80000,
  housingLoanInterest: 1000,
  housingRentTier1: 1500,
  housingRentTier2: 1100,
  housingRentTier3: 800,
  elderlyCareOnlyChild: 3000,
  elderlyCareNonOnlyChild: 1500,
  infantCare: 2000,
};

const LABOR_DEDUCTION_THRESHOLD = 4000;
const LABOR_DEDUCTION_BELOW = 0.8;
const LABOR_DEDUCTION_FIXED = 800;
const ROYALTY_FIRST = 0.8;
const ROYALTY_SECOND = 0.7;

function getAnnualBracket(taxableIncome) {
  for (const b of TAX_BRACKETS_ANNUAL) {
    if (taxableIncome > b.min && taxableIncome <= b.max) return b;
  }
  return TAX_BRACKETS_ANNUAL[TAX_BRACKETS_ANNUAL.length - 1];
}

function getMonthlyBracket(avgMonthly) {
  for (const b of TAX_BRACKETS_MONTHLY) {
    if (avgMonthly > b.min && avgMonthly <= b.max) return b;
  }
  return TAX_BRACKETS_MONTHLY[TAX_BRACKETS_MONTHLY.length - 1];
}
