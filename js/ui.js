import {
  HOUSING_FUND_RATE_DEFAULT, SI_BASE_CAP_DEFAULT, SI_BASE_FLOOR_DEFAULT,
} from './tax-tables.js';
import {
  calcMonthlySalaryTax, calcYearEndBonusOptimization, getSpecialDeductionMonthly,
} from './calculator.js';

// ─── 应用状态 ───────────────────────────────────
export let appState = {
  salaries: new Array(12).fill(0),
  housingFundRate: HOUSING_FUND_RATE_DEFAULT,
  siBaseCap: SI_BASE_CAP_DEFAULT,     // 社保基数上限
  siBaseFloor: SI_BASE_FLOOR_DEFAULT, // 社保基数下限
  specialDeductions: {
    childrenCount: 0,
    educationAcademic: false,
    educationVocational: false,
    medicalAnnual: 0,
    housingLoan: false,
    housingRent: 0,
    elderlyOnly: false,
    elderlyShare: false,
    infantCount: 0,
  },
  bonusHistory: [],
};

// ─── 初始化入口 ─────────────────────────────────
export function initUI() {
  renderSalaryTable();
  renderSpecialDeductionsForm();
  renderSiBaseInputs();
  bindEvents();
  loadBonusHistory();
  updateAll();
}

// ─── 渲染月度工资表格 ──────────────────────────
function renderSalaryTable() {
  const container = document.getElementById('salary-table-body');
  if (!container) return;
  let html = '';
  for (let i = 0; i < 12; i++) {
    const val = appState.salaries[i] || '';
    html += '<tr>' +
      '<td>' + (i + 1) + '月</td>' +
      '<td><input type="number" class="salary-input" data-month="' + i +
        '" value="' + val + '" min="0" step="1000" placeholder="0"></td>' +
      '<td class="auto-cell" id="social-' + i + '">0</td>' +
      '<td class="auto-cell" id="housing-' + i + '">0</td>' +
      '<td class="auto-cell" id="special-' + i + '">0</td>' +
      '<td class="auto-cell" id="taxable-' + i + '">0</td>' +
      '<td class="auto-cell tax-cell" id="tax-month-' + i + '">0</td>' +
      '<td class="auto-cell tax-cell" id="tax-cum-' + i + '">0</td>' +
      '</tr>';
  }
  container.innerHTML = html;
}

// ─── 渲染专项扣除表单 ──────────────────────────
function renderSpecialDeductionsForm() {
  const d = appState.specialDeductions;
  setVal('children-count', d.childrenCount);
  setChecked('education-academic', d.educationAcademic);
  setChecked('education-vocational', d.educationVocational);
  setVal('medical-annual', d.medicalAnnual);
  setChecked('housing-loan', d.housingLoan);
  setSelect('housing-rent', d.housingRent);
  setChecked('elderly-only', d.elderlyOnly);
  setChecked('elderly-share', d.elderlyShare);
  setVal('infant-count', d.infantCount);
}

// ─── 渲染社保基数上下限 ────────────────────────
function renderSiBaseInputs() {
  setVal('si-base-cap', appState.siBaseCap);
  setVal('si-base-floor', appState.siBaseFloor);
}

// ─── DOM 辅助 ───────────────────────────────────
function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}
function setChecked(id, val) {
  const el = document.getElementById(id);
  if (el) el.checked = !!val;
}
function setSelect(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || 0;
}

// ─── 事件绑定 ───────────────────────────────────
function bindEvents() {
  // 月度工资输入
  document.addEventListener('input', function (e) {
    if (e.target.classList.contains('salary-input')) {
      const month = parseInt(e.target.dataset.month);
      appState.salaries[month] = parseFloat(e.target.value) || 0;
      saveState();
      updateAll();
    }
  });

  // 公积金比例滑块
  const hfSlider = document.getElementById('housing-fund-rate');
  if (hfSlider) {
    hfSlider.addEventListener('input', function () {
      appState.housingFundRate = parseFloat(this.value) / 100;
      document.getElementById('housing-fund-label').textContent = this.value + '%';
      saveState();
      updateAll();
    });
  }

  // 社保基数上限
  const siCap = document.getElementById('si-base-cap');
  if (siCap) {
    siCap.addEventListener('input', function () {
      appState.siBaseCap = parseFloat(this.value) || 0;
      saveState();
      updateAll();
    });
  }

  // 社保基数下限
  const siFloor = document.getElementById('si-base-floor');
  if (siFloor) {
    siFloor.addEventListener('input', function () {
      appState.siBaseFloor = parseFloat(this.value) || 0;
      saveState();
      updateAll();
    });
  }

  // 专项附加扣除
  bindDeductionInput('children-count',      'childrenCount',     'int');
  bindDeductionChange('education-academic', 'educationAcademic', 'bool');
  bindDeductionChange('education-vocational','educationVocational','bool');
  bindDeductionInput('medical-annual',      'medicalAnnual',     'float');
  bindDeductionChange('housing-loan',       'housingLoan',       'bool');
  bindDeductionChange('housing-rent',       'housingRent',       'int');
  bindDeductionChange('elderly-only',       'elderlyOnly',       'bool');
  bindDeductionChange('elderly-share',      'elderlyShare',      'bool');
  bindDeductionInput('infant-count',        'infantCount',       'int');

  // 住房贷款 / 租金互斥
  const hl = document.getElementById('housing-loan');
  const hr = document.getElementById('housing-rent');
  if (hl) {
    hl.addEventListener('change', function () {
      appState.specialDeductions.housingLoan = this.checked;
      if (this.checked && hr) hr.value = '0';
      updateSpecialDeductions();
      saveState();
      updateAll();
    });
  }
  if (hr) {
    hr.addEventListener('change', function () {
      appState.specialDeductions.housingRent = parseInt(this.value) || 0;
      if (parseInt(this.value) && hl) hl.checked = false;
      updateSpecialDeductions();
      saveState();
      updateAll();
    });
  }

  // 赡养老人互斥
  const eo = document.getElementById('elderly-only');
  const es = document.getElementById('elderly-share');
  if (eo) {
    eo.addEventListener('change', function () {
      appState.specialDeductions.elderlyOnly = this.checked;
      if (this.checked && es) es.checked = false;
      saveState();
      updateAll();
    });
  }
  if (es) {
    es.addEventListener('change', function () {
      appState.specialDeductions.elderlyShare = this.checked;
      if (this.checked && eo) eo.checked = false;
      saveState();
      updateAll();
    });
  }

  // 年终奖
  const bonusInput = document.getElementById('bonus-input');
  if (bonusInput) bonusInput.addEventListener('input', updateBonusResult);

  const saveBtn = document.getElementById('save-bonus-btn');
  if (saveBtn) saveBtn.addEventListener('click', saveBonusComparison);

  // Tab 切换
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(this.dataset.tab).classList.add('active');
    });
  });
}

function bindDeductionInput(id, key, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', function () {
    if (type === 'int') appState.specialDeductions[key] = parseInt(this.value) || 0;
    else appState.specialDeductions[key] = parseFloat(this.value) || 0;
    saveState();
    updateAll();
  });
}

function bindDeductionChange(id, key, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('change', function () {
    if (type === 'bool') appState.specialDeductions[key] = this.checked;
    else if (type === 'int') appState.specialDeductions[key] = parseInt(this.value) || 0;
    saveState();
    updateAll();
  });
}

function updateSpecialDeductions() {
  const d = appState.specialDeductions;
  if (d.housingLoan) {
    const hr = document.getElementById('housing-rent');
    if (hr) hr.value = '0';
  }
  if (d.housingRent) {
    const hl = document.getElementById('housing-loan');
    if (hl) hl.checked = false;
  }
}

// ─── 全局更新 ───────────────────────────────────
export function updateAll() {
  const hfRate = appState.housingFundRate;
  const specialMonthly = getSpecialDeductionMonthly(appState.specialDeductions);
  const result = calcMonthlySalaryTax(
    appState.salaries, hfRate, specialMonthly,
    appState.specialDeductions.medicalAnnual,
    appState.siBaseCap, appState.siBaseFloor
  );

  // 更新月度表格
  for (let i = 0; i < 12; i++) {
    const m = result.months[i];
    const elSocial = document.getElementById('social-' + i);
    const elHousing = document.getElementById('housing-' + i);
    const elSpecial = document.getElementById('special-' + i);
    const elTaxable = document.getElementById('taxable-' + i);
    const elTaxMonth = document.getElementById('tax-month-' + i);
    const elTaxCum = document.getElementById('tax-cum-' + i);

    if (elSocial) elSocial.textContent = m ? m.socialInsurance.toFixed(2) : '0';
    if (elHousing) elHousing.textContent = m ? m.housingFund.toFixed(2) : '0';
    if (elSpecial) elSpecial.textContent = specialMonthly.toFixed(2);
    if (elTaxable) elTaxable.textContent = m ? m.taxableIncome.toFixed(2) : '0';
    if (elTaxMonth) elTaxMonth.textContent = m ? m.taxThisMonth : '0';
    if (elTaxCum) elTaxCum.textContent = m ? m.taxCumulative : '0';
  }

  // 更新年度汇总
  const s = result.summary;
  setText('summary-total-salary',  fmt(s.totalSalary));
  setText('summary-total-social',  fmt(s.totalSocial));
  setText('summary-total-housing', fmt(s.totalHousing));
  setText('summary-total-special', fmt(s.totalSpecial));
  setText('summary-total-tax',     fmt(s.totalTax));
  setText('summary-after-tax',     fmt(s.afterTax));
  setText('summary-avg-rate',      (s.averageRate * 100).toFixed(2) + '%');

  // 大病医疗扣除（年度汇算清缴）
  const medEl = document.getElementById('summary-medical');
  const medRow = document.getElementById('summary-medical-row');
  if (medEl && medRow) {
    if (s.medicalDeductible > 0) {
      medEl.textContent = fmt(s.medicalDeductible);
      medRow.style.display = '';
    } else {
      medRow.style.display = 'none';
    }
  }

  updateBonusResult();
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

export function fmt(n) {
  return n.toLocaleString();
}

// ─── 年终奖方案展示 ─────────────────────────────
function updateBonusResult() {
  const bonusInput = document.getElementById('bonus-input');
  const bonus = parseFloat(bonusInput?.value) || 0;
  const container = document.getElementById('bonus-result');
  if (!container) return;

  if (bonus <= 0) {
    container.innerHTML = '<p class="hint">输入年终奖金额，自动对比两种计税方案</p>';
    return;
  }

  const specialMonthly = getSpecialDeductionMonthly(appState.specialDeductions);
  const salaryResult = calcMonthlySalaryTax(
    appState.salaries, appState.housingFundRate, specialMonthly,
    appState.specialDeductions.medicalAnnual,
    appState.siBaseCap, appState.siBaseFloor
  );
  const opt = calcYearEndBonusOptimization(bonus, salaryResult.summary, specialMonthly);

  if (!opt) {
    container.innerHTML = '<p class="hint">请输入有效金额</p>';
    return;
  }

  const isA = opt.recommended === '单独计税';
  container.innerHTML =
    '<div class="bonus-cards">' +
      '<div class="bonus-card' + (isA ? ' recommended' : '') + '">' +
        (isA ? '<div class="badge">推荐</div>' : '') +
        '<h4>方案A：单独计税</h4>' +
        '<p>应纳税额：<strong>' + fmt(opt.methodA) + ' 元</strong></p>' +
        '<p>税后年终奖：' + fmt(opt.afterTaxA) + ' 元</p>' +
        '<p class="hint-sm">年终奖 ÷ 12 查月度税率表</p>' +
      '</div>' +
      '<div class="bonus-card' + (!isA ? ' recommended' : '') + '">' +
        (!isA ? '<div class="badge">推荐</div>' : '') +
        '<h4>方案B：合并计税</h4>' +
        '<p>应纳税额：<strong>' + fmt(opt.methodB) + ' 元</strong></p>' +
        '<p>税后年终奖：' + fmt(opt.afterTaxB) + ' 元</p>' +
        '<p class="hint-sm">并入全年综合所得计税</p>' +
      '</div>' +
    '</div>' +
    '<div class="bonus-summary">' +
      '<p>推荐方案：<strong>' + opt.recommended + '</strong></p>' +
      '<p>可节省税款：<strong class="saving">' + fmt(opt.saving) + ' 元</strong></p>' +
    '</div>';
}

// ─── 年终奖方案保存 / 历史 ──────────────────────
function saveBonusComparison() {
  const bonus = parseFloat(document.getElementById('bonus-input')?.value) || 0;
  if (bonus <= 0) return;

  const specialMonthly = getSpecialDeductionMonthly(appState.specialDeductions);
  const salaryResult = calcMonthlySalaryTax(
    appState.salaries, appState.housingFundRate, specialMonthly,
    appState.specialDeductions.medicalAnnual,
    appState.siBaseCap, appState.siBaseFloor
  );
  const opt = calcYearEndBonusOptimization(bonus, salaryResult.summary, specialMonthly);
  if (!opt) return;

  appState.bonusHistory.unshift({
    id: Date.now(),
    timestamp: new Date().toLocaleString(),
    bonus,
    methodA: opt.methodA,
    methodB: opt.methodB,
    saving: opt.saving,
    recommended: opt.recommended,
  });
  saveState();
  renderBonusHistory();
}

function renderBonusHistory() {
  const container = document.getElementById('bonus-history');
  if (!container) return;
  if (appState.bonusHistory.length === 0) {
    container.innerHTML = '<p class="hint">暂无保存记录</p>';
    return;
  }
  let html = '<div class="tw"><table>' +
    '<tr><th>时间</th><th>年终奖</th><th>单独计税</th><th>合并计税</th><th class="saving">节省</th><th>推荐</th><th></th></tr>';
  appState.bonusHistory.forEach(function (item) {
    html += '<tr>' +
      '<td>' + item.timestamp + '</td>' +
      '<td>' + fmt(item.bonus) + '</td>' +
      '<td>' + fmt(item.methodA) + '</td>' +
      '<td>' + fmt(item.methodB) + '</td>' +
      '<td class="saving">' + fmt(item.saving) + '</td>' +
      '<td>' + item.recommended + '</td>' +
      '<td><button class="btn-small" onclick="window.__deleteBonusHistory(' + item.id + ')">删除</button></td>' +
      '</tr>';
  });
  html += '</table></div>';
  container.innerHTML = html;
}

// 挂到 window 上供 onclick 回调（ES module 作用域隔离）
window.__deleteBonusHistory = function (id) {
  appState.bonusHistory = appState.bonusHistory.filter(function (item) { return item.id !== id; });
  saveState();
  renderBonusHistory();
};

function loadBonusHistory() {
  renderBonusHistory();
}

// ─── localStorage 持久化 ────────────────────────
const STORAGE_KEY = 'tax-calculator-state';

export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) { /* 忽略存储错误 */ }
}

export function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      appState.salaries = parsed.salaries || new Array(12).fill(0);
      appState.housingFundRate = parsed.housingFundRate ?? HOUSING_FUND_RATE_DEFAULT;
      appState.siBaseCap = parsed.siBaseCap ?? SI_BASE_CAP_DEFAULT;
      appState.siBaseFloor = parsed.siBaseFloor ?? SI_BASE_FLOOR_DEFAULT;
      appState.specialDeductions = parsed.specialDeductions || appState.specialDeductions;
      appState.bonusHistory = parsed.bonusHistory || [];
    }
  } catch (e) { /* 忽略加载错误 */ }
}
