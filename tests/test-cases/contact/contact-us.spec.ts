import path from 'path';
import { test, expect } from '../../fixtures';
import { contactData } from '../../test-data';

test.describe('Contact Us Feature (TC-06)', () => {
  test('[TC-06] Gửi biểu mẫu liên hệ thành công (Contact Us Form)', async ({
    homePage,
    contactUsPage,
    page,
  }) => {
    const uploadFilePath = path.resolve(__dirname, '../../test-data/data/sample-upload.txt');

    // 1-3. Đi đến trang chủ và xác nhận hiển thị
    await homePage.goto();
    await expect(homePage.sliderCarousel).toBeVisible();

    // 4-5. Bấm 'Contact Us' và xác nhận 'GET IN TOUCH' hiển thị
    await homePage.header.navigateToContactUs();
    await expect(contactUsPage.getInTouchHeading).toBeVisible();

    // 6-9. Điền form, tải file và gửi thông tin kèm xác nhận dialog
    await contactUsPage.submitContactForm({
      ...contactData.validContact,
      filePath: uploadFilePath,
    });

    // 10. Xác nhận thông báo thành công
    await expect(contactUsPage.successAlert).toBeVisible();
    await expect(contactUsPage.successAlert).toContainText(
      'Success! Your details have been submitted successfully.',
    );

    // 11. Bấm nút 'Home' và xác nhận trở lại trang chủ
    await contactUsPage.clickHome();
    await expect(page).toHaveURL(/\/?$/);
    await expect(homePage.sliderCarousel).toBeVisible();
  });
});
