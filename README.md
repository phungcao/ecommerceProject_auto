# ecommerceProject_auto

Dự án kiểm thử tự động (Automation Testing) hoàn chỉnh cho nền tảng Thương mại Điện tử ([Automation Exercise](https://automationexercise.com)) sử dụng **Playwright** + **TypeScript** theo mô hình **Page Object Model (POM)** kết hợp kiểm thử UI E2E và API Testing.

---

## 🚀 Tính Năng Nổi Bật

- **Kiến trúc Page Object Model (POM)**: Phân tách rõ ràng giữa UI Locators, Page Actions, và Test Cases giúp mã nguồn dễ bảo trì và mở rộng.
- **Hybrid Testing (UI + API)**:
  - **UI E2E**: Luồng xác thực (Login, Signup), Giỏ hàng (Cart), Chi tiết sản phẩm (Product Detail), Tìm kiếm (Search), Liên hệ (Contact Us), Subscription.
  - **API Integration**: REST API Clients cho Products, Brands, User Account CRUD, và Auth verification.
- **Dynamic & Traceable Test Data**: Cơ chế sinh dữ liệu người dùng tự động với ngày sinh hợp lệ (xử lý năm nhuận, số ngày từng tháng), email duy nhất, và địa chỉ thực tế.
- **Tuân thủ OWASP Top 10 & An Toàn Bảo Mật**:
  - Không hardcode thông tin nhạy cảm, mật khẩu hoặc secrets trong mã nguồn (OWASP A07 & CWE-798).
  - Tách biệt cấu hình môi trường bằng `.env` và `.env.example`.
  - Loại trừ toàn bộ báo cáo, video ghi hình, traces, storage states, session tokens khỏi repository (OWASP A01 & A05).
- **CI/CD Tự Động Hóa (GitHub Actions)**:
  - Kiểm thử tự động trên môi trường Ubuntu sạch với caching tối ưu cho `npm` và Playwright browsers.
  - Phân quyền tối thiểu (`permissions: contents: read`) tuân theo nguyên tắc Least Privilege.
  - Tự động hủy các build dư thừa (`cancel-in-progress`) và lưu trữ Playwright HTML Report.

---

## 📁 Cấu Trúc Dự Án

```
├── .github/
│   └── workflows/
│       └── playwright.yml       # GitHub Actions CI/CD pipeline
├── tests/
│   ├── api/                     # API Testing Layer
│   │   ├── clients/             # API Clients (Base, User, Products, Brands)
│   │   ├── models/              # TypeScript interfaces & types
│   │   └── utils/               # API Data helpers
│   ├── fixtures/                # Custom Playwright fixtures (POM & API injection)
│   ├── pages/                   # Page Object classes & components
│   ├── test-cases/              # Test suites
│   │   ├── api/                 # API spec files
│   │   ├── auth/                # Login, Signup specs
│   │   ├── cart/                # Cart specs
│   │   ├── contact/             # Contact Us specs
│   │   ├── home/                # Homepage & Subscription specs
│   │   └── products/            # Products & Search specs
│   └── test-data/               # Test data templates, dictionaries & helpers
├── .env.example                 # Template cấu hình biến môi trường
├── .gitignore                   # Cấu hình loại trừ file nhạy cảm & artifacts
├── eslint.config.mjs            # ESLint flat config
├── package.json
├── playwright.config.ts         # Playwright test configuration
└── tsconfig.json                # TypeScript compiler config
```

---

## 🛠️ Cài Đặt & Chạy Thử Nghiệm

### 1. Cài đặt Dependencies

```bash
npm install
npx playwright install --with-deps
```

### 2. Thiết lập Biến Môi Trường

Sao chép file `.env.example` thành `.env` và điều chỉnh các giá trị nếu cần:

```bash
cp .env.example .env
```

### 3. Thực thi Tests

```bash
# Chạy toàn bộ test suites (Headless)
npm test

# Chạy với giao diện Playwright UI Mode
npm run test:ui

# Chạy một spec cụ thể
npx playwright test tests/test-cases/auth/login.spec.ts

# Xem báo cáo kiểm thử HTML
npx playwright show-report
```

### 4. Kiểm tra Chất lượng Mã Nguồn (Lint & Typecheck)

```bash
# Kiểm tra TypeScript
npm run typecheck

# Kiểm tra ESLint
npm run lint

# Tự động sửa lỗi format & lint
npm run lint:fix
npm run format
```

---

## 🔒 Bảo Mật & OWASP Top 10

Dự án áp dụng các biện pháp bảo mật nhằm ngăn chặn rủi ro rò rỉ dữ liệu:

1. **A01: Broken Access Control & Session Exposure**:
   - Các file session/storage state (`storageState.json`, `*.auth.json`) được cấu hình nghiêm ngặt trong `.gitignore` để không bị đẩy lên repository.
2. **A02: Cryptographic Failures & Credential Isolation**:
   - Mật khẩu và thông tin xác thực sử dụng biến môi trường `TEST_USER_PASSWORD` thông qua `.env` thay vì hardcode.
3. **A05: Security Misconfiguration**:
   - Không commit `test-results/`, `playwright-report/`, `.DS_Store`, hay file log hệ thống.
4. **CI/CD Security Hardening**:
   - Workflow chỉ sử dụng quyền `read` đối với repository content.
   - Secrets được truyền qua GitHub Secrets an toàn.
