import { test, expect } from '../../fixtures';

test.describe('Home Page Feature (TC-10)', () => {
  test('[TC-10] Xác nhận tính năng Subscription tại Trang chủ (Verify Subscription in home page)', async ({
    homePage,
  }) => {
    // 1-3. Đi đến trang chủ và xác nhận hiển thị
    await homePage.goto();
    await expect(homePage.sliderCarousel).toBeVisible();

    // 4-5. Cuộn xuống footer và xác nhận tiêu đề 'SUBSCRIPTION'
    await homePage.footer.subscriptionHeading.scrollIntoViewIfNeeded();
    await expect(homePage.footer.subscriptionHeading).toBeVisible();

    // 6-7. Nhập email ngẫu nhiên và bấm nút gửi subscription
    const dynamicEmail = `subscriber_${Date.now()}@testdomain.com`;
    await homePage.subscribe(dynamicEmail);

    // Xác nhận thông báo thành công
    await expect(homePage.footer.subscriptionSuccessMsg).toBeVisible();
    await expect(homePage.footer.subscriptionSuccessMsg).toContainText(
      'You have been successfully subscribed!',
    );
  });
});
