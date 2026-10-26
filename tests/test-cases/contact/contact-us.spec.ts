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

  test('[TC-06-NEG] Thiếu trường bắt buộc email kích hoạt HTML5 validation ngăn submit form', async ({
    contactUsPage,
  }) => {
    await contactUsPage.goto();
    await expect(contactUsPage.getInTouchHeading).toBeVisible();

    // Bấm submit khi form để trống email
    await contactUsPage.nameInput.fill('Nguyen Van A');
    await contactUsPage.subjectInput.fill('Hoi dap');
    await contactUsPage.messageTextarea.fill('Noi dung');
    await contactUsPage.submitButton.click();

    // Xác nhận trường Email kích hoạt lỗi valueMissing
    const emailValidity = await contactUsPage.checkFieldValidity(contactUsPage.emailInput);
    expect(emailValidity.valueMissing).toBe(true);
    expect(emailValidity.valid).toBe(false);

    // Xác nhận form không được submit thành công
    await expect(contactUsPage.successAlert).toBeHidden();
  });

  test('[TC-06-NEG] Nhập email không hợp lệ kích hoạt lỗi định dạng typeMismatch', async ({
    contactUsPage,
  }) => {
    await contactUsPage.goto();
    await expect(contactUsPage.getInTouchHeading).toBeVisible();

    await contactUsPage.nameInput.fill('Test User');
    await contactUsPage.emailInput.fill('invalid-email-format');
    await contactUsPage.subjectInput.fill('Subject Test');
    await contactUsPage.messageTextarea.fill('Message content');

    await contactUsPage.submitButton.click();

    // Xác nhận trường Email kích hoạt lỗi typeMismatch
    const emailValidity = await contactUsPage.checkFieldValidity(contactUsPage.emailInput);
    expect(emailValidity.typeMismatch).toBe(true);
    expect(emailValidity.valid).toBe(false);

    // Xác nhận form không được submit thành công
    await expect(contactUsPage.successAlert).toBeHidden();
  });
});
