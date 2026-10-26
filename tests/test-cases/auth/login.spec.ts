import { test, expect } from '../../fixtures';
import {
  userData,
  generateUserAccount,
  toApiPayload,
  UserAccount,
} from '../../test-data';

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
    userApi,
  }) => {
    seededUser = generateUserAccount();

    // Chuẩn bị tài khoản hợp lệ qua API (tránh flaky do flow UI đăng ký trước đó)
    const createRes = await userApi.createAccount(toApiPayload(seededUser));
    expect(createRes.body.responseCode).toBe(201);

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
    userApi,
    page,
  }) => {
    seededUser = generateUserAccount();

    // Chuẩn bị tài khoản hợp lệ qua API
    const createRes = await userApi.createAccount(toApiPayload(seededUser));
    expect(createRes.body.responseCode).toBe(201);

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
});
