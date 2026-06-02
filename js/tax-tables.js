// 个人所得税税率表 & 常量 — 基于 2019 年新个税法（截至 2026 年仍适用）

// 年度综合所得税率表（工资薪金、劳务报酬、稿酬、特许权使用费）
export const TAX_BRACKETS_ANNUAL = [
  { min: 0, max: 36000, rate: 0.03, quickDeduction: 0 },
  { min: 36000, max: 144000, rate: 0.10, quickDeduction: 2520 },
  { min: 144000, max: 300000, rate: 0.20, quickDeduction: 16920 },
  { min: 300000, max: 420000, rate: 0.25, quickDeduction: 31920 },
  { min: 420000, max: 660000, rate: 0.30, quickDeduction: 52920 },
  { min: 660000, max: 960000, rate: 0.35, quickDeduction: 85920 },
  { min: 960000, max: Infinity, rate: 0.45, quickDeduction: 181920 },
];

// 月度税率表（年终奖单独计税用）
export const TAX_BRACKETS_MONTHLY = [
  { min: 0, max: 3000, rate: 0.03, quickDeduction: 0 },
  { min: 3000, max: 12000, rate: 0.10, quickDeduction: 210 },
  { min: 12000, max: 25000, rate: 0.20, quickDeduction: 1410 },
  { min: 25000, max: 35000, rate: 0.25, quickDeduction: 2660 },
  { min: 35000, max: 55000, rate: 0.30, quickDeduction: 4410 },
  { min: 55000, max: 80000, rate: 0.35, quickDeduction: 7160 },
  { min: 80000, max: Infinity, rate: 0.45, quickDeduction: 15160 },
];

// 劳务报酬预扣率表
export const LABOR_TAX_BRACKETS = [
  { min: 0, max: 20000, rate: 0.20, quickDeduction: 0 },
  { min: 20000, max: 50000, rate: 0.30, quickDeduction: 2000 },
  { min: 50000, max: Infinity, rate: 0.40, quickDeduction: 7000 },
];

// 基本减除费用（起征点）
export const START_POINT_MONTHLY = 5000;

// 社保缴费比例（个人部分）
export const SOCIAL_INSURANCE_RATES = {
  pension: 0.08,       // 养老保险
  medical: 0.02,       // 医疗保险
  unemployment: 0.005, // 失业保险
};

// 公积金比例范围
export const HOUSING_FUND_RATE_DEFAULT = 0.05;
export const HOUSING_FUND_RATE_MIN = 0.05;
export const HOUSING_FUND_RATE_MAX = 0.12;

// 专项附加扣除标准（元/月，除标注外）
export const SPECIAL_DEDUCTION_STANDARDS = {
  childrenEducation: 2000,             // 子女教育（每个）
  continuingEducationAcademic: 400,   // 学历继续教育
  continuingEducationVocational: 3600,// 职业资格继续教育（元/年）
  medicalThreshold: 15000,            // 大病医疗起付线（元/年）
  medicalLimit: 80000,                // 大病医疗上限（元/年）
  housingLoanInterest: 1000,          // 住房贷款利息
  housingRentTier1: 1500,             // 住房租金 — 京沪广深
  housingRentTier2: 1100,             // 住房租金 — 大城市
  housingRentTier3: 800,              // 住房租金 — 其他城市
  elderlyCareOnlyChild: 3000,         // 赡养老人 — 独生子女
  elderlyCareNonOnlyChild: 1500,      // 赡养老人 — 非独生子女
  infantCare: 2000,                   // 婴幼儿照护（每个）
};

// 劳务报酬费用扣除
export const LABOR_DEDUCTION_THRESHOLD = 4000;
export const LABOR_DEDUCTION_BELOW = 0.8;
export const LABOR_DEDUCTION_FIXED = 800;

// 稿酬所得扣除
export const ROYALTY_FIRST = 0.8;   // 减除 20%
export const ROYALTY_SECOND = 0.7;  // 再减征 30%

// 默认社保基数上下限（0 = 不限制）
export const SI_BASE_CAP_DEFAULT = 0;
export const SI_BASE_FLOOR_DEFAULT = 0;

/**
 * 根据累计应纳税所得额查找年度税率档位
 */
export function getAnnualBracket(taxableIncome) {
  for (const b of TAX_BRACKETS_ANNUAL) {
    if (taxableIncome > b.min && taxableIncome <= b.max) return b;
  }
  return TAX_BRACKETS_ANNUAL[TAX_BRACKETS_ANNUAL.length - 1];
}

/**
 * 根据月均收入查找月度税率档位（年终奖用）
 */
export function getMonthlyBracket(avgMonthly) {
  for (const b of TAX_BRACKETS_MONTHLY) {
    if (avgMonthly > b.min && avgMonthly <= b.max) return b;
  }
  return TAX_BRACKETS_MONTHLY[TAX_BRACKETS_MONTHLY.length - 1];
}
