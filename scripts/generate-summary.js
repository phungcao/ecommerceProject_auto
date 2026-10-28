const fs = require('fs');
const path = require('path');

const resultsPath = path.resolve(__dirname, '../playwright-report/results.json');
const summaryPath = process.env.GITHUB_STEP_SUMMARY;

let stats = { expected: 0, unexpected: 0, flaky: 0, skipped: 0, duration: 0 };
const failedTests = [];

if (fs.existsSync(resultsPath)) {
  try {
    const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    if (data.stats) {
      stats = data.stats;
    }

    function findFailures(suite) {
      if (suite.specs) {
        for (const spec of suite.specs) {
          if (!spec.ok) {
            failedTests.push(`- ❌ **${spec.title}** (${suite.title})`);
          }
        }
      }
      if (suite.suites) {
        suite.suites.forEach(findFailures);
      }
    }

    if (data.suites) {
      data.suites.forEach(findFailures);
    }
  } catch (err) {
    console.error('Failed to parse results.json:', err);
  }
}

const total = stats.expected + stats.unexpected + stats.flaky + stats.skipped;
const isSuccess = stats.unexpected === 0;
const statusBadge = isSuccess ? '✅ PASSED' : '❌ FAILED';
const durationSec = Math.round(stats.duration / 1000);
const durationFormatted = `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`;

const eventName = process.env.GITHUB_EVENT_NAME || 'workflow_dispatch';
let triggerLabel = '⚡ Manual Trigger (Regression)';
if (eventName === 'schedule') {
  triggerLabel = '🕒 Daily Scheduled Run (09:15 AM ICT / 02:15 AM UTC)';
} else if (eventName === 'push') {
  triggerLabel = '🚀 New Commit / Push (Full Regression)';
} else if (eventName === 'pull_request') {
  triggerLabel = '🔀 Pull Request (Full Regression)';
}

const commitSha = process.env.GITHUB_SHA ? process.env.GITHUB_SHA.substring(0, 7) : 'local';
const branch = process.env.GITHUB_REF_NAME || 'main';

let md = `## 🎭 Playwright Regression Test Report

### Kết Quả Tổng Thể: **${statusBadge}**

| Chỉ số (Metric) | Giá trị (Value) |
| :--- | :--- |
| **Tổng số test (Total)** | **${total}** |
| ✅ **Passed** | ${stats.expected} |
| ❌ **Failed** | ${stats.unexpected} |
| ⚠️ **Flaky (Passed on retry)** | ${stats.flaky} |
| ⏭️ **Skipped** | ${stats.skipped} |
| ⏱️ **Thời gian chạy (Duration)** | ${durationFormatted} |

### 📌 Thông Tin Thực Thi
- **Kích hoạt bởi:** ${triggerLabel}
- **Nhánh (Branch):** \`${branch}\`
- **Commit:** \`${commitSha}\`
- **Môi trường:** Ubuntu 24.04 (Noble) - Node.js 22
- **Trình duyệt kiểm thử:** Chromium, WebKit
`;

if (failedTests.length > 0) {
  md += `\n### ❌ Danh Sách Test Thất Bại\n${failedTests.slice(0, 15).join('\n')}\n`;
  if (failedTests.length > 15) {
    md += `\n*...và ${failedTests.length - 15} test khác (xem chi tiết trong artifact report).*`;
  }
}

md += `\n> 📥 Tải artifact **\`playwright-report\`** bên dưới trang này để xem Trace Viewer và Screenshots chi tiết.\n`;

if (summaryPath) {
  fs.appendFileSync(summaryPath, md);
} else {
  console.log(md);
}
