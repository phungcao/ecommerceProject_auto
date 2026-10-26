import { Locator, Page } from '@playwright/test';

export abstract class BasePage {
  abstract readonly path: string;

  constructor(protected readonly page: Page) {}

  async goto(customPath?: string): Promise<void> {
    await this.page.goto(customPath ?? this.path, { waitUntil: 'domcontentloaded' });
    const isHeavyLoad = await this.page
      .locator("//h2[contains(., 'This website is under heavy load')]")
      .isVisible()
      .catch(() => false);
    if (isHeavyLoad) {
      await this.page.reload({ waitUntil: 'domcontentloaded' });
    }
  }

  /**
   * Kiểm tra trạng thái HTML5 Constraint Validation của một input/select element.
   * Dùng chung cho tất cả Page Objects (Login, Signup, v.v.)
   */
  async checkFieldValidity(locator: Locator): Promise<{
    valid: boolean;
    valueMissing: boolean;
    typeMismatch: boolean;
    validationMessage: string;
  }> {
    return locator.evaluate((el: HTMLInputElement | HTMLSelectElement) => ({
      valid: el.checkValidity(),
      valueMissing: el.validity.valueMissing,
      typeMismatch: 'typeMismatch' in el.validity ? (el as HTMLInputElement).validity.typeMismatch : false,
      validationMessage: el.validationMessage,
    }));
  }
}
