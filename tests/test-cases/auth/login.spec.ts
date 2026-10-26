import { test, expect } from '../../fixtures';
import { HomePage } from '../../pages/home.page';
import { LoginPage } from '../../pages/login.page';
import { SignupPage } from '../../pages/signup.page';
import { userData, generateUserAccount, UserAccount } from '../../test-data';

/**
 * Tiện ích khởi tạo tài khoản hợp lệ qua giao diện người dùng
 */
async function registerUserViaUi(
  homePage: HomePage,
  loginPage: LoginPage,
  signupPage: SignupPage,
  user: UserAccount,
): Promise<void> {
  await loginPage.goto();
  await loginPage.signup(user.name, user.email);
  await signupPage.fillAccountDetails(user);
  await signupPage.submitAccountCreation();
  await signupPage.clickContinue();
  await homePage.header.logout();
}

test.describe('Authentication - Login & Logout Feature (TC-02, TC-03, TC-04)', () => {
  let seededUser: UserAccount | null = null;

  test.afterEach(async ({ userApi }) => {
    if (seededUser?.email) {
      try {
        await userApi.deleteAccount({
          email: seededUser.email,
          password: seededUser.password,
        });
      } catch {
        // teardown ignore nếu đã bị xóa trong test
      }
      seededUser = null;
    }
  });

  test('[TC-02] Đăng nhập với email và mật khẩu đúng (Login User with correct email and password)', async ({
    homePage,
    loginPage,
    signupPage,
  }) => {
    seededUser = generateUserAccount();
    await registerUserViaUi(homePage, loginPage, signupPage, seededUser);

    // 1-3. Đi đến trang chủ và xác nhận hiển thị
    await homePage.goto();
    await expect(homePage.sliderCarousel).toBeVisible();

    // 4-5. Bấm vào 'Signup / Login' và xác nhận 'Login to your account'
    await homePage.header.navigateToLogin();
    await expect(loginPage.loginHeading).toBeVisible();

    // 6-7. Nhập email, mật khẩu hợp lệ và bấm Login
    await loginPage.login(seededUser.email, seededUser.password);

    // 8. Xác nhận 'Logged in as <username>' hiển thị
    await expect(homePage.header.loggedInUser).toBeVisible();
    await expect(homePage.header.loggedInUser).toContainText(seededUser.name);

    // 9-10. Bấm 'Delete Account' và xác nhận 'ACCOUNT DELETED!'
    await homePage.header.deleteAccount();
    await expect(signupPage.accountDeletedHeading).toBeVisible();
    seededUser = null; // Đã xóa thành công trong test
  });

  test('[TC-03] Đăng nhập với email hoặc mật khẩu không chính xác (Login User with incorrect email and password)', async ({
    homePage,
    loginPage,
  }) => {
    // 1-3. Đi đến trang chủ
    await homePage.goto();
    await expect(homePage.sliderCarousel).toBeVisible();

    // 4-5. Bấm 'Signup / Login' và xác nhận 'Login to your account'
    await homePage.header.navigateToLogin();
    await expect(loginPage.loginHeading).toBeVisible();

    // 6-7. Nhập sai thông tin đăng nhập và bấm Login
    await loginPage.login(userData.invalidUser.email, userData.invalidUser.password);

    // 8. Xác nhận thông báo lỗi hiển thị
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText('Your email or password is incorrect!');
  });

  test('[TC-04] Đăng xuất tài khoản người dùng (Logout User)', async ({
    homePage,
    loginPage,
    signupPage,
    page,
  }) => {
    seededUser = generateUserAccount();
    await registerUserViaUi(homePage, loginPage, signupPage, seededUser);

    // Điều hướng vào trang Login và đăng nhập
    await loginPage.goto();
    await loginPage.login(seededUser.email, seededUser.password);

    // 1-3. Xác nhận đăng nhập thành công
    await expect(homePage.header.loggedInUser).toBeVisible();

    // 9. Bấm 'Logout'
    await homePage.header.logout();

    // 10. Xác nhận điều hướng về trang Login
    await expect(page).toHaveURL(/.*login/);
    await expect(loginPage.loginHeading).toBeVisible();
  });

  test.describe('Login - Negative Form Validations', () => {
    test.beforeEach(async ({ loginPage }) => {
      await loginPage.goto();
      await expect(loginPage.loginHeading).toBeVisible();
    });

    test('[TC-02-NEG] Để trống email ngăn submit form đăng nhập qua HTML5 validation', async ({
      loginPage,
    }) => {
      await loginPage.login('', 'SomePassword123!');
      const validity = await loginPage.checkFieldValidity(loginPage.emailInput);
      expect(validity.valueMissing).toBe(true);
      expect(validity.valid).toBe(false);
    });

    test('[TC-02-NEG] Để trống mật khẩu ngăn submit form đăng nhập qua HTML5 validation', async ({
      loginPage,
    }) => {
      await loginPage.login('test@example.com', '');
      const validity = await loginPage.checkFieldValidity(loginPage.passwordInput);
      expect(validity.valueMissing).toBe(true);
      expect(validity.valid).toBe(false);
    });

    test('[TC-02-NEG] Email không đúng định dạng kích hoạt lỗi typeMismatch', async ({
      loginPage,
    }) => {
      await loginPage.login('invalid-email-format', 'SomePassword123!');
      const validity = await loginPage.checkFieldValidity(loginPage.emailInput);
      expect(validity.typeMismatch).toBe(true);
      expect(validity.valid).toBe(false);
    });
  });
});
