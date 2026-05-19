let appState = {
  salaries: new Array(12).fill(0),
  housingFundRate: HOUSING_FUND_RATE_DEFAULT,
  specialDeductions: {
    childrenCount: 0, educationAcademic: false, educationVocational: false,
    medicalAnnual: 0, housingLoan: false, housingRent: 0,
    elderlyOnly: false, elderlyShare: false, infantCount: 0,
  },
  bonusHistory: [],
};

function initUI() {
  renderSalaryTable();
  renderSpecialDeductionsForm();
  bindEvents();
  loadBonusHistory();
  updateAll();
}

function renderSalaryTable() {
  const container = document.getElementById('salary-table-body');
  if (!container) return;
  let html = '';
  for (let i = 0; i < 12; i++) {
    html += '<tr>' +
      '<td>' + (i + 1) + '\u6708</td>' +
      '<td><input type="number" class="salary-input" data-month="' + i + '" value="' + (appState.salaries[i] || '') + '" min="0" step="1000" placeholder="0"></td>' +
      '<td class="auto-cell" id="social-' + i + '">0</td>' +
      '<td class="auto-cell" id="housing-' + i + '">0</td>' +
      '<td class="auto-cell" id="special-' + i + '">0</td>' +
      '<td class="auto-cell" id="taxable-' + i + '">0</td>' +
      '<td class="auto-cell" id="tax-month-' + i + '">0</td>' +
      '<td class="auto-cell" id="tax-cum-' + i + '">0</td>' +
      '</tr>';
  }
  container.innerHTML = html;
}

function renderSpecialDeductionsForm() {
  const d = appState.specialDeductions;
  document.getElementById('children-count').value = d.childrenCount || '';
  document.getElementById('education-academic').checked = d.educationAcademic;
  document.getElementById('education-vocational').checked = d.educationVocational;
  document.getElementById('medical-annual').value = d.medicalAnnual || '';
  document.getElementById('housing-loan').checked = d.housingLoan;
  document.getElementById('housing-rent').value = d.housingRent || 0;
  document.getElementById('elderly-only').checked = d.elderlyOnly;
  document.getElementById('elderly-share').checked = d.elderlyShare;
  document.getElementById('infant-count').value = d.infantCount || '';
}

function bindEvents() {
  document.addEventListener('input', function (e) {
    if (e.target.classList.contains('salary-input')) {
      const month = parseInt(e.target.dataset.month);
      appState.salaries[month] = parseFloat(e.target.value) || 0;
      saveState();
      updateAll();
    }
  });

  document.getElementById('housing-fund-rate').addEventListener('input', function () {
    appState.housingFundRate = parseFloat(this.value);
    document.getElementById('housing-fund-label').textContent = this.value + '%';
    saveState();
    updateAll();
  });

  document.getElementById('children-count').addEventListener('input', function () {
    appState.specialDeductions.childrenCount = parseInt(this.value) || 0;
    saveState();
    updateAll();
  });
  document.getElementById('education-academic').addEventListener('change', function () {
    appState.specialDeductions.educationAcademic = this.checked;
    saveState();
    updateAll();
  });
  document.getElementById('education-vocational').addEventListener('change', function () {
    appState.specialDeductions.educationVocational = this.checked;
    saveState();
    updateAll();
  });
  document.getElementById('medical-annual').addEventListener('input', function () {
    appState.specialDeductions.medicalAnnual = parseFloat(this.value) || 0;
    saveState();
    updateAll();
  });
  document.getElementById('housing-loan').addEventListener('change', function () {
    appState.specialDeductions.housingLoan = this.checked;
    updateSpecialDeductions();
    saveState();
    updateAll();
  });
  document.getElementById('housing-rent').addEventListener('change', function () {
    appState.specialDeductions.housingRent = parseInt(this.value) || 0;
    updateSpecialDeductions();
    saveState();
    updateAll();
  });
  document.getElementById('elderly-only').addEventListener('change', function () {
    appState.specialDeductions.elderlyOnly = this.checked;
    if (this.checked) document.getElementById('elderly-share').checked = false;
    saveState();
    updateAll();
  });
  document.getElementById('elderly-share').addEventListener('change', function () {
    appState.specialDeductions.elderlyShare = this.checked;
    if (this.checked) document.getElementById('elderly-only').checked = false;
    saveState();
    updateAll();
  });
  document.getElementById('infant-count').addEventListener('input', function () {
    appState.specialDeductions.infantCount = parseInt(this.value) || 0;
    saveState();
    updateAll();
  });

  document.getElementById('bonus-input').addEventListener('input', function () {
    updateBonusResult();
  });
  document.getElementById('save-bonus-btn').addEventListener('click', saveBonusComparison);

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(this.dataset.tab).classList.add('active');
    });
  });
}

function updateSpecialDeductions() {
  const d = appState.specialDeductions;
  if (d.housingLoan) document.getElementById('housing-rent').value = 0;
  if (d.housingRent) document.getElementById('housing-loan').checked = false;
}

function updateAll() {
  const hfRate = appState.housingFundRate;
  const specialMonthly = getSpecialDeductionMonthly(appState.specialDeductions);
  const result = calcMonthlySalaryTax(appState.salaries, hfRate, specialMonthly, appState.specialDeductions.medicalAnnual);

  for (let i = 0; i < 12; i++) {
    const m = result.months[i];
    document.getElementById('social-' + i).textContent = m ? m.socialInsurance.toFixed(2) : '0';
    document.getElementById('housing-' + i).textContent = m ? m.housingFund.toFixed(2) : '0';
    document.getElementById('special-' + i).textContent = specialMonthly.toFixed(2);
    document.getElementById('taxable-' + i).textContent = m ? m.taxableIncome.toFixed(2) : '0';
    document.getElementById('tax-month-' + i).textContent = m ? m.taxThisMonth : '0';
    document.getElementById('tax-cum-' + i).textContent = m ? m.taxCumulative : '0';
  }

  const s = result.summary;
  document.getElementById('summary-total-salary').textContent = s.totalSalary.toLocaleString();
  document.getElementById('summary-total-social').textContent = s.totalSocial.toLocaleString();
  document.getElementById('summary-total-housing').textContent = s.totalHousing.toLocaleString();
  document.getElementById('summary-total-special').textContent = s.totalSpecial.toLocaleString();
  document.getElementById('summary-total-tax').textContent = s.totalTax.toLocaleString();
  document.getElementById('summary-after-tax').textContent = s.afterTax.toLocaleString();
  document.getElementById('summary-avg-rate').textContent = (s.averageRate * 100).toFixed(2) + '%';

  updateBonusResult();
}

function updateBonusResult() {
  const bonusInput = document.getElementById('bonus-input');
  const bonus = parseFloat(bonusInput.value) || 0;
  const container = document.getElementById('bonus-result');

  if (bonus <= 0) {
    container.innerHTML = '<p class="hint">\u8BF7\u8F93\u5165\u5E74\u7EC8\u5956\u91D1\u989D\u67E5\u770B\u65B9\u6848\u5BF9\u6BD4</p>';
    return;
  }

  const hfRate = appState.housingFundRate;
  const specialMonthly = getSpecialDeductionMonthly(appState.specialDeductions);
  const salaryResult = calcMonthlySalaryTax(appState.salaries, hfRate, specialMonthly, appState.specialDeductions.medicalAnnual);
  const opt = calcYearEndBonusOptimization(bonus, salaryResult.summary, specialMonthly);

  if (!opt) {
    container.innerHTML = '<p class="hint">\u8BF7\u8F93\u5165\u6709\u6548\u91D1\u989D</p>';
    return;
  }

  const isA = opt.recommended === '\u5355\u72EC\u8BA1\u7A0E';
  container.innerHTML =
    '<div class="bonus-cards">' +
      '<div class="bonus-card' + (isA ? ' recommended' : '') + '">' +
        (isA ? '<div class="badge">\u63A8\u8350</div>' : '') +
        '<h4>\u65B9\u6848A\uFF1A\u5355\u72EC\u8BA1\u7A0E</h4>' +
        '<p>\u5E94\u7EB3\u7A0E\u989D\uFF1A<strong>' + opt.methodA.toLocaleString() + ' \u5143</strong></p>' +
        '<p>\u7A0E\u540E\u91D1\u989D\uFF1A' + opt.afterTaxA.toLocaleString() + ' \u5143</p>' +
      '</div>' +
      '<div class="bonus-card' + (!isA ? ' recommended' : '') + '">' +
        (!isA ? '<div class="badge">\u63A8\u8350</div>' : '') +
        '<h4>\u65B9\u6848B\uFF1A\u5408\u5E76\u8BA1\u7A0E</h4>' +
        '<p>\u5E94\u7EB3\u7A0E\u989D\uFF1A<strong>' + opt.methodB.toLocaleString() + ' \u5143</strong></p>' +
        '<p>\u7A0E\u540E\u91D1\u989D\uFF1A' + opt.afterTaxB.toLocaleString() + ' \u5143</p>' +
      '</div>' +
    '</div>' +
    '<div class="bonus-summary">' +
      '<p>\u63A8\u8350\u65B9\u6848\uFF1A<strong>' + opt.recommended + '</strong></p>' +
      '<p>\u53EF\u8282\u7701\u7A0E\u6B3E\uFF1A<strong class="saving">' + opt.saving.toLocaleString() + ' \u5143</strong></p>' +
    '</div>';
}

function saveBonusComparison() {
  const bonus = parseFloat(document.getElementById('bonus-input').value) || 0;
  if (bonus <= 0) return;
  const hfRate = appState.housingFundRate;
  const specialMonthly = getSpecialDeductionMonthly(appState.specialDeductions);
  const salaryResult = calcMonthlySalaryTax(appState.salaries, hfRate, specialMonthly, appState.specialDeductions.medicalAnnual);
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
    container.innerHTML = '<p class="hint">\u6682\u65E0\u4FDD\u5B58\u8BB0\u5F55</p>';
    return;
  }
  let html = '<table><tr><th>\u65F6\u95F4</th><th>\u5E74\u7EC8\u5956</th><th>\u5355\u72EC\u8BA1\u7A0E</th><th>\u5408\u5E76\u8BA1\u7A0E</th><th>\u8282\u7701</th><th>\u63A8\u8350</th><th></th></tr>';
  appState.bonusHistory.forEach(function (item) {
    html += '<tr>' +
      '<td>' + item.timestamp + '</td>' +
      '<td>' + item.bonus.toLocaleString() + '</td>' +
      '<td>' + item.methodA.toLocaleString() + '</td>' +
      '<td>' + item.methodB.toLocaleString() + '</td>' +
      '<td class="saving">' + item.saving.toLocaleString() + '</td>' +
      '<td>' + item.recommended + '</td>' +
      '<td><button class="btn-small" onclick="deleteBonusHistory(' + item.id + ')">\u5220\u9664</button></td>' +
      '</tr>';
  });
  html += '</table>';
  container.innerHTML = html;
}

function deleteBonusHistory(id) {
  appState.bonusHistory = appState.bonusHistory.filter(function (item) { return item.id !== id; });
  saveState();
  renderBonusHistory();
}

function loadBonusHistory() {
  renderBonusHistory();
}

var STORAGE_KEY = 'tax-calculator-state';

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {}
}

function loadState() {
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      var parsed = JSON.parse(saved);
      appState.salaries = parsed.salaries || new Array(12).fill(0);
      appState.housingFundRate = parsed.housingFundRate || HOUSING_FUND_RATE_DEFAULT;
      appState.specialDeductions = parsed.specialDeductions || appState.specialDeductions;
      appState.bonusHistory = parsed.bonusHistory || [];
    }
  } catch (e) {}
}
