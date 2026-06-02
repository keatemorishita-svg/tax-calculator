# Contributing to Tax Calculator

Thank you for your interest in contributing! This document outlines the process for contributing to this project.

## Ways to Contribute

- **Report bugs** — open an Issue describing the problem, expected behavior, and steps to reproduce
- **Suggest features** — open an Issue with the `enhancement` label describing your idea
- **Fix tax data** — China's tax policies evolve; help keep brackets and deduction standards current
- **Improve UI/UX** — accessibility, mobile responsiveness, i18n
- **Write tests** — add test cases for edge cases in tax computation

## Development Setup

```bash
git clone https://github.com/keatemorishita-svg/tax-calculator.git
cd tax-calculator
python -m http.server 8080   # or any static file server
```

Open `http://127.0.0.1:8080`. No build step, no dependencies.

## Project Architecture

```
index.html  ───  Entry point, loads js/app.js as ES module
styles.css  ───  All styles (CSS custom properties, no preprocessor)

js/
├── app.js           ───  Boot: loadState() → initUI()
├── tax-tables.js    ───  Constants: tax brackets, deduction standards, rates
├── calculator.js    ───  Pure functions: tax computation, no DOM access
└── ui.js            ───  DOM rendering, event binding, localStorage state
```

## Code Conventions

- **Vanilla JavaScript** — no frameworks, no libraries, keep it zero-dependency
- **ES modules** — use `export`/`import`, keep global scope clean
- **Chinese comments** — code comments may be in Chinese or English
- **CSS custom properties** — use `var(--primary)` etc., no hardcoded colors in components

## Pull Request Process

1. Fork the repository and create a feature branch
2. Make your changes, keeping each PR focused on a single concern
3. Test manually by serving `index.html` and verifying all calculations
4. Ensure no syntax errors: `node --check js/*.js`
5. Open a PR with a clear description of what changed and why

## Tax Policy Updates

China's tax rates and deduction standards are encoded in `js/tax-tables.js`. When updating:

- Verify changes against official State Taxation Administration announcements
- Add a comment noting the effective date of the policy change
- Update the README deduction table if amounts change

## Code of Conduct

- Be respectful and constructive
- Assume good faith
- Focus on the code, not the person

## Questions?

Open an Issue or start a Discussion on the repository.

---

# 参与贡献（中文）

欢迎贡献！你可以：

- 提交 Bug 报告或功能建议（Issue）
- 修正税率表数据（个税政策变化时）
- 改进 UI/UX、移动端适配
- 补充测试用例
