import { test, expect } from '../../fixtures';
import { generateUserAccount, MANDATORY_ACCOUNT_FIELDS, UserAccount } from '../../test-data';

test.describe('Authentication - Sign Up Feature (@e2e @auth @signup)', () => {
  let seededUser: UserAccount | null = null;

  test.afterEach(async ({ userApi }) => {
    if (seededUser?.email) {
      try {
        await userApi.deleteAccount({
          email: seededUser.email,
          password: seededUser.password,
        });
      } catch {
        // teardown ignore
      }
      seededUser = null;
    }
  });

  /**
   * [TC-01] Đăng ký người dùng mới thành công với toàn bộ thông tin hợp lệ
   */
  test('[TC-01] Register new user successfully with all fields', async ({
    homePage,
    loginPage,
    signupPage,
    page,
  }) => {
    const user = generateUserAccount();

    // 1-3. Đi đến trang chủ và xác nhận hiển thị
    await homePage.goto();
    await expect(homePage.sliderCarousel).toBeVisible();

    // 4-5. Bấm vào 'Signup / Login' và xác nhận tiêu đề 'New User Signup!'
    await homePage.header.navigateToLogin();
    await expect(loginPage.signupHeading).toBeVisible();

    // 6-7. Nhập tên và email rồi bấm Signup
    await loginPage.signup(user.name, user.email);

    // 8. Xác nhận tiêu đề 'ENTER ACCOUNT INFORMATION' hiển thị
    await expect(signupPage.enterAccountInfoHeading).toBeVisible();

    // 9-12. Điền thông tin tài khoản và địa chỉ từ unified UserAccount
    await signupPage.fillAccountDetails(user);

    // 13-14. Bấm 'Create Account' và xác nhận 'ACCOUNT CREATED!'
    await signupPage.submitAccountCreation();
    await expect(signupPage.accountCreatedHeading).toBeVisible();

    // 15-16. Bấm 'Continue' và xác nhận 'Logged in as <username>'
    await signupPage.clickContinue();
    await expect(homePage.header.loggedInUser).toBeVisible();
    await expect(homePage.header.loggedInUser).toContainText(user.name);

    // 17-18. Bấm 'Delete Account', xác nhận 'ACCOUNT DELETED!' và bấm 'Continue'
    await homePage.header.deleteAccount();
    await expect(signupPage.accountDeletedHeading).toBeVisible();
    await signupPage.clickContinue();
    await expect(page).toHaveURL(/\/?$/);
  });

  /**
   * [TC-05] Đăng ký với email đã tồn tại (Register User with existing email)
   */
  test('[TC-05] Register User with existing email displays error', async ({
    loginPage,
    userApi,
  }) => {
    // Fast & stable precondition: Seed user via API
    seededUser = generateUserAccount();
    const createRes = await userApi.createAccount({
      name: seededUser.name,
      email: seededUser.email,
      password: seededUser.password,
      firstname: seededUser.firstName,
      lastname: seededUser.lastName,
      address1: seededUser.address1,
      country: seededUser.country,
      state: seededUser.state,
      city: seededUser.city,
      zipcode: seededUser.zipcode,
      mobile_number: seededUser.mobileNumber,
    });
    expect(createRes.body.responseCode).toBe(201);

    // Attempt to register with existing email on UI
    await loginPage.goto();
    await expect(loginPage.signupHeading).toBeVisible();
    await loginPage.signup('Duplicate Name', seededUser.email);

    // Verify error message
    await expect(loginPage.signupErrorMessage).toBeVisible();
    await expect(loginPage.signupErrorMessage).toContainText('Email Address already exist!');
  });

  /**
   * Negative Tests - Stage 1 (Trang Login / Initial Signup Form):
   * Kiểm tra validation khi thiếu Name, thiếu Email, hoặc Email không đúng định dạng
   */
  test.describe('Sign Up - Stage 1 Negative Validations (/login)', () => {
    test.beforeEach(async ({ loginPage }) => {
      await loginPage.goto();
      await expect(loginPage.signupHeading).toBeVisible();
    });

    test('[SIGNUP-STAGE1-NEG] Missing Name prevents submission via HTML5 validation', async ({
      loginPage,
      page,
    }) => {
      const validEmail = generateUserAccount().email;
      await loginPage.signup('', validEmail);

      const validity = await loginPage.checkFieldValidity(loginPage.signupNameInput);
      expect(validity.valueMissing).toBe(true);
      expect(validity.valid).toBe(false);
      expect(page.url()).toContain('/login');
    });

    test('[SIGNUP-STAGE1-NEG] Missing Email prevents submission via HTML5 validation', async ({
      loginPage,
      page,
    }) => {
      const validName = generateUserAccount().name;
      await loginPage.signup(validName, '');

      const validity = await loginPage.checkFieldValidity(loginPage.signupEmailInput);
      expect(validity.valueMissing).toBe(true);
      expect(validity.valid).toBe(false);
      expect(page.url()).toContain('/login');
    });

    test('[SIGNUP-STAGE1-NEG] Malformed Email prevents submission via HTML5 validation', async ({
      loginPage,
      page,
    }) => {
      const validName = generateUserAccount().name;
      await loginPage.signup(validName, 'not-a-valid-email');

      const validity = await loginPage.checkFieldValidity(loginPage.signupEmailInput);
      expect(validity.typeMismatch).toBe(true);
      expect(validity.valid).toBe(false);
      expect(page.url()).toContain('/login');
    });
  });

  /**
   * Negative Tests - Stage 2 (Trang Signup / Enter Account Information):
   * Tái sử dụng MANDATORY_ACCOUNT_FIELDS: Kiểm tra từng trường bắt buộc khi để trống
   */
  test.describe('Sign Up - Stage 2 Negative Validations (/signup)', () => {
    const stage2Fields = MANDATORY_ACCOUNT_FIELDS.filter((f) => f.uiStage === 'signup');

    for (const field of stage2Fields) {
      test(`[SIGNUP-STAGE2-NEG] Missing mandatory field: ${field.label} (${field.key}) prevents account creation`, async ({
        loginPage,
        signupPage,
        page,
      }) => {
        const user = generateUserAccount();

        // 1. Bước khởi tạo qua /login
        await loginPage.goto();
        await loginPage.signup(user.name, user.email);
        await expect(signupPage.enterAccountInfoHeading).toBeVisible();

        // 2. Điền thông tin với trường bắt buộc này bị bỏ trống (empty string)
        const partialData = { ...user, [field.key]: '' };
        await signupPage.fillAccountDetails(partialData);

        // 3. Bấm Create Account
        await signupPage.submitAccountCreation();

        // 4. Xác nhận trường bị lỗi validation và form KHÔNG được submit
        const targetLocator = signupPage.getFieldLocator(field.key);
        const validity = await signupPage.checkFieldValidity(targetLocator);
        expect(validity.valueMissing).toBe(true);
        expect(validity.valid).toBe(false);

        // Đảm bảo không tạo thành công và vẫn đang ở trang /signup
        await expect(signupPage.accountCreatedHeading).toBeHidden();
        expect(page.url()).toContain('/signup');
      });
    }
  });
});
