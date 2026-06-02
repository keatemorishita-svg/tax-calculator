# 个人所得税计算器 · Tax Calculator

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub release](https://img.shields.io/badge/release-v1.0.0-green)](https://github.com/keatemorishita-svg/tax-calculator/releases)

A **Chinese Individual Income Tax (IIT) calculator** built with vanilla JavaScript. Computes monthly withholding tax for salary income and optimizes year-end bonus taxation. Based on China's 2019 tax reform, valid through 2026.

基于 2019 年新个税法的中国个人所得税计算器。支持工资薪金逐月预扣税模拟、年终奖计税方案对比优化。

---

## Features · 功能

- **Monthly Payroll Simulation** — 12-month cumulative withholding calculation with social insurance & housing fund deductions
- **Year-End Bonus Optimization** — compares Separate vs. Consolidated taxation methods, recommends the lower-tax option
- **Social Insurance Base Caps** — configurable ceiling/floor for contribution base to match local city policies
- **8 Special Deductions** — child education, continuing education, housing loan interest / rent, elderly care, infant care, major medical
- **localStorage Persistence** — salary data, deduction settings, and bonus comparison history auto-saved
- **Zero Dependencies** — a single static page, no framework, no build step

---

## Supported Special Deductions · 专项附加扣除

| Deduction · 扣除项 | Standard · 标准 |
|----------------------|------------------|
| Child Education · 子女教育 | ¥2,000/month per child |
| Continuing Education (Academic) · 学历继续教育 | ¥400/month |
| Continuing Education (Vocational) · 职业资格 | ¥3,600/year |
| Housing Loan Interest · 住房贷款利息 | ¥1,000/month |
| Housing Rent · 住房租金 | ¥800–1,500/month (city tier) |
| Elderly Care (Only Child) · 独生赡养 | ¥3,000/month |
| Elderly Care (Non-Only) · 非独生赡养 | ≤¥1,500/month |
| Infant Care · 婴幼儿照护 | ¥2,000/month per child |
| Major Medical · 大病医疗 | Excess over ¥15,000/year, cap ¥80,000 |

---

## Quick Start · 快速开始

```bash
# Python 3
python -m http.server 8080

# Node.js
npx serve .
```

Open `http://127.0.0.1:8080` in your browser.

> **Note:** ES modules (`type="module"`) require an HTTP server. Opening `index.html` directly via `file://` will fail due to CORS.

---

## Project Structure · 项目结构

```text
tax-calculator/
├── index.html          # Main page · 主页面
├── styles.css          # Stylesheet · 样式
├── js/
│   ├── app.js          # Entry point · 入口
│   ├── calculator.js   # Tax computation core · 个税计算核心
│   ├── tax-tables.js   # Tax brackets & constants · 税率表
│   └── ui.js           # UI rendering & state management · 界面逻辑
├── LICENSE
├── CONTRIBUTING.md
└── README.md
```

---

## Tech Stack · 技术栈

| Layer | Choice |
|---|---|
| UI | HTML5 + CSS3 (custom properties, grid, flexbox) |
| Logic | Vanilla JavaScript (ES modules) |
| State | localStorage |
| Runtime | Browser, zero server-side dependency |

---

## Roadmap · 未来计划

- [ ] PWA support for offline use
- [ ] Multi-city social insurance base presets
- [ ] Labor income & author royalty tax modules
- [ ] Export annual summary as PDF/image
- [ ] AI-powered tax optimization suggestions (via OpenAI API)
- [ ] International tax residency comparison

---

## Contributing · 参与贡献

Bug reports, feature requests, and pull requests are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Issues 和 PR 都欢迎，详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## Disclaimer · 免责声明

This calculator is for personal reference only and does not constitute tax advice. Actual tax liability is determined by the tax authorities. Tax brackets are based on the 2019 PRC Individual Income Tax Law — please monitor for future policy changes.

本计算器仅供个人参考，不构成税务建议。实际纳税金额以税务机关核定为准。

---

## License · 许可证

[MIT](LICENSE)
